import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Square, RotateCcw, Download, Copy, History, BookMarked, MessageSquare, User, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../store';
import { streamCompletion } from '../utils/api';
import { buildSystemPrompt, buildContinuePrompt, buildOutlinePrompt, buildChapterPrompt } from '../utils/prompts';
import { HistoryItem, Outline, ChapterPlan, Preset } from '../store/types';

type ViewMode = 'edit' | 'outline' | 'history';

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
  const contentRef = useRef<HTMLDivElement>(null);

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
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [chapterHistory, isGenerating]);

  const handleContentChange = (content: string) => {
    setChapterContent(content);
    if (currentChapter) {
      updateChapter(currentChapter.id, { content });
      saveToStorage();
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
      chapterHistory.forEach(h => {
        messages.push({ role: h.role, content: h.content });
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
            updateChapter(currentChapter.id, { content: chapterContent });
          } else if (mode !== 'outline') {
            const newContent = chapterContent + '\n\n' + responseItem.content;
            setChapterContent(newContent);
            if (currentChapter) {
              updateChapter(currentChapter.id, { content: newContent });
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
    const newContent = chapterContent + '\n\n' + content;
    setChapterContent(newContent);
    if (currentChapter) {
      updateChapter(currentChapter.id, { content: newContent });
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

  if (!currentBook) {
    return (
      <div className="h-full flex items-center justify-center text-wood-600">
        <div className="text-center">
          <BookMarked size={64} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-display">选择或创建一本书开始写作</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-paper-50">
      {/* Header */}
      <div className="border-b border-wood-200 p-4 flex items-center justify-between bg-white/50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-display font-semibold text-wood-900">
            {currentBook.title}
          </h1>
          {currentChapter && (
            <>
              <span className="text-wood-500">·</span>
              <h2 className="text-lg font-display text-wood-700">
                {currentChapter.title}
              </h2>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('edit')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              viewMode === 'edit' ? 'bg-amber-100 text-amber-800' : 'text-wood-600 hover:bg-wood-100'
            }`}
          >
            写作
          </button>
          <button
            onClick={() => setViewMode('outline')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              viewMode === 'outline' ? 'bg-amber-100 text-amber-800' : 'text-wood-600 hover:bg-wood-100'
            }`}
          >
            大纲
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              viewMode === 'history' ? 'bg-amber-100 text-amber-800' : 'text-wood-600 hover:bg-wood-100'
            }`}
          >
            历史
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {viewMode === 'edit' && (
          <div className="flex-1 flex flex-col">
            {/* Main Editor */}
            <div ref={contentRef} className="flex-1 overflow-y-auto p-8">
              <div className="max-w-3xl mx-auto paper-texture rounded-2xl p-8 shadow-paper border border-wood-100 min-h-full">
                {currentChapter ? (
                  <textarea
                    value={chapterContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="开始写作..."
                    className="w-full h-full min-h-[500px] resize-none bg-transparent border-none outline-none text-wood-900 text-lg leading-relaxed font-serif"
                  />
                ) : (
                  <div className="text-center py-16 text-wood-500">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                    <p>选择或创建一个章节开始写作</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            {chapterHistory.length > 0 && (
              <div className="border-t border-wood-200 max-h-64 overflow-y-auto bg-white/50">
                {chapterHistory.map(item => (
                  <div key={item.id} className={`p-4 border-b border-wood-100 ${item.role === 'user' ? 'bg-amber-50/50' : ''}`}>
                    <div className="max-w-3xl mx-auto flex gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        item.role === 'user' ? 'bg-amber-200' : 'bg-wood-200'
                      }`}>
                        {item.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
                      </div>
                      <div className="flex-1">
                        {item.thinking && (
                          <div className="mb-2">
                            <button
                              onClick={() => toggleThinking(item.id)}
                              className="flex items-center gap-1 text-xs text-wood-500 mb-1 hover:text-wood-700"
                            >
                              {expandedThinking.has(item.id) ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                              思考过程
                            </button>
                            {expandedThinking.has(item.id) && (
                              <div className="text-xs text-wood-600 bg-wood-50 p-2 rounded-lg italic">
                                {item.thinking}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="text-wood-800 whitespace-pre-wrap">
                          {item.content}
                        </div>
                        {item.role === 'assistant' && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleAdopt(item.content)}
                              className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
                            >
                              采纳
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Toolbar */}
            <div className="border-t border-wood-200 bg-white/80 backdrop-blur p-4">
              <div className="max-w-3xl mx-auto flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="告诉AI你想怎么写..."
                    className="flex-1 input-field py-2 resize-none"
                    rows={1}
                    disabled={!currentChapter || isGenerating}
                  />
                  <button
                    onClick={() => setShowWordCountInput(!showWordCountInput)}
                    className="p-2 hover:bg-wood-100 rounded-lg transition-colors text-wood-600"
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
                        className="p-2 hover:bg-wood-100 rounded-lg transition-colors text-wood-600"
                        title="复制"
                      >
                        <Copy size={20} />
                      </button>
                      <button
                        onClick={handleDownload}
                        className="p-2 hover:bg-wood-100 rounded-lg transition-colors text-wood-600"
                        title="下载"
                      >
                        <Download size={20} />
                      </button>
                    </>
                  )}
                  {isGenerating ? (
                    <button
                      onClick={handleStop}
                      className="btn-wood flex items-center gap-2"
                    >
                      <Square size={18} fill="currentColor" />
                      停止
                    </button>
                  ) : (
                    <button
                      onClick={() => handleGenerate(userInput ? 'new' : 'continue')}
                      disabled={!apiSettings.apiKey || !apiSettings.model || !currentChapter}
                      className="btn-amber flex items-center gap-2"
                    >
                      <Sparkles size={18} />
                      {userInput ? '生成' : '续写'}
                    </button>
                  )}
                </div>
              </div>
              {showWordCountInput && (
                <div className="max-w-3xl mx-auto mt-2">
                  <input
                    type="number"
                    value={wordCount}
                    onChange={(e) => setWordCount(e.target.value)}
                    placeholder="目标字数（例如：2000）"
                    className="w-full input-field py-2"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'outline' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-semibold text-wood-900">大纲</h2>
                <button
                  onClick={handleGenerateOutline}
                  disabled={isGenerating}
                  className="btn-amber flex items-center gap-2"
                >
                  <Sparkles size={18} />
                  生成大纲
                </button>
              </div>
              <div className="paper-texture rounded-2xl p-8 shadow-paper border border-wood-100 min-h-[500px]">
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
                  className="w-full h-full min-h-[400px] resize-none bg-transparent border-none outline-none text-wood-900 text-lg leading-relaxed font-serif"
                />
              </div>

              {chapterPlans.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-display font-semibold text-wood-900 mb-4">章节规划</h3>
                  <div className="space-y-3">
                    {chapterPlans.map((plan, index) => (
                      <div key={plan.id} className="bg-white rounded-xl p-4 border border-wood-200 shadow-paper">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-wood-900">{plan.title}</h4>
                          <button
                            onClick={() => handleGenerateChapterFromPlan(plan)}
                            disabled={isGenerating}
                            className="text-sm px-3 py-1 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                          >
                            生成章节
                          </button>
                        </div>
                        <p className="text-wood-700 text-sm">{plan.plot}</p>
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
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-semibold text-wood-900">对话历史</h2>
                {chapterHistory.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-sm px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <RotateCcw size={16} />
                    清空
                  </button>
                )}
              </div>
              {chapterHistory.length === 0 ? (
                <div className="text-center py-16 text-wood-500">
                  <History size={48} className="mx-auto mb-4 opacity-50" />
                  <p>还没有对话历史</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chapterHistory.map(item => (
                    <div key={item.id} className={`paper-texture rounded-2xl p-6 shadow-paper border ${
                      item.role === 'user' ? 'border-amber-200' : 'border-wood-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          item.role === 'user' ? 'bg-amber-200' : 'bg-wood-200'
                        }`}>
                          {item.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
                        </div>
                        <span className="font-medium text-wood-800">
                          {item.role === 'user' ? '你' : 'AI'}
                        </span>
                        <span className="text-xs text-wood-400">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {item.thinking && (
                        <div className="mb-3">
                          <button
                            onClick={() => toggleThinking(item.id)}
                            className="flex items-center gap-1 text-sm text-wood-500 mb-2 hover:text-wood-700"
                          >
                            {expandedThinking.has(item.id) ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            思考过程
                          </button>
                          {expandedThinking.has(item.id) && (
                            <div className="text-sm text-wood-600 bg-wood-50 p-3 rounded-lg italic">
                              {item.thinking}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="text-wood-800 whitespace-pre-wrap">
                        {item.content}
                      </div>
                      {item.role === 'assistant' && (
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleAdopt(item.content)}
                            className="text-sm px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                          >
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
      </div>
    </div>
  );
};