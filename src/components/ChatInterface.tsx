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
  ChevronRight,
  Check,
  BookOpen,
  Edit2,
  Copy,
  Download,
  Pencil,
  Plus,
  ArrowLeft,
  BookText,
  AlertCircle,
  X
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
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 300)}px`;
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
    <div className="h-full flex flex-col bg-paper-100">
      {/* Header */}
      <div className="border-b border-ink-200 px-4 bg-white/80 backdrop-blur-md">
        <div className="flex items-center justify-between max-w-4xl mx-auto h-14">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-display font-semibold text-ink-900">
              {currentBook?.title || '小说助手'}
            </h1>
            {currentChapter && (
              <>
                <span className="text-ink-400">·</span>
                <h2 className="text-lg font-display text-ink-700">
                  {currentChapter.title}
                </h2>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSummarizeOutline}
              disabled={!currentBook}
              className="flex items-center gap-1 text-sm px-3 py-1.5 bg-minghuang-50 text-minghuang-700 rounded-lg hover:bg-minghuang-100 transition-colors disabled:opacity-50"
            >
              <BookText size={16} />
              大纲总结
            </button>
            <button
              onClick={() => setShowBookReader(true)}
              className="flex items-center gap-1 text-sm px-3 py-1.5 bg-minghuang-50 text-minghuang-700 rounded-lg hover:bg-minghuang-100 transition-colors"
            >
              <BookOpen size={16} />
              阅读
            </button>
            <button
              onClick={handleDownloadBook}
              className="flex items-center gap-1 text-sm px-3 py-1.5 bg-yexing-50 text-yexing-700 rounded-lg hover:bg-yexing-100 transition-colors"
            >
              <Download size={16} />
              下载
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        <div className="max-w-4xl mx-auto">
          {chapterHistory.length === 0 ? (
            <div className="text-center py-16 text-ink-400">
              <Sparkles size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-display">开始您的创作之旅</p>
              <p className="text-sm mt-2">输入指令，让AI帮您创作小说</p>
            </div>
          ) : (
            <div className="relative">
              {/* Navigation Arrows */}
              {chapterHistory.length > 10 && (
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCurrentViewIndex(prev => Math.max(0, prev - 10))}
                    disabled={currentViewIndex === 0}
                    className="flex items-center gap-1 text-sm text-minghuang-600 hover:text-minghuang-700 disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                    上一页
                  </button>
                  <span className="text-sm text-ink-400">
                    显示 {currentViewIndex + 1} - {Math.min(currentViewIndex + 10, chapterHistory.length)} 条
                  </span>
                  <button
                    onClick={() => setCurrentViewIndex(prev => Math.min(prev + 10, chapterHistory.length - 1))}
                    disabled={currentViewIndex >= chapterHistory.length - 10}
                    className="flex items-center gap-1 text-sm text-minghuang-600 hover:text-minghuang-700 disabled:opacity-50"
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
                    className={`flex gap-3 p-4 rounded-2xl transition-all ${
                      item.role === 'user' 
                        ? 'bg-minghuang-500 text-ink-950 ml-auto' 
                        : 'bg-white border border-ink-100 shadow-paper'
                    }`}
                    style={{ maxWidth: '85%' }}
                    onMouseEnter={() => toggleActions(item.id)}
                    onMouseLeave={() => toggleActions(item.id)}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.role === 'user' ? 'bg-minghuang-400' : 'bg-yexing-100'
                    }`}>
                      {item.role === 'user' ? (
                        <span className="text-ink-800 font-medium">您</span>
                      ) : (
                        <Sparkles size={18} className="text-yexing-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {item.role === 'assistant' && item.thinking && (
                        <div className="mb-3">
                          <button
                            onClick={() => toggleThinking(item.id)}
                            className="flex items-center gap-1 text-xs text-ink-400 hover:text-ink-600"
                          >
                            {expandedThinking.has(item.id) ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            思考过程
                          </button>
                          {expandedThinking.has(item.id) && (
                            <div className="text-sm text-ink-600 bg-paper-200 p-3 rounded-xl italic mt-1 whitespace-pre-wrap">
                              {item.thinking}
                            </div>
                          )}
                        </div>
                      )}
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full input-field resize-none"
                            rows={6}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setEditingMessageId(null); setEditingContent(''); }}
                              className="text-sm px-3 py-1.5 bg-ink-100 text-ink-600 rounded-lg hover:bg-ink-200"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => handleSaveEdit(item.id)}
                              className="text-sm px-3 py-1.5 bg-minghuang-500 text-ink-950 rounded-lg hover:bg-minghuang-400"
                            >
                              保存
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-ink-800 whitespace-pre-wrap font-serif leading-relaxed">
                            {displayContent}
                          </div>
                          {isLong && (
                            <button
                              onClick={() => toggleExpand(item.id)}
                              className="flex items-center gap-1 text-sm text-minghuang-600 mt-2 hover:text-minghuang-700"
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              {isExpanded ? '收起' : '展开全文'}
                            </button>
                          )}
                        </>
                      )}
                      <div className={`flex flex-wrap items-center gap-2 mt-2 transition-opacity ${
                        showActions.has(item.id) ? 'opacity-100' : 'opacity-0'
                      }`}>
                        {item.role === 'assistant' && !isEditing && (
                          <>
                            <div className="relative">
                              <button
                                onClick={() => setShowAdoptMenu(showAdoptMenu === item.id ? null : item.id)}
                                className="flex items-center gap-1 text-xs px-2 py-1.5 bg-minghuang-500 text-ink-950 rounded-lg hover:bg-minghuang-400 transition-colors"
                              >
                                <Check size={12} />
                                采纳
                              </button>
                              {showAdoptMenu === item.id && (
                                <div className="absolute top-full left-0 mt-1 bg-white border border-ink-200 rounded-xl shadow-warm p-3 z-10 w-56">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-ink-800">采纳到章节</span>
                                    <button onClick={() => setShowAdoptMenu(null)} className="text-ink-400 hover:text-ink-600">
                                      <X size={14} />
                                    </button>
                                  </div>
                                  <div className="mb-3">
                                    <select
                                      value={selectedChapterForAdopt || currentChapterId || ''}
                                      onChange={(e) => setSelectedChapterForAdopt(e.target.value)}
                                      className="w-full input-field text-sm"
                                    >
                                      {bookChapters.map(chapter => (
                                        <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex gap-2 mb-3">
                                    <button
                                      onClick={() => setAdoptMode('append')}
                                      className={`flex-1 text-sm px-3 py-2 rounded-lg ${adoptMode === 'append' ? 'bg-minghuang-500 text-ink-950' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}
                                    >
                                      追加
                                    </button>
                                    <button
                                      onClick={() => setAdoptMode('overwrite')}
                                      className={`flex-1 text-sm px-3 py-2 rounded-lg ${adoptMode === 'overwrite' ? 'bg-minghuang-500 text-ink-950' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}
                                    >
                                      覆盖
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => handleAdopt(item.content, item.id)}
                                    className="w-full text-sm px-4 py-2 bg-yexing-500 text-white rounded-lg hover:bg-yexing-400"
                                  >
                                    确认采纳
                                  </button>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleEditMessage(item)}
                              className="flex items-center gap-1 text-xs px-2 py-1.5 bg-ink-100 text-ink-600 rounded-lg hover:bg-ink-200 transition-colors"
                            >
                              <Edit2 size={12} />
                              编辑
                            </button>
                            <button
                              onClick={() => handleRegenerate(item)}
                              disabled={isGenerating}
                              className="flex items-center gap-1 text-xs px-2 py-1.5 bg-ink-100 text-ink-600 rounded-lg hover:bg-ink-200 transition-colors disabled:opacity-50"
                            >
                              <RotateCcw size={12} />
                              重新生成
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleWithdraw(item)}
                          className="flex items-center gap-1 text-xs px-2 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={12} />
                          撤回
                        </button>
                        <button
                          onClick={() => handleCopyContent(item.content)}
                          className="flex items-center gap-1 text-xs px-2 py-1.5 text-ink-400 hover:bg-ink-50 rounded-lg transition-colors"
                        >
                          <Copy size={12} />
                          复制
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {isGenerating && (
                <div className="flex gap-3 p-4 rounded-2xl bg-white border border-ink-100 shadow-paper">
                  <div className="w-10 h-10 rounded-full bg-yexing-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={18} className="text-yexing-600 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="flex gap-2">
                      <span className="w-2 h-2 bg-minghuang-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-minghuang-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-minghuang-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-ink-500 ml-2">正在生成...</span>
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
        <div className="border-t border-ink-200 bg-white/80 backdrop-blur-md p-3">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <span className="text-sm text-ink-500">已选中文字</span>
            <button
              onClick={handleExpandSelection}
              className="flex items-center gap-1 text-sm px-3 py-1.5 bg-minghuang-500 text-ink-950 rounded-lg hover:bg-minghuang-400 transition-colors"
            >
              <Plus size={14} />
              AI扩写
            </button>
            <button
              onClick={handleRewriteSelection}
              className="flex items-center gap-1 text-sm px-3 py-1.5 bg-yexing-50 text-yexing-700 rounded-lg hover:bg-yexing-100 transition-colors"
            >
              <Pencil size={14} />
              AI改写
            </button>
            <button
              onClick={() => { setSelectedText(''); window.getSelection()?.removeAllRanges(); }}
              className="flex items-center gap-1 text-sm px-3 py-1.5 text-ink-400 hover:bg-ink-50 rounded-lg transition-colors"
            >
              <ArrowLeft size={14} />
              取消
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-ink-200 bg-white/80 backdrop-blur-md p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Upload Options */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-1.5 px-3 py-2 text-sm text-ink-600 hover:bg-ink-50 rounded-lg transition-colors cursor-pointer">
              <Upload size={16} />
              <span>上传文件</span>
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                multiple
                accept=".txt,.md"
              />
            </label>
            <label className="flex items-center gap-1.5 px-3 py-2 text-sm text-ink-600 hover:bg-ink-50 rounded-lg transition-colors cursor-pointer">
              <Image size={16} />
              <span>上传图片</span>
              <input
                type="file"
                onChange={handleImageUpload}
                className="hidden"
                multiple
                accept="image/*"
              />
            </label>
            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <input
                type="text"
                value={learnUrl}
                onChange={(e) => setLearnUrl(e.target.value)}
                placeholder="输入链接学习风格..."
                className="input-field text-sm flex-1"
              />
              <button
                onClick={handleLearnStyle}
                disabled={!learnUrl.trim()}
                className="p-2 bg-minghuang-500 text-ink-950 rounded-lg hover:bg-minghuang-400 transition-colors disabled:opacity-50"
                title="学习链接内容风格"
              >
                <Link2 size={16} />
              </button>
            </div>
            <button
              onClick={handleQuickImprove}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-yexing-500 text-white rounded-lg hover:bg-yexing-400 transition-colors"
            >
              <Sparkles size={16} />
              一键完善
            </button>
          </div>

          {/* File/Image Previews */}
          {fileUploads.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {fileUploads.map((file, index) => (
                <div key={index} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-ink-50 rounded-lg text-sm">
                  <BookOpen size={14} className="text-ink-500" />
                  <span className="text-ink-600 truncate max-w-32">{file.name}</span>
                  <button onClick={() => setFileUploads(prev => prev.filter((_, i) => i !== index))} className="text-red-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Main Input */}
          <div className="flex flex-col gap-3">
            {/* Options */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <select
                  value={generateMode}
                  onChange={(e) => setGenerateMode(e.target.value as any)}
                  className="input-field text-sm px-3 py-2"
                >
                  <option value="continue">续写当前章节</option>
                  <option value="new">新生成内容</option>
                  <option value="chapter">创作新章节</option>
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ink-500">字数:</span>
                  <input
                    type="number"
                    value={wordCount}
                    onChange={(e) => setWordCount(e.target.value)}
                    placeholder="8000"
                    className="input-field text-sm px-3 py-2 w-24"
                  />
                </div>
              </div>
              {!apiSettings.apiKey && (
                <div className="flex items-center gap-1.5 text-sm text-yexing-600">
                  <AlertCircle size={14} />
                  <span>请先配置API密钥</span>
                </div>
              )}
            </div>
            
            {/* Text Input */}
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="输入您的创作指令...\n\n例如：请写一段武侠小说的开篇，主角是一名隐退的杀手"
                  className="w-full input-field resize-none focus:ring-2 focus:ring-minghuang-300"
                  rows={1}
                  style={{ minHeight: '60px', maxHeight: '300px' }}
                  disabled={isGenerating}
                />
              </div>
              {isGenerating ? (
                <button
                  onClick={handleStop}
                  className="btn-yexing flex items-center gap-2 px-6"
                >
                  <Square size={18} fill="currentColor" />
                  暂停
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={!userInput.trim() || !apiSettings.apiKey || !apiSettings.model}
                  className="btn-minghuang flex items-center gap-2 px-6"
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
