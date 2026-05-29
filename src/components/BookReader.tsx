
import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen, Share2, Bookmark, Minus, Sun, Moon, ZoomIn, ZoomOut, Settings, Fullscreen, RotateCcw } from 'lucide-react';
import { useStore } from '../store';

interface BookReaderProps {
  onClose: () => void;
}

export const BookReader: React.FC<BookReaderProps> = ({ onClose }) => {
  const { books, chapters, currentBookId, currentChapterId } = useStore();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fontSize, setFontSize] = useState(20);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [showChapterList, setShowChapterList] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const currentBook = books.find(b => b.id === currentBookId);
  const bookChapters = chapters
    .filter(c => c.bookId === currentBookId)
    .sort((a, b) => a.order - b.order);

  useEffect(() => {
    if (currentChapterId) {
      const index = bookChapters.findIndex(c => c.id === currentChapterId);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const currentChapter = bookChapters[currentIndex];

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setScrollPosition(0);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < bookChapters.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setScrollPosition(0);
    }
  }, [currentIndex, bookChapters.length]);

  const handleChapterSelect = (index: number) => {
    setCurrentIndex(index);
    setScrollPosition(0);
    if (window.innerWidth < 768) {
      setShowChapterList(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollPosition(target.scrollTop);
  };

  const handleMouseWheel = useCallback((e: React.WheelEvent) => {
    if (e.deltaY > 0 && currentIndex < bookChapters.length - 1 && scrollPosition > 90) {
      handleNext();
    } else if (e.deltaY < 0 && currentIndex > 0 && scrollPosition < 10) {
      handlePrev();
    }
  }, [currentIndex, bookChapters.length, scrollPosition, handleNext, handlePrev]);

  const ReadingProgress = () => {
    if (!currentChapter) return null;
    const contentLength = currentChapter.content.length;
    const words = currentChapter.content.trim() ? currentChapter.content.trim().split(/\s+/).length : 0;
    
    return (
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span>{contentLength} 字符</span>
        <span>•</span>
        <span>{words} 字</span>
      </div>
    );
  };

  if (!currentBook || bookChapters.length === 0) {
    return (
      <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center z-50 p-4">
        <div className="glass rounded-2xl border border-cyan-500/20 max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center">
            <BookOpen size={32} className="text-cyan-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">暂无内容</h3>
          <p className="text-slate-400 mb-6">请先选择一本书或创建章节</p>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-violet-600 transition-all"
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex ${darkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
      {/* 左侧章节列表 */}
      <aside className={`${showChapterList ? 'w-72' : 'w-0'} transition-all duration-300 border-r ${darkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white/80'} backdrop-blur-xl overflow-hidden flex flex-col`}>
        {showChapterList && (
          <>
            <div className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {currentBook.title}
                </h2>
                <button 
                  onClick={() => setShowChapterList(false)}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                >
                  <ChevronLeft size={20} />
                </button>
              </div>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                共 {bookChapters.length} 章
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {bookChapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => handleChapterSelect(index)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                    index === currentIndex
                      ? `${darkMode 
                          ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 border border-cyan-500/30' 
                          : 'bg-gradient-to-r from-cyan-100 to-violet-100 text-cyan-700'
                        } font-medium`
                      : `${darkMode 
                          ? 'text-slate-400 hover:bg-white/5 hover:text-white' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">
                      {index + 1}. {chapter.title}
                    </span>
                    {index === currentIndex && (
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 animate-pulse" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </aside>

      {/* 主阅读区 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部工具栏 */}
        <header className={`h-16 border-b ${darkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white/80'} backdrop-blur-xl flex items-center justify-between px-6 z-10`}>
          <div className="flex items-center gap-4">
            {!showChapterList && (
              <button
                onClick={() => setShowChapterList(true)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <PanelLeft size={20} />
              </button>
            )}
            <div>
              <h1 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {currentChapter?.title || '阅读'}
              </h1>
              <div className="text-xs text-slate-500">
                {currentIndex + 1} / {bookChapters.length}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              title="设置"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10 text-amber-400' : 'hover:bg-slate-100 text-slate-500'}`}
              title={darkMode ? '浅色模式' : '深色模式'}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              title="关闭"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* 设置面板 */}
        {showSettings && (
          <div className={`border-b ${darkMode ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white/60'} backdrop-blur-xl p-4`}>
            <div className="max-w-2xl mx-auto">
              <h3 className={`text-sm font-semibold mb-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>阅读设置</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 字体大小 */}
                <div>
                  <label className={`block text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    字体大小: {fontSize}px
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                      className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                    >
                      <Minus size={18} />
                    </button>
                    <input
                      type="range"
                      min="14"
                      max="32"
                      step="2"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: darkMode 
                          ? 'linear-gradient(to right, rgb(34 211 238), rgb(167 139 250))' 
                          : 'linear-gradient(to right, rgb(34 211 238), rgb(167 139 250))'
                      }}
                    />
                    <button
                      onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                      className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                {/* 行高 */}
                <div>
                  <label className={`block text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    行高: {lineHeight}
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setLineHeight(Math.max(1.4, lineHeight - 0.2))}
                      className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                    >
                      <Minus size={18} />
                    </button>
                    <input
                      type="range"
                      min="1.4"
                      max="2.4"
                      step="0.2"
                      value={lineHeight}
                      onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                      className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: darkMode 
                          ? 'linear-gradient(to right, rgb(34 211 238), rgb(167 139 250))' 
                          : 'linear-gradient(to right, rgb(34 211 238), rgb(167 139 250))'
                      }}
                    />
                    <button
                      onClick={() => setLineHeight(Math.min(2.4, lineHeight + 0.2))}
                      className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 阅读内容 */}
        <main className="flex-1 overflow-y-auto">
          <div 
            className="max-w-3xl mx-auto px-8 py-12"
            onScroll={handleScroll}
            onWheel={handleMouseWheel}
          >
            {currentChapter && (
              <>
                <div className="text-center mb-12">
                  <h1 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {currentChapter.title}
                  </h1>
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                    <BookOpen size={16} />
                    <ReadingProgress />
                  </div>
                </div>

                <article 
                  className={`prose prose-lg max-w-none whitespace-pre-wrap leading-relaxed font-serif ${
                    darkMode 
                      ? 'text-slate-300 prose-headings:text-white prose-strong:text-white' 
                      : 'text-slate-700 prose-headings:text-slate-900 prose-strong:text-slate-900'
                  }`}
                  style={{ fontSize: `${fontSize}px`, lineHeight }}
                >
                  {currentChapter.content || (
                    <div className="text-center py-16 text-slate-500">
                      <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                      <p>本章暂无内容</p>
                    </div>
                  )}
                </article>
              </>
            )}
          </div>
        </main>

        {/* 底部导航 */}
        <footer className={`h-20 border-t ${darkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white/80'} backdrop-blur-xl flex items-center justify-between px-8`}>
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
              currentIndex === 0
                ? 'opacity-40 cursor-not-allowed'
                : `${darkMode 
                    ? 'bg-white/5 text-slate-300 hover:bg-white/10' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`
            }`}
          >
            <ChevronLeft size={20} />
            <span>上一章</span>
          </button>

          <div className="flex flex-col items-center">
            <span className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {currentIndex + 1} / {bookChapters.length}
            </span>
            <span className="text-xs text-slate-500 mt-1">
              方向键切换 · ESC 关闭
            </span>
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === bookChapters.length - 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
              currentIndex === bookChapters.length - 1
                ? 'opacity-40 cursor-not-allowed'
                : `bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:from-cyan-600 hover:to-violet-600 shadow-neon`
            }`}
          >
            <span>下一章</span>
            <ChevronRight size={20} />
          </button>
        </footer>
      </div>
    </div>
  );
};

// Missing component imports
const PanelLeft = ({ size = 24, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <line x1="9" x2="9" y1="3" y2="21" />
  </svg>
);

const Plus = ({ size = 24, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="12" x2="12" y1="5" y2="19" />
    <line x1="5" x2="19" y1="12" y2="12" />
  </svg>
);

