import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen, Share2, Bookmark, Minus, Sun, Moon, ZoomIn, ZoomOut } from 'lucide-react';
import { useStore } from '../store';

interface BookReaderProps {
  onClose: () => void;
}

export const BookReader: React.FC<BookReaderProps> = ({ onClose }) => {
  const { books, chapters, currentBookId, currentChapterId } = useStore();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [showChapterList, setShowChapterList] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

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

  if (!currentBook || bookChapters.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className={`${darkMode ? 'bg-wood-900' : 'bg-paper-50'} rounded-2xl shadow-warm max-w-2xl w-full p-8`}>
          <div className="text-center">
            <BookOpen size={48} className={`mx-auto mb-4 ${darkMode ? 'text-wood-400' : 'text-wood-400'}`} />
            <p className={`${darkMode ? 'text-wood-300' : 'text-wood-600'}`}>请先选择一本书</p>
            <button onClick={onClose} className="mt-4 btn-amber">
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 ${darkMode ? 'bg-black/90' : 'bg-black/80'} flex items-center justify-center z-50 p-4`}>
      <div className={`${darkMode ? 'bg-wood-900' : 'bg-paper-50'} rounded-2xl shadow-warm max-w-4xl w-full max-h-[95vh] flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-wood-700 bg-wood-800/50' : 'border-wood-200 bg-white/50'}`}>
          <div className="flex items-center gap-4">
            <h2 className={`text-lg font-display font-semibold ${darkMode ? 'text-wood-100' : 'text-wood-900'}`}>
              {currentBook.title}
            </h2>
            {currentChapter && (
              <span className={`text-sm ${darkMode ? 'text-wood-400' : 'text-wood-600'}`}>
                · {currentChapter.title}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-wood-700' : 'hover:bg-wood-100'}`}
              title="减小字体"
            >
              <ZoomOut size={18} className={`${darkMode ? 'text-wood-400' : 'text-wood-600'}`} />
            </button>
            <span className={`text-sm ${darkMode ? 'text-wood-400' : 'text-wood-500'} w-10 text-center`}>
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize(prev => Math.min(28, prev + 2))}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-wood-700' : 'hover:bg-wood-100'}`}
              title="增大字体"
            >
              <ZoomIn size={18} className={`${darkMode ? 'text-wood-400' : 'text-wood-600'}`} />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-wood-700' : 'hover:bg-wood-100'}`}
              title={darkMode ? '浅色模式' : '深色模式'}
            >
              {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className={`${darkMode ? 'text-wood-400' : 'text-wood-600'}`} />}
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-wood-700' : 'hover:bg-wood-100'}`}
              title="关闭"
            >
              <X size={20} className={`${darkMode ? 'text-wood-400' : 'text-wood-600'}`} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Chapter List - Desktop */}
          <div className={`hidden lg:block w-60 border-r ${darkMode ? 'border-wood-700 bg-wood-800/30' : 'border-wood-200 bg-white/30'} overflow-y-auto`}>
            <div className={`p-3 border-b ${darkMode ? 'border-wood-700' : 'border-wood-200'}`}>
              <p className={`text-sm font-medium ${darkMode ? 'text-wood-300' : 'text-wood-700'}`}>章节列表</p>
            </div>
            <div className="p-2 space-y-1">
              {bookChapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => handleChapterSelect(index)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    index === currentIndex
                      ? `${darkMode ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-800'} font-medium`
                      : `${darkMode ? 'text-wood-400 hover:bg-wood-700' : 'text-wood-700 hover:bg-wood-100'}`
                  }`}
                >
                  {chapter.title}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Chapter Toggle */}
          <button
            onClick={() => setShowChapterList(!showChapterList)}
            className={`lg:hidden p-4 border-b ${darkMode ? 'border-wood-700 bg-wood-800/50' : 'border-wood-200 bg-white/50'} flex items-center justify-between`}
          >
            <span className={`text-sm font-medium ${darkMode ? 'text-wood-300' : 'text-wood-700'}`}>
              章节列表
            </span>
            <span className={`text-sm ${darkMode ? 'text-wood-400' : 'text-wood-500'}`}>
              {showChapterList ? '收起' : '展开'}
            </span>
          </button>

          {/* Mobile Chapter List */}
          {showChapterList && (
            <div className={`lg:hidden border-b ${darkMode ? 'border-wood-700 bg-wood-800/50' : 'border-wood-200 bg-white/50'} max-h-48 overflow-y-auto`}>
              <div className="p-2 space-y-1">
                {bookChapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    onClick={() => handleChapterSelect(index)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      index === currentIndex
                        ? `${darkMode ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-800'} font-medium`
                        : `${darkMode ? 'text-wood-400 hover:bg-wood-700' : 'text-wood-700 hover:bg-wood-100'}`
                    }`}
                  >
                    {chapter.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reader */}
          <div className="flex-1 overflow-y-auto" onScroll={handleScroll} onWheel={handleMouseWheel}>
            {currentChapter && (
              <div className="max-w-2xl mx-auto px-6 py-8">
                <h1 className={`text-2xl font-display font-semibold mb-8 text-center ${darkMode ? 'text-wood-100' : 'text-wood-900'}`}>
                  {currentChapter.title}
                </h1>
                <div
                  className={`whitespace-pre-wrap leading-relaxed ${darkMode ? 'text-wood-200' : 'text-wood-800'}`}
                  style={{ fontSize: `${fontSize}px`, lineHeight }}
                >
                  {currentChapter.content || '暂无内容'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between p-4 border-t ${darkMode ? 'border-wood-700 bg-wood-800/50' : 'border-wood-200 bg-white/50'}`}>
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              darkMode 
                ? 'bg-wood-700 text-wood-300 hover:bg-wood-600' 
                : 'bg-wood-100 text-wood-700 hover:bg-wood-200'
            }`}
          >
            <ChevronLeft size={18} />
            上一章
          </button>
          <div className="flex items-center gap-4">
            <span className={`text-sm ${darkMode ? 'text-wood-400' : 'text-wood-500'}`}>
              {currentIndex + 1} / {bookChapters.length}
            </span>
            <span className={`text-xs ${darkMode ? 'text-wood-500' : 'text-wood-400'}`}>
              左右键切换章节
            </span>
          </div>
          <button
            onClick={handleNext}
            disabled={currentIndex === bookChapters.length - 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              darkMode 
                ? 'bg-amber-900/50 text-amber-300 hover:bg-amber-800/50' 
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            下一章
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};