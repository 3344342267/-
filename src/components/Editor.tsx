import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Square, RotateCcw, Download, Copy, History, BookMarked, MessageSquare, User, ChevronDown, ChevronUp, ChevronRight, X, Edit3, Type, Eye, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, List, ListOrdered, Quote, MoreHorizontal, Trash2, CheckCircle2, BookOpen, Layout } from 'lucide-react';
import { useStore } from '../store';
import { streamCompletion } from '../utils/api';
import { buildSystemPrompt, buildContinuePrompt, buildOutlinePrompt, buildChapterPrompt, buildRewritePrompt, buildExpandPrompt, buildSummarizePrompt, buildPolishPrompt } from '../utils/prompts';
import { HistoryItem, Outline, ChapterPlan, Preset } from '../store/types';

type ViewMode = 'edit' | 'outline' | 'history' | 'reader';
type TextAction = 'rewrite' | 'expand' | 'summarize' | 'polish';

export const Editor: React.FC = () => {
  const {
    books,
    chapters,
    currentBookId,
    currentChapterId,
    outlines,
    history,
    apiSettings,
    modelConfigs,
    presets,
    settings,
    references,
    isGenerating,
    setIsGenerating,
    abortController,
    setAbortController,
    updateChapter,
    addHistoryItem,
    updateHistoryItem,
    clearHistory,
    addOutline,
    updateOutline,
    saveToStorage,
  } = useStore();

  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [userInput, setUserInput] = useState('');
  const [wordCount, setWordCount] = useState('');
  const [chapterContent, setChapterContent] = useState('');
  const [outlineContent, setOutlineContent] = useState('');
  const [chapterPlans, setChapterPlans] = useState<ChapterPlan[]>([]);
  const [expandedThinking, setExpandedThinking] = useState<Set<string>>(new Set());
  const [showWordCountInput, setShowWordCountInput] = useState(false);
  const [showTextActions, setShowTextActions] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [textActionInput, setTextActionInput] = useState('');
  const [showToolbar, setShowToolbar] = useState(true);
  const [writingStats, setWritingStats] = useState({ words: 0, characters: 0, paragraphs: 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentBook = books.find(b => b.id === currentBookId);
  const currentChapter = chapters.find(c => c.id === currentChapterId);
  const currentOutline = outlines.find(o => o.bookId === currentBookId);
  const currentConfig = modelConfigs.find(c => c.id === settings.activeModelConfigId);
  const currentPreset = presets.find(p => p.id === currentConfig?.presetId);
  const chapterHistory = history.filter(h => h.chapterId === currentChapterId);
  const bookChapters = chapters.filter(c => c.bookId === currentBookId).sort((a, b) => a.order - b.order);

  useEffect(() => {
    if (currentChapter) {
      setChapterContent(currentChapter.content);
    } else {
      setChapterContent('');
    }
  }, [currentChapterId]);

  useEffect(() => {
    if (currentOutline) {
      setOutlineContent(currentOutline.content);
      setChapterPlans(currentOutline.chapterPlans || []);
    } else {
      setOutlineContent('');
      setChapterPlans([]);
    }
  }, [currentBookId]);

  useEffect(() => {
    const text = chapterContent;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim()).length;
    setWritingStats({ words, characters, paragraphs });
  }, [chapterContent]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [chapterHistory, isGenerating]);

  const handleContentChange = (content: string) => {
    setChapterContent(content);
    if (currentChapter) {
      updateChapter(currentChapter.id, { content, updatedAt: new Date().toISOString() });
      saveToStorage();
    }
  };

  const handleSelection = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.substring(start, end);
      if (selected) {
        setSelectedText(selected);
        setShowTextActions(true);
      }
    }
  };

  const toggleThinking = (id: string) => {
    const newSet = new Set(expandedThinking);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedThinking(newSet);
  };

  const handleTextAction = async (action: TextAction) => {
    if (!apiSettings.apiKey || !apiSettings.model || isGenerating || !selectedText) return;
    if (!currentChapterId) {
      alert('请先选择或创建一个章节');
      return;
    }

    setShowTextActions(false);
    setIsGenerating(true);
    const controller = new AbortController();
    setAbortController(controller);

    const systemPrompt = buildSystemPrompt(references, currentPreset || null);
    let prompt = '';

    switch (action) {
      case 'rewrite':
        prompt = buildRewritePrompt(selectedText, textActionInput || '重写这段内容，让它更精彩');
        break;
      case 'expand':
        prompt = buildExpandPrompt(selectedText);
        break;
      case 'summarize':
        prompt = buildSummarizePrompt(selectedText);
        break;
      case 'polish':
        prompt = buildPolishPrompt(selectedText);
        break;
    }

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];

    const responseId = Date.now().toString();
    const responseItem: HistoryItem = {
      id: responseId,
      chapterId: currentChapterId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    addHistoryItem({
      id: (Date.now() - 1).toString(),
      chapterId: currentChapterId,
      role: 'user',
      content: `【${action === 'rewrite' ? '重写' : action === 'expand' ? '扩写' : action === 'summarize' ? '总结' : '润色'}】\n${selectedText}`,
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
          setTextActionInput('');
          setSelectedText('');
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
  };

  const handleGenerate = async (mode: 'continue' | 'new' | 'outline' | 'chapter' = 'continue', targetChapterPlan?: ChapterPlan) => {
    if (!apiSettings.apiKey || !apiSettings.model || isGenerating) return;

    if (mode !== 'outline' && mode !== 'chapter' && !currentChapterId) {
      alert('请先选择或创建一个章节');
      return;
    }

    setIsGenerating(true);
    const controller = new AbortController();
    setAbortController(controller);

    const systemPrompt = buildSystemPrompt(references, currentPreset || null, wordCount ? parseInt(wordCount) : undefined);
    let messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (mode === 'outline') {
      if (!currentBook) return;
      messages.push({
        role: 'user',
        content: buildOutlinePrompt(currentBook.title, currentBook.description),
      });
    } else if (mode === 'chapter' && targetChapterPlan) {
      messages.push({
        role: 'user',
        content: buildChapterPrompt(targetChapterPlan.title, targetChapterPlan.plot, bookChapters),
      });
    } else {
      chapterHistory.forEach(item => {
        messages.push({ role: item.role, content: item.content });
      });

      if (mode === 'continue') {
        messages.push({
          role: 'user',
          content: buildContinuePrompt(chapterContent, userInput || undefined),
        });
      } else if (userInput) {
        messages.push({ role: 'user', content: userInput });
      }
    }

    const responseId = Date.now().toString();
    const responseItem: HistoryItem = {
      id: responseId,
      chapterId: currentChapterId || '',
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    if (mode !== 'outline' && mode !== 'chapter' && userInput) {
      addHistoryItem({
        id: (Date.now() - 1).toString(),
        chapterId: currentChapterId || '',
        role: 'user',
        content: userInput,
        createdAt: new Date().toISOString(),
      });
    }

    if (mode !== 'outline' && mode !== 'chapter') {
      addHistoryItem(responseItem);
    }

    try {
      await streamCompletion(
        apiSettings,
        messages,
        (chunk, thinking) => {
          if (mode === 'outline') {
            setOutlineContent(prev => prev + chunk);
          } else if (mode === 'chapter') {
            setChapterContent(prev => prev + chunk);
          } else {
            responseItem.content += chunk;
            if (thinking) {
              responseItem.thinking = (responseItem.thinking || '') + thinking;
            }
            updateHistoryItem(responseId, { content: responseItem.content, thinking: responseItem.thinking });
          }
        },
        () => {
          setIsGenerating(false);
          setAbortController(null);
          setUserInput('');

          if (mode === 'outline' && currentBook) {
            if (currentOutline) {
              updateOutline(currentOutline.id, { content: outlineContent });
            } else {
              addOutline({
                id: Date.now().toString(),
                bookId: currentBook.id,
                content: outlineContent,
                chapterPlans: [],
                createdAt: new Date().toISOString(),
              });
            }
          } else if (mode === 'chapter' && currentChapter) {
            updateChapter(currentChapter.id, { content: chapterContent, updatedAt: new Date().toISOString() });
          } else if (mode !== 'outline') {
            const newContent = chapterContent + '\n\n' + responseItem.content;
            setChapterContent(newContent);
            if (currentChapter) {
              updateChapter(currentChapter.id, { content: newContent, updatedAt: new Date().toISOString() });
            }
          }
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
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  const handleAdopt = (content: string) => {
    const textarea = textareaRef.current;
    if (textarea && selectedText) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = chapterContent.substring(0, start) + content + chapterContent.substring(end);
      setChapterContent(newContent);
      if (currentChapter) {
        updateChapter(currentChapter.id, { content: newContent, updatedAt: new Date().toISOString() });
      }
    } else {
      const newContent = chapterContent + '\n\n' + content;
      setChapterContent(newContent);
      if (currentChapter) {
        updateChapter(currentChapter.id, { content: newContent, updatedAt: new Date().toISOString() });
      }
    }
    setSelectedText('');
    setShowTextActions(false);
    saveToStorage();
  };

  const handleReplace = (content: string) => {
    setChapterContent(content);
    if (currentChapter) {
      updateChapter(currentChapter.id, { content, updatedAt: new Date().toISOString() });
    }
    saveToStorage();
  };

  const handleDownload = () => {
    if (!currentChapter) return;
    const blob = new Blob([chapterContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentChapter.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(chapterContent);
    alert('已复制到剪贴板');
  };

  const handleClearHistory = () => {
    if (currentChapterId && confirm('确定要清空当前章节的对话历史吗？')) {
      clearHistory(currentChapterId);
      saveToStorage();
    }
  };

  const handleGenerateOutline = () => {
    handleGenerate('outline');
  };

  const handleGenerateChapterFromPlan = (plan: ChapterPlan) => {
    if (!currentChapterId) {
      alert('请先选择或创建一个章节');
      return;
    }
    handleGenerate('chapter', plan);
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText = textarea.value.substring(0, start) + prefix + selectedText + suffix + textarea.value.substring(end);
    
    setChapterContent(newText);
    if (currentChapter) {
      updateChapter(currentChapter.id, { content: newText, updatedAt: new Date().toISOString() });
    }
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
    saveToStorage();
  };

  if (!currentBook) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center p-12 glass rounded-3xl border border-cyan-500/20 shadow-neon">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center animate-pulse-slow">
            <BookMarked size={48} className="text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2">
            选择或创建一本书
          </h2>
          <p className="text-slate-400 mb-6">从左侧面板开始你的创作之旅</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-900/80 backdrop-blur-xl p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-violet-400 to-orange-400 bg-clip-text text-transparent">
              {currentBook.title}
            </h1>
            {currentChapter && (
              <>
                <span className="text-slate-600">·</span>
                <h2 className="text-lg text-slate-300">
                  {currentChapter.title}
                </h2>
              </>
            )}
          </div>
          {currentChapter && (
            <div className="flex items-center gap-4 text-sm text-slate-500 ml-4 pl-4 border-l border-white/10">
              <span className="flex items-center gap-1">
                <Type size={14} />
                {writingStats.words} 字
              </span>
              <span className="flex items-center gap-1">
                <BookOpen size={14} />
                {writingStats.paragraphs} 段
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('edit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
              viewMode === 'edit'
                ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <Edit3 size={16} />
            编辑
          </button>
          <button
            onClick={() => setViewMode('outline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
              viewMode === 'outline'
                ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <Layout size={16} />
            大纲
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
              viewMode === 'history'
                ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <History size={16} />
            历史
          </button>
          {currentChapter && (
            <button
              onClick={() => setViewMode('reader')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                viewMode === 'reader'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Eye size={16} />
              阅读
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {viewMode === 'edit' && (
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            {showToolbar && currentChapter && (
              <div className="border-b border-white/10 bg-slate-900/50 backdrop-blur px-4 py-2 flex items-center gap-1">
                <button
                  onClick={() => insertMarkdown('**', '**')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-cyan-400"
                  title="加粗"
                >
                  <Bold size={18} />
                </button>
                <button
                  onClick={() => insertMarkdown('*', '*')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-cyan-400"
                  title="斜体"
                >
                  <Italic size={18} />
                </button>
                <button
                  onClick={() => insertMarkdown('__', '__')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-cyan-400"
                  title="下划线"
                >
                  <Underline size={18} />
                </button>
                <div className="w-px h-6 bg-white/10 mx-2" />
                <button
                  onClick={() => insertMarkdown('- ')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-cyan-400"
                  title="无序列表"
                >
                  <List size={18} />
                </button>
                <button
                  onClick={() => insertMarkdown('1. ')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-cyan-400"
                  title="有序列表"
                >
                  <ListOrdered size={18} />
                </button>
                <button
                  onClick={() => insertMarkdown('> ')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-cyan-400"
                  title="引用"
                >
                  <Quote size={18} />
                </button>
                <div className="w-px h-6 bg-white/10 mx-2" />
                <button
                  onClick={() => insertMarkdown('\n\n')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-cyan-400"
                  title="分段"
                >
                  <AlignLeft size={18} />
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => setShowToolbar(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
                  title="隐藏工具栏"
                >
                  <ChevronUp size={18} />
                </button>
              </div>
            )}

            {/* Main Editor */}
            <div ref={contentRef} className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                {currentChapter ? (
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={chapterContent}
                      onChange={(e) => handleContentChange(e.target.value)}
                      onSelect={handleSelection}
                      placeholder="开始你的创作..."
                      className="w-full min-h-[600px] resize-none bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-2xl p-8 text-slate-200 text-lg leading-relaxed outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 font-serif"
                    />
                    
                    {/* Text Actions Popup */}
                    {showTextActions && (
                      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                        <div className="glass rounded-2xl border border-cyan-500/30 shadow-neon p-6 min-w-[500px]">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">AI 文本处理</h3>
                            <button
                              onClick={() => setShowTextActions(false)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                            >
                              <X size={20} />
                            </button>
                          </div>
                          
                          <div className="mb-4 p-4 bg-slate-800/50 rounded-xl border border-white/5">
                            <p className="text-sm text-slate-400 mb-2">选中内容：</p>
                            <p className="text-slate-200 text-sm line-clamp-3 italic">
                              "{selectedText}"
                            </p>
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm text-slate-400 mb-2">处理要求（可选）</label>
                            <textarea
                              value={textActionInput}
                              onChange={(e) => setTextActionInput(e.target.value)}
                              placeholder="例如：让对话更幽默，让场景更有画面感..."
                              className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-3 text-slate-200 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                              rows={2}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => handleTextAction('rewrite')}
                              disabled={isGenerating}
                              className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30 text-cyan-400 hover:from-cyan-500/30 hover:to-cyan-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <div className="font-semibold mb-1">✏️ 重写</div>
                              <div className="text-xs opacity-75">重新创作这段内容</div>
                            </button>
                            <button
                              onClick={() => handleTextAction('expand')}
                              disabled={isGenerating}
                              className="p-4 rounded-xl bg-gradient-to-r from-violet-500/20 to-violet-600/20 border border-violet-500/30 text-violet-400 hover:from-violet-500/30 hover:to-violet-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <div className="font-semibold mb-1">📖 扩写</div>
                              <div className="text-xs opacity-75">扩展丰富内容细节</div>
                            </button>
                            <button
                              onClick={() => handleTextAction('summarize')}
                              disabled={isGenerating}
                              className="p-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 text-orange-400 hover:from-orange-500/30 hover:to-orange-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <div className="font-semibold mb-1">📝 总结</div>
                              <div className="text-xs opacity-75">提炼内容要点</div>
                            </button>
                            <button
                              onClick={() => handleTextAction('polish')}
                              disabled={isGenerating}
                              className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:from-emerald-500/30 hover:to-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <div className="font-semibold mb-1">✨ 润色</div>
                              <div className="text-xs opacity-75">优化文笔表达</div>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-500">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 flex items-center justify-center">
                      <MessageSquare size={40} className="text-cyan-400/50" />
                    </div>
                    <p className="text-lg">选择或创建一个章节开始写作</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            {chapterHistory.length > 0 && (
              <div className="border-t border-white/10 max-h-80 overflow-y-auto bg-slate-900/30">
                {chapterHistory.map(item => (
                  <div key={item.id} className={`p-6 border-b border-white/5 ${item.role === 'user' ? 'bg-gradient-to-r from-orange-500/5 to-transparent' : ''}`}>
                    <div className="max-w-4xl mx-auto">
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          item.role === 'user'
                            ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-neon'
                            : 'bg-gradient-to-br from-cyan-500 to-violet-500 shadow-neon'
                        }`}>
                          {item.role === 'user' ? <User size={18} className="text-white" /> : <Sparkles size={18} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="font-semibold text-white">
                              {item.role === 'user' ? '你' : 'AI'}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(item.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {item.thinking && (
                            <div className="mb-3">
                              <button
                                onClick={() => toggleThinking(item.id)}
                                className="flex items-center gap-2 text-sm text-slate-400 mb-2 hover:text-cyan-400 transition-colors"
                              >
                                {expandedThinking.has(item.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                <span className="font-medium">思考过程</span>
                              </button>
                              {expandedThinking.has(item.id) && (
                                <div className="text-sm text-slate-500 bg-slate-800/50 p-4 rounded-xl border border-white/5 italic">
                                  {item.thinking}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                            {item.content}
                          </div>
                          {item.role === 'assistant' && (
                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => handleAdopt(item.content)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 rounded-xl text-sm font-medium hover:from-cyan-500/30 hover:to-violet-500/30 transition-all border border-cyan-500/30"
                              >
                                <CheckCircle2 size={16} />
                                追加到末尾
                              </button>
                              <button
                                onClick={() => handleReplace(item.content)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 text-slate-400 rounded-xl text-sm font-medium hover:bg-white/10 transition-all border border-white/10"
                              >
                                <Copy size={16} />
                                替换当前内容
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Toolbar */}
            <div className="border-t border-white/10 bg-slate-900/80 backdrop-blur-xl p-4">
              <div className="max-w-4xl mx-auto flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="告诉AI你想怎么写..."
                    className="flex-1 bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
                    rows={1}
                    disabled={!currentChapter || isGenerating}
                  />
                  <button
                    onClick={() => setShowWordCountInput(!showWordCountInput)}
                    className="p-3 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-cyan-400"
                    title="设置字数"
                  >
                    <BookMarked size={20} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {currentChapter && (
                    <>
                      <button
                        onClick={handleCopy}
                        className="p-3 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-cyan-400"
                        title="复制"
                      >
                        <Copy size={20} />
                      </button>
                      <button
                        onClick={handleDownload}
                        className="p-3 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-cyan-400"
                        title="下载"
                      >
                        <Download size={20} />
                      </button>
                    </>
                  )}
                  {isGenerating ? (
                    <button
                      onClick={handleStop}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-medium shadow-neon hover:from-red-600 hover:to-rose-700 transition-all"
                    >
                      <Square size={18} fill="currentColor" />
                      停止
                    </button>
                  ) : (
                    <button
                      onClick={() => handleGenerate(userInput ? 'new' : 'continue')}
                      disabled={!apiSettings.apiKey || !apiSettings.model || !currentChapter}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 via-violet-500 to-orange-500 text-white rounded-xl font-medium shadow-neon hover:from-cyan-600 hover:via-violet-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles size={18} />
                      {userInput ? '生成' : '续写'}
                    </button>
                  )}
                </div>
              </div>
              {showWordCountInput && (
                <div className="max-w-4xl mx-auto mt-3">
                  <input
                    type="number"
                    value={wordCount}
                    onChange={(e) => setWordCount(e.target.value)}
                    placeholder="目标字数（例如：2000）"
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'outline' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                    大纲
                  </h2>
                  <p className="text-slate-500 mt-1">规划你的故事结构</p>
                </div>
                <button
                  onClick={handleGenerateOutline}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 via-violet-500 to-orange-500 text-white rounded-xl font-medium shadow-neon hover:from-cyan-600 hover:via-violet-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles size={18} />
                  生成大纲
                </button>
              </div>
              <div className="glass rounded-2xl border border-white/10 p-8 min-h-[500px]">
                <textarea
                  value={outlineContent}
                  onChange={(e) => {
                    setOutlineContent(e.target.value);
                    if (currentOutline) {
                      updateOutline(currentOutline.id, { content: e.target.value });
                      saveToStorage();
                    }
                  }}
                  placeholder="在这里写大纲，或者点击上方按钮让AI生成..."
                  className="w-full min-h-[400px] resize-none bg-transparent border-none outline-none text-slate-200 text-lg leading-relaxed font-serif"
                />
              </div>

              {chapterPlans.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-white mb-4">章节规划</h3>
                  <div className="space-y-3">
                    {chapterPlans.map((plan, index) => (
                      <div key={plan.id} className="glass rounded-xl p-5 border border-white/10 hover:border-cyan-500/30 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-white">
                            第 {plan.chapterNumber} 章：{plan.title}
                          </h4>
                          <button
                            onClick={() => handleGenerateChapterFromPlan(plan)}
                            disabled={isGenerating}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 rounded-xl text-sm font-medium hover:from-cyan-500/30 hover:to-violet-500/30 transition-all disabled:opacity-50 border border-cyan-500/30"
                          >
                            <Sparkles size={16} />
                            生成章节
                          </button>
                        </div>
                        <p className="text-slate-400">{plan.plot}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'history' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                    对话历史
                  </h2>
                  <p className="text-slate-500 mt-1">查看与AI的所有对话记录</p>
                </div>
                {chapterHistory.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} />
                    清空
                  </button>
                )}
              </div>
              {chapterHistory.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 flex items-center justify-center">
                    <History size={40} className="text-cyan-400/50" />
                  </div>
                  <p className="text-lg">还没有对话历史</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chapterHistory.map(item => (
                    <div key={item.id} className="glass rounded-2xl border border-white/10 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          item.role === 'user'
                            ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                            : 'bg-gradient-to-br from-cyan-500 to-violet-500'
                        }`}>
                          {item.role === 'user' ? <User size={18} className="text-white" /> : <Sparkles size={18} className="text-white" />}
                        </div>
                        <div>
                          <span className="font-semibold text-white">
                            {item.role === 'user' ? '你' : 'AI'}
                          </span>
                          <p className="text-xs text-slate-500">
                            {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {item.thinking && (
                        <div className="mb-4">
                          <button
                            onClick={() => toggleThinking(item.id)}
                            className="flex items-center gap-2 text-sm text-slate-400 mb-3 hover:text-cyan-400 transition-colors"
                          >
                            {expandedThinking.has(item.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <span className="font-medium">思考过程</span>
                          </button>
                          {expandedThinking.has(item.id) && (
                            <div className="text-sm text-slate-500 bg-slate-800/50 p-4 rounded-xl border border-white/5 italic">
                              {item.thinking}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {item.content}
                      </div>
                      {item.role === 'assistant' && (
                        <div className="flex gap-2 mt-5">
                          <button
                            onClick={() => handleAdopt(item.content)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 rounded-xl text-sm font-medium hover:from-cyan-500/30 hover:to-violet-500/30 transition-all border border-cyan-500/30"
                          >
                            <CheckCircle2 size={16} />
                            采纳内容
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'reader' && currentChapter && (
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
            <div className="max-w-3xl mx-auto px-8 py-16">
              <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-cyan-400 via-violet-400 to-orange-400 bg-clip-text text-transparent mb-8">
                {currentChapter.title}
              </h1>
              <div className="text-slate-200 text-lg leading-loose font-serif whitespace-pre-wrap">
                {currentChapter.content || '暂无内容'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
