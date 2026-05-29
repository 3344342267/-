import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, 
  Upload, 
  Link2, 
  Image, 
  Sparkles, 
  Square, 
  RotateCcw, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  ChevronLeft,
  Check,
  BookOpen,
  Edit2,
  Copy,
  Download,
  Pencil,
  Plus,
  ArrowLeft,
  ChevronRight,
  BookText,
  AlertCircle,
  Wand2,
  RefreshCw,
  FileText,
  Zap
} from 'lucide-react';
import { useStore } from '../store';
import { streamCompletion } from '../utils/api';
import { buildSystemPrompt, buildStyleLearningPrompt } from '../utils/prompts';
import { HistoryItem, Chapter } from '../store/types';
import { BookReader } from './BookReader';

export const ChatInterface: React.FC = () => {
  const {
    books,
    chapters,
    currentBookId,
    currentChapterId,
    history,
    apiSettings,
    modelConfigs,
    presets,
    references,
    isGenerating,
    setIsGenerating,
    abortController,
    setAbortController,
    updateChapter,
    addHistoryItem,
    updateHistoryItem,
    removeHistoryItem,
    addReference,
    saveToStorage,
    settings,
    outlines,
    updateOutline,
  } = useStore();

  const [userInput, setUserInput] = useState('');
  const [wordCount, setWordCount] = useState('8000');
  const [showActions, setShowActions] = useState<Set<string>>(new Set());
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [expandedThinking, setExpandedThinking] = useState<Set<string>>(new Set());
  const [selectedText, setSelectedText] = useState('');
  const [showBookReader, setShowBookReader] = useState(false);
  const [fileUploads, setFileUploads] = useState<File[]>([]);
  const [imageUploads, setImageUploads] = useState<string[]>([]);
  const [learnUrl, setLearnUrl] = useState('');
  const [generateMode, setGenerateMode] = useState<'continue' | 'new' | 'chapter'>('continue');
  const [showPreviewToggle, setShowPreviewToggle] = useState(true);
  const [selectedChapterForAdopt, setSelectedChapterForAdopt] = useState<string>('');
  const [adoptMode, setAdoptMode] = useState<'append' | 'overwrite'>('append');
  const [showAdoptMenu, setShowAdoptMenu] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [showChapterHistory, setShowChapterHistory] = useState(false);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef<string>('');

  const currentBook = books.find(b => b.id === currentBookId);
  const currentChapter = chapters.find(c => c.id === currentChapterId);
  const currentConfig = modelConfigs.find(c => c.id === settings.activeModelConfigId);
  const currentPreset = presets.find(p => p.id === currentConfig?.presetId);
  const chapterHistory = history.filter(h => h.chapterId === currentChapterId);
  const bookChapters = chapters.filter(c => c.bookId === currentBookId).sort((a, b) => a.order - b.order);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chapterHistory, isGenerating]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [userInput]);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const messageElement = container.parentElement?.closest('[data-message-id]');
        if (messageElement) {
          const messageId = messageElement.getAttribute('data-message-id');
          if (messageId) {
            setSelectedText(selection.toString());
            selectionRef.current = messageId;
          }
        }
      } else {
        setSelectedText('');
        selectionRef.current = '';
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  const toggleActions = useCallback((id: string) => {
    setShowActions(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  }, []);

  const toggleThinking = useCallback((id: string) => {
    setExpandedThinking(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  }, []);

  const handleStop = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
  }, [abortController]);

  const handleWithdraw = useCallback((item: HistoryItem) => {
    if (item.role === 'user') {
      setUserInput(item.content);
    }
    removeHistoryItem(item.id);
    saveToStorage();
  }, [removeHistoryItem, saveToStorage]);

  const handleRegenerate = useCallback(async (item: HistoryItem) => {
    if (!apiSettings.apiKey || !apiSettings.model || isGenerating) return;

    const prevItems = chapterHistory.filter(h => h.id !== item.id);
    const userItem = prevItems[prevItems.length - 1];
    
    if (!userItem || userItem.role !== 'user') return;

    setIsGenerating(true);
    const controller = new AbortController();
    setAbortController(controller);

    const systemPrompt = buildSystemPrompt(references, currentPreset, wordCount ? parseInt(wordCount) : undefined);
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...prevItems.map(h => ({ role: h.role as any, content: h.content })),
    ];

    const responseId = Date.now().toString();
    const responseItem: HistoryItem = {
      id: responseId,
      chapterId: currentChapterId || '',
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    addHistoryItem(responseItem);

    try {
      await streamCompletion(
        apiSettings,
        messages,
        (chunk, thinking) => {
          responseItem.content += chunk;
          if (thinking) {
            responseItem.thinking = (responseItem.thinking || '') + thinking;
          }
          updateHistoryItem(responseId, { content: responseItem.content, thinking: responseItem.thinking });
        },
        () => {
          removeHistoryItem(item.id);
          setIsGenerating(false);
          setAbortController(null);
          saveToStorage();
        },
        (error) => {
          console.error('Generation error:', error);
          removeHistoryItem(item.id);
          setIsGenerating(false);
          setAbortController(null);
        },
        controller.signal
      );
    } catch (error) {
      console.error('Error:', error);
      removeHistoryItem(item.id);
      setIsGenerating(false);
      setAbortController(null);
    }
  }, [apiSettings, chapterHistory, references, currentPreset, wordCount, currentChapterId, isGenerating, addHistoryItem, updateHistoryItem, removeHistoryItem, saveToStorage, setIsGenerating, setAbortController]);

  const handleAdopt = useCallback((content: string, messageId: string) => {
    if (!currentChapter && !selectedChapterForAdopt) {
      alert('请先选择一个章节');
      return;
    }

    const targetChapterId = selectedChapterForAdopt || currentChapterId;
    const targetChapter = chapters.find(c => c.id === targetChapterId);
    
    if (!targetChapter) return;

    let newContent = content;
    if (adoptMode === 'append') {
      newContent = targetChapter.content + '\n\n' + content;
    }

    updateChapter(targetChapterId, { content: newContent });
    saveToStorage();
    setShowAdoptMenu(null);
    setSelectedChapterForAdopt('');
    alert('内容已采纳到章节');
  }, [currentChapter, currentChapterId, chapters, selectedChapterForAdopt, adoptMode, updateChapter, saveToStorage]);

  const handleEditMessage = useCallback((item: HistoryItem) => {
    if (item.role !== 'assistant') return;
    setEditingMessageId(item.id);
    setEditingContent(item.content);
  }, []);

  const handleSaveEdit = useCallback((id: string) => {
    updateHistoryItem(id, { content: editingContent });
    setEditingMessageId(null);
    setEditingContent('');
    saveToStorage();
  }, [editingContent, updateHistoryItem, saveToStorage]);

  const handleExpandSelection = useCallback(() => {
    if (!selectedText || !selectionRef.current) return;
    
    const item = chapterHistory.find(h => h.id === selectionRef.current);
    if (!item || item.role !== 'assistant') return;

    setUserInput(`请扩写以下内容，使其更加详细和丰富：\n\n${selectedText}`);
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  }, [selectedText, chapterHistory]);

  const handleRewriteSelection = useCallback(() => {
    if (!selectedText || !selectionRef.current) return;
    
    const item = chapterHistory.find(h => h.id === selectionRef.current);
    if (!item || item.role !== 'assistant') return;

    setUserInput(`请重写以下内容，保持原意但改进表达方式：\n\n${selectedText}`);
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  }, [selectedText, chapterHistory]);

  const handleGenerate = useCallback(async () => {
    if (!apiSettings.apiKey || !apiSettings.model || isGenerating) return;
    if (!userInput.trim()) return;

    setIsGenerating(true);
    const controller = new AbortController();
    setAbortController(controller);

    const systemPrompt = buildSystemPrompt(references, currentPreset, wordCount ? parseInt(wordCount) : undefined);
    let messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    chapterHistory.forEach(h => {
      messages.push({ role: h.role, content: h.content });
    });

    let userMessage = userInput;
    if (generateMode === 'chapter') {
      userMessage = `请根据以下要求创作新章节：\n\n${userInput}\n\n字数要求：约${wordCount}字\n\n请在章节末尾留下悬念或抛出钩子，让读者有继续阅读的欲望。`;
    } else if (generateMode === 'continue') {
      if (currentChapter?.content) {
        userMessage = `请继续创作，基于以下已有内容：\n\n${currentChapter.content.slice(-2000)}\n\n用户指令：${userInput}\n\n字数要求：约${wordCount}字\n\n请保持剧情连贯，在末尾留下悬念。`;
      }
    }

    messages.push({ role: 'user', content: userMessage });

    const responseId = Date.now().toString();
    const responseItem: HistoryItem = {
      id: responseId,
      chapterId: currentChapterId || '',
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    addHistoryItem({
      id: (Date.now() - 1).toString(),
      chapterId: currentChapterId || '',
      role: 'user',
      content: userInput,
      createdAt: new Date().toISOString(),
    });

    addHistoryItem(responseItem);

    try {
      await streamCompletion(
        apiSettings,
        messages,
        (chunk, thinking) => {
          responseItem.content += chunk;
          if (thinking) {
            responseItem.thinking = (responseItem.thinking || '') + thinking;
          }
          updateHistoryItem(responseId, { content: responseItem.content, thinking: responseItem.thinking });
        },
        () => {
          setIsGenerating(false);
          setAbortController(null);
          setUserInput('');
          saveToStorage();
        },
        (error) => {
          console.error('Generation error:', error);
          alert('生成失败: ' + error.message);
          setIsGenerating(false);
          setAbortController(null);
        },
        controller.signal
      );
    } catch (error) {
      console.error('Error:', error);
      setIsGenerating(false);
      setAbortController(null);
    }
  }, [apiSettings, isGenerating, userInput, references, currentPreset, wordCount, chapterHistory, generateMode, currentChapterId, currentChapter, addHistoryItem, updateHistoryItem, saveToStorage, setIsGenerating, setAbortController]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files);
    setFileUploads(prev => [...prev, ...newFiles]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setImageUploads(prev => [...prev, content]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleLearnStyle = async () => {
    if (!learnUrl.trim()) return;
    
    alert('正在学习链接内容的风格...');
    
    try {
      const response = await fetch(learnUrl);
      const text = await response.text();
      
      const reference = {
        id: Date.now().toString(),
        type: 'url' as const,
        title: learnUrl,
        url: learnUrl,
        content: text.slice(0, 10000),
        createdAt: new Date().toISOString(),
      };
      
      addReference(reference);
      saveToStorage();
      setLearnUrl('');
      alert('风格学习完成！已添加到参考列表。');
    } catch (error) {
      console.error('Failed to fetch URL:', error);
      alert('学习失败，请检查链接是否正确');
    }
  };

  const handleQuickImprove = () => {
    if (!userInput.trim()) {
      setUserInput('请完善以下想法：\n\n');
      return;
    }
    setUserInput(`请帮我完善以下创作想法，使其更具体、更有吸引力：\n\n${userInput}`);
  };

  const handleDownloadBook = () => {
    if (!currentBook) return;
    
    const bookChapters = chapters
      .filter(c => c.bookId === currentBook.id)
      .sort((a, b) => a.order - b.order);
    
    const content = bookChapters.map(c => `## ${c.title}\n\n${c.content}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentBook.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    alert('已复制到剪贴板');
  };

  const handleSummarizeOutline = () => {
    if (!currentBook) return;
    
    const bookChapters = chapters
      .filter(c => c.bookId === currentBook.id)
      .sort((a, b) => a.order - b.order);
    
    const content = bookChapters.map(c => `${c.order + 1}. ${c.title}\n${c.content.slice(0, 200)}...`).join('\n\n');
    
    const prompt = `请为以下小说内容生成详细的大纲和总结：\n\n${content}`;
    setUserInput(prompt);
  };

  return (
    <div className="h-full flex flex-col relative z-10">
      {/* Header */}
      <div className="border-b border-white/10 p-4 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {currentBook && (
                <>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center shadow-neon">
                    <BookOpen size={20} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold gradient-text">
                      {currentBook.title}
                    </h1>
                    {currentChapter && (
                      <p className="text-xs text-slate-400">
                        {currentChapter.title}
                      </p>
                    )}
                  </div>
                </>
              )}
              {!currentBook && (
                <>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center shadow-neon">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold gradient-text">
                      神笔 AI
                    </h1>
                    <p className="text-xs text-slate-400">
                      您的智能创作伙伴
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSummarizeOutline}
              disabled={!currentBook}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all disabled:opacity-50"
            >
              <BookText size={16} />
              大纲总结
            </button>
            <button
              onClick={() => setShowBookReader(true)}
              disabled={!currentBook}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:border-violet-500/30 transition-all disabled:opacity-50"
            >
              <BookOpen size={16} />
              阅读
            </button>
            <button
              onClick={handleDownloadBook}
              disabled={!currentBook}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-500/30 hover:shadow-neon transition-all disabled:opacity-50"
            >
              <Download size={16} />
              下载
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
        <div className="max-w-5xl mx-auto">
          {chapterHistory.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-orange-500/20 flex items-center justify-center animate-float">
                <Sparkles size={48} className="text-cyan-400" />
              </div>
              <p className="text-xl text-slate-300 mb-2">开始您的创作之旅</p>
              <p className="text-slate-500 mb-8">输入指令，让AI帮您创作小说</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <button
                  onClick={() => setUserInput('请写一段武侠小说的开篇，主角是一名隐退的杀手')}
                  className="card-enhanced text-left hover:border-cyan-500/30 transition-all"
                >
                  <Wand2 size={20} className="text-cyan-400 mb-2" />
                  <p className="text-slate-200 font-medium mb-1">武侠开篇</p>
                  <p className="text-xs text-slate-500">创作一段精彩的武侠开场</p>
                </button>
                <button
                  onClick={() => setUserInput('请帮我构思一个玄幻小说的世界观设定')}
                  className="card-enhanced text-left hover:border-violet-500/30 transition-all"
                >
                  <FileText size={20} className="text-violet-400 mb-2" />
                  <p className="text-slate-200 font-medium mb-1">世界观设定</p>
                  <p className="text-xs text-slate-500">构建完整的玄幻世界</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="relative space-y-4">
              {/* Navigation Arrows */}
              {chapterHistory.length > 10 && (
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                  <button
                    onClick={() => setCurrentViewIndex(prev => Math.max(0, prev - 10))}
                    disabled={currentViewIndex === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                    上一页
                  </button>
                  <span className="text-sm text-slate-500">
                    显示 {currentViewIndex + 1} - {Math.min(currentViewIndex + 10, chapterHistory.length)} 条
                  </span>
                  <button
                    onClick={() => setCurrentViewIndex(prev => Math.min(prev + 10, chapterHistory.length - 1))}
                    disabled={currentViewIndex >= chapterHistory.length - 10}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
              
              {chapterHistory.slice(currentViewIndex, currentViewIndex + 10).map((item, index) => {
                const isLong = item.content.length > 800;
                const isExpanded = expandedMessages.has(item.id);
                const displayContent = isLong && !isExpanded 
                  ? item.content.slice(0, 800) + '...' 
                  : item.content;
                const isEditing = editingMessageId === item.id;

                return (
                  <div
                    key={item.id}
                    data-message-id={item.id}
                    className={`message-appear flex gap-4 ${
                      item.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                    onMouseEnter={() => toggleActions(item.id)}
                    onMouseLeave={() => toggleActions(item.id)}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      item.role === 'user' 
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-neon' 
                        : 'bg-gradient-to-br from-cyan-500 to-violet-500 shadow-neon'
                    }`}>
                      {item.role === 'user' ? (
                        <span className="text-white font-bold">您</span>
                      ) : (
                        <Sparkles size={22} className="text-white" />
                      )}
                    </div>
                    <div className={`flex-1 max-w-[85%] ${
                      item.role === 'user' ? 'flex flex-col items-end' : ''
                    }`}>
                      {item.role === 'assistant' && item.thinking && (
                        <div className="mb-3">
                          <button
                            onClick={() => toggleThinking(item.id)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs text-violet-400 bg-violet-500/10 rounded-xl hover:bg-violet-500/20 transition-all"
                          >
                            {expandedThinking.has(item.id) ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            思考过程
                          </button>
                          {expandedThinking.has(item.id) && (
                            <div className="mt-2 text-sm text-slate-400 bg-white/5 border border-white/10 p-4 rounded-xl italic whitespace-pre-wrap">
                              {item.thinking}
                            </div>
                          )}
                        </div>
                      )}
                      {isEditing ? (
                        <div className="card-enhanced space-y-3">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-slate-200 resize-none focus:border-cyan-500/50 focus:outline-none transition-all"
                            rows={6}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setEditingMessageId(null); setEditingContent(''); }}
                              className="px-4 py-2 text-sm rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => handleSaveEdit(item.id)}
                              className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:shadow-neon transition-all"
                            >
                              保存
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={`${
                          item.role === 'user' 
                            ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-2xl p-4'
                            : 'card-enhanced'
                        }`}>
                          <div className={`text-slate-200 whitespace-pre-wrap leading-relaxed ${
                            item.role === 'assistant' ? 'font-serif' : ''
                          }`}>
                            {displayContent}
                          </div>
                          {isLong && (
                            <button
                              onClick={() => toggleExpand(item.id)}
                              className="flex items-center gap-1 text-sm text-cyan-400 mt-3 hover:text-cyan-300 transition-colors"
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              {isExpanded ? '收起' : '展开全文'}
                            </button>
                          )}
                        </div>
                      )}
                      <div className={`flex flex-wrap items-center gap-2 mt-3 transition-opacity ${
                        showActions.has(item.id) ? 'opacity-100' : 'opacity-0'
                      }`}>
                        {item.role === 'assistant' && !isEditing && (
                          <>
                            <div className="relative">
                              <button
                                onClick={() => setShowAdoptMenu(showAdoptMenu === item.id ? null : item.id)}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-500/30 hover:shadow-neon transition-all"
                              >
                                <Check size={14} />
                                采纳
                              </button>
                              {showAdoptMenu === item.id && (
                                <div className="absolute top-full mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-neon p-4 z-20 w-64">
                                  <div className="mb-3">
                                    <label className="text-xs text-slate-400 block mb-2">选择章节</label>
                                    <select
                                      value={selectedChapterForAdopt || currentChapterId || ''}
                                      onChange={(e) => setSelectedChapterForAdopt(e.target.value)}
                                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:border-cyan-500/50 focus:outline-none"
                                    >
                                      {bookChapters.map(chapter => (
                                        <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex gap-2 mb-3">
                                    <button
                                      onClick={() => setAdoptMode('append')}
                                      className={`flex-1 text-xs px-3 py-1.5 rounded-xl transition-all ${
                                        adoptMode === 'append' 
                                          ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-500/30' 
                                          : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                      }`}
                                    >
                                      追加
                                    </button>
                                    <button
                                      onClick={() => setAdoptMode('overwrite')}
                                      className={`flex-1 text-xs px-3 py-1.5 rounded-xl transition-all ${
                                        adoptMode === 'overwrite' 
                                          ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-500/30' 
                                          : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                      }`}
                                    >
                                      覆盖
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => handleAdopt(item.content, item.id)}
                                    className="w-full text-sm px-3 py-2 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl hover:shadow-neon transition-all"
                                  >
                                    确认采纳
                                  </button>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleEditMessage(item)}
                              className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-all"
                            >
                              <Edit2 size={14} />
                              编辑
                            </button>
                            <button
                              onClick={() => handleRegenerate(item)}
                              disabled={isGenerating}
                              className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
                              重新生成
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleCopyContent(item.content)}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-all"
                        >
                          <Copy size={14} />
                          复制
                        </button>
                        <button
                          onClick={() => handleWithdraw(item)}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={14} />
                          撤回
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {isGenerating && (
                <div className="flex gap-4 animate-slide-up">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-neon">
                    <Sparkles size={22} className="text-white animate-pulse" />
                  </div>
                  <div className="card-enhanced flex items-center">
                    <div className="flex gap-2">
                      <span className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-3 h-3 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="ml-3 text-slate-400 text-sm">AI 正在思考中...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Selected Text Actions */}
      {selectedText && (
        <div className="border-t border-white/10 bg-gradient-to-r from-slate-900/90 to-slate-900/70 backdrop-blur-xl p-4">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl text-sm text-slate-400 border border-white/10">
              <FileText size={14} />
              <span>已选中文字</span>
            </div>
            <button
              onClick={handleExpandSelection}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-500/30 hover:shadow-neon transition-all"
            >
              <Plus size={14} />
              AI 扩写
            </button>
            <button
              onClick={handleRewriteSelection}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-slate-200 transition-all"
            >
              <Pencil size={14} />
              AI 改写
            </button>
            <button
              onClick={() => { setSelectedText(''); window.getSelection()?.removeAllRanges(); }}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-all"
            >
              <ArrowLeft size={14} />
              取消
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-white/10 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80 backdrop-blur-xl p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Upload Options */}
          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer">
              <Upload size={16} className="text-cyan-400" />
              <span>上传文件</span>
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                multiple
                accept=".txt,.md"
              />
            </label>
            <label className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-violet-500/30 transition-all cursor-pointer">
              <Image size={16} className="text-violet-400" />
              <span>上传图片</span>
              <input
                type="file"
                onChange={handleImageUpload}
                className="hidden"
                multiple
                accept="image/*"
              />
            </label>
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                value={learnUrl}
                onChange={(e) => setLearnUrl(e.target.value)}
                placeholder="输入链接学习风格..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-orange-500/50 focus:outline-none transition-all"
              />
              <button
                onClick={handleLearnStyle}
                disabled={!learnUrl.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-orange-400 hover:text-orange-300 disabled:opacity-50 transition-colors"
              >
                <Link2 size={16} />
              </button>
            </div>
            <button
              onClick={handleQuickImprove}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 rounded-xl border border-cyan-500/30 hover:shadow-neon transition-all"
            >
              <Wand2 size={16} />
              一键完善
            </button>
          </div>

          {/* File/Image Previews */}
          {fileUploads.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {fileUploads.map((file, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm">
                  <BookOpen size={14} className="text-cyan-400" />
                  <span className="text-slate-300 truncate max-w-32">{file.name}</span>
                  <button 
                    onClick={() => setFileUploads(prev => prev.filter((_, i) => i !== index))}
                    className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Main Input */}
          <div className="space-y-4">
            {/* Options */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <select
                  value={generateMode}
                  onChange={(e) => setGenerateMode(e.target.value as any)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 focus:border-cyan-500/50 focus:outline-none transition-all"
                >
                  <option value="continue">续写当前章节</option>
                  <option value="new">新生成内容</option>
                  <option value="chapter">创作新章节</option>
                </select>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">字数:</span>
                  <input
                    type="number"
                    value={wordCount}
                    onChange={(e) => setWordCount(e.target.value)}
                    placeholder="8000"
                    className="w-24 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 focus:border-cyan-500/50 focus:outline-none transition-all"
                  />
                </div>
              </div>
              {!apiSettings.apiKey && (
                <div className="flex items-center gap-2 text-sm text-orange-400">
                  <AlertCircle size={16} />
                  <span>请先配置 API 密钥</span>
                </div>
              )}
            </div>
            
            {/* Text Input */}
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="输入您的创作指令...\n\n例如：请写一段武侠小说的开篇，主角是一名隐退的杀手"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none resize-none transition-all"
                  rows={1}
                  style={{ minHeight: '70px', maxHeight: '200px' }}
                  disabled={isGenerating}
                />
              </div>
              {isGenerating ? (
                <button
                  onClick={handleStop}
                  className="px-6 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium hover:shadow-neon transition-all flex items-center gap-2"
                >
                  <Square size={18} fill="currentColor" />
                  暂停
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={!userInput.trim() || !apiSettings.apiKey || !apiSettings.model}
                  className="px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-medium hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send size={18} />
                  生成
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Book Reader Modal */}
      {showBookReader && <BookReader onClose={() => setShowBookReader(false)} />}
    </div>
  );
};
