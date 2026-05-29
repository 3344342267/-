import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen, Copy, Edit3, Check, ZoomIn, ZoomOut, Moon, Sun } from 'lucide-react';
import { useStore } from '../store';

interface BookReaderProps {
  onClose: () => void;
}

export const BookReader: React.FC<BookReaderProps> = ({ onClose }) => {
  const { books, chapters, currentBookId, currentChapterId, updateChapter, saveToStorage } = useStore();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [showChapterList, setShowChapterList] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editRange, setEditRange] = useState({ start: 0, end: 0 });
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        const range = selection.getRangeAt(0);
        const textContent = contentRef.current?.textContent || '';
        const container = range.commonAncestorContainer;
        
        let offset = 0;
        const walk = document.createTreeWalker(container.ownerDocument.body, NodeFilter.SHOW_TEXT, null);
        while (walk.nextNode() && walk.currentNode !== range.startContainer) {
          offset += (walk.currentNode as Text).length;
        }
        
        const start = offset + range.startOffset;
        const end = start + selection.toString().length;
        
        setSelectedText(selection.toString());
        setEditRange({ start, end });
      } else {
        setSelectedText('');
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

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

  const handleCopy = () => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (currentChapter) {
      navigator.clipboard.writeText(currentChapter.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEdit = () => {
    if (selectedText && currentChapter) {
      const before = currentChapter.content.substring(0, editRange.start);
      const after = currentChapter.content.substring(editRange.end);
      setEditContent(selectedText);
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = () => {
    if (currentChapter) {
      const before = currentChapter.content.substring(0, editRange.start);
      const after = currentChapter.content.substring(editRange.end);
      const newContent = before + editContent + after;
      updateChapter(currentChapter.id, { content: newContent });
      saveToStorage();
      setShowEditModal(false);
      setEditContent('');
      setSelectedText('');
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleDownload = () => {
    if (!currentBook) return;
    
    const content = bookChapters.map(c => `## ${c.title}\n\n${c.content}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentBook.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!currentBook || bookChapters.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className={`${darkMode ? 'bg-ink-900' : 'bg-paper-50'} rounded-2xl shadow-warm max-w-2xl w-full p-8`}>
          <div className="text-center">
            <BookOpen size={48} className={`mx-auto mb-4 ${darkMode ? 'text-minghuang-400' : 'text-ink-400'}`} />
            <p className={`${darkMode ? 'text-ink-300' : 'text-ink-500'}`}>请先选择一本书</p>
            <button onClick={onClose} className="mt-4 btn-minghuang">
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 ${darkMode ? 'bg-black/95' : 'bg-black/80'} flex items-center justify-center z-50 p-4`}>
      <div className={`${darkMode ? 'bg-ink-900' : 'bg-white'} rounded-2xl shadow-warm max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? 'border-ink-700 bg-ink-800/80' : 'border-ink-200 bg-paper-50/80'} backdrop-blur-sm`}>
          <div className="flex items-center gap-4">
            <h2 className={`text-xl font-display font-semibold ${darkMode ? 'text-ink-100' : 'text-ink-900'}`}>
              {currentBook.title}
            </h2>
            {currentChapter && (
              <span className={`text-sm ${darkMode ? 'text-ink-400' : 'text-ink-500'}`}>
                · {currentChapter.title}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-ink-700 text-ink-300' : 'hover:bg-ink-50 text-ink-600'
              }`}
              title={copied ? '已复制' : '复制内容'}
            >
              <Copy size={16} />
              <span className="text-sm">{copied ? '已复制' : '复制'}</span>
            </button>
            <button
              onClick={handleDownload}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-ink-700 text-ink-300' : 'hover:bg-ink-50 text-ink-600'
              }`}
              title="下载书籍"
            >
              <BookOpen size={16} />
              <span className="text-sm">下载</span>
            </button>
            <button
              onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-ink-700' : 'hover:bg-ink-50'}`}
              title="减小字体"
            >
              <ZoomOut size={18} className={`${darkMode ? 'text-ink-400' : 'text-ink-500'}`} />
            </button>
            <span className={`text-sm ${darkMode ? 'text-ink-400' : 'text-ink-500'} w-10 text-center`}>
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize(prev => Math.min(28, prev + 2))}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-ink-700' : 'hover:bg-ink-50'}`}
              title="增大字体"
            >
              <ZoomIn size={18} className={`${darkMode ? 'text-ink-400' : 'text-ink-500'}`} />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-ink-700' : 'hover:bg-ink-50'}`}
              title={darkMode ? '浅色模式' : '深色模式'}
            >
              {darkMode ? <Sun size={18} className="text-minghuang-400" /> : <Moon size={18} className={`${darkMode ? 'text-ink-400' : 'text-ink-500'}`} />}
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-ink-700' : 'hover:bg-ink-50'}`}
              title="关闭"
            >
              <X size={20} className={`${darkMode ? 'text-ink-400' : 'text-ink-500'}`} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Chapter List - Desktop */}
          <div className={`hidden lg:block w-64 border-r ${darkMode ? 'border-ink-700 bg-ink-800/30' : 'border-ink-200 bg-paper-50/30'} overflow-y-auto`}>
            <div className={`px-4 py-3 border-b ${darkMode ? 'border-ink-700' : 'border-ink-200'}`}>
              <p className={`text-sm font-medium ${darkMode ? 'text-ink-200' : 'text-ink-800'}`}>章节列表</p>
            </div>
            <div className="p-2 space-y-1">
              {bookChapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => handleChapterSelect(index)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                    index === currentIndex
                      ? `${darkMode ? 'bg-minghuang-600/30 text-minghuang-300' : 'bg-minghuang-100 text-minghuang-700'} font-medium`
                      : `${darkMode ? 'text-ink-400 hover:bg-ink-700' : 'text-ink-600 hover:bg-ink-50'}`
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
            className={`lg:hidden px-4 py-3 border-b ${darkMode ? 'border-ink-700 bg-ink-800/50' : 'border-ink-200 bg-paper-50/50'} flex items-center justify-between`}
          >
            <span className={`text-sm font-medium ${darkMode ? 'text-ink-200' : 'text-ink-800'}`}>
              章节列表
            </span>
            <span className={`text-sm ${darkMode ? 'text-ink-400' : 'text-ink-500'}`}>
              {showChapterList ? '收起' : '展开'}
            </span>
          </button>

          {/* Mobile Chapter List */}
          {showChapterList && (
            <div className={`lg:hidden border-b ${darkMode ? 'border-ink-700 bg-ink-800/50' : 'border-ink-200 bg-paper-50/50'} max-h-48 overflow-y-auto`}>
              <div className="p-2 space-y-1">
                {bookChapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    onClick={() => handleChapterSelect(index)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      index === currentIndex
                        ? `${darkMode ? 'bg-minghuang-600/30 text-minghuang-300' : 'bg-minghuang-100 text-minghuang-700'} font-medium`
                        : `${darkMode ? 'text-ink-400 hover:bg-ink-700' : 'text-ink-600 hover:bg-ink-50'}`
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
                <h1 className={`text-2xl font-display font-semibold mb-8 text-center ${darkMode ? 'text-ink-100' : 'text-ink-900'}`}>
                  {currentChapter.title}
                </h1>
                <div
                  ref={contentRef}
                  className={`whitespace-pre-wrap leading-relaxed ${darkMode ? 'text-ink-200' : 'text-ink-800'} font-serif`}
                  style={{ fontSize: `${fontSize}px`, lineHeight }}
                >
                  {currentChapter.content || '暂无内容'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Text Actions */}
        {selectedText && (
          <div className={`border-t ${darkMode ? 'border-ink-700 bg-ink-800/80' : 'border-ink-200 bg-white/80'} px-5 py-3 backdrop-blur-sm`}>
            <div className="max-w-2xl mx-auto flex items-center gap-4">
              <span className={`text-sm ${darkMode ? 'text-ink-400' : 'text-ink-500'}`}>
                已选中 {selectedText.length} 字
              </span>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  darkMode ? 'bg-ink-700 text-ink-200 hover:bg-ink-600' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                }`}
              >
                <Copy size={14} />
                <span className="text-sm">复制选中</span>
              </button>
              <button
                onClick={handleEdit}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  darkMode ? 'bg-minghuang-600/30 text-minghuang-300 hover:bg-minghuang-600/50' : 'bg-minghuang-100 text-minghuang-700 hover:bg-minghuang-200'
                }`}
              >
                <Edit3 size={14} />
                <span className="text-sm">修改选中</span>
              </button>
              <button
                onClick={() => { 
                  setSelectedText(''); 
                  window.getSelection()?.removeAllRanges(); 
                }}
                className={`text-sm ${darkMode ? 'text-ink-400 hover:text-ink-300' : 'text-ink-500 hover:text-ink-600'}`}
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`flex items-center justify-between px-5 py-4 border-t ${darkMode ? 'border-ink-700 bg-ink-800/80' : 'border-ink-200 bg-paper-50/80'} backdrop-blur-sm`}>
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              darkMode 
                ? 'bg-ink-700 text-ink-200 hover:bg-ink-600' 
                : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
            }`}
          >
            <ChevronLeft size={18} />
            上一章
          </button>
          <div className="flex items-center gap-4">
            <span className={`text-sm ${darkMode ? 'text-ink-400' : 'text-ink-500'}`}>
              {currentIndex + 1} / {bookChapters.length}
            </span>
            <span className={`text-xs ${darkMode ? 'text-ink-500' : 'text-ink-400'}`}>
              左右键切换章节
            </span>
          </div>
          <button
            onClick={handleNext}
            disabled={currentIndex === bookChapters.length - 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              darkMode 
                ? 'bg-minghuang-600/30 text-minghuang-300 hover:bg-minghuang-600/50' 
                : 'bg-minghuang-100 text-minghuang-700 hover:bg-minghuang-200'
            }`}
          >
            下一章
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-60 p-4">
          <div className={`${darkMode ? 'bg-ink-900' : 'bg-white'} rounded-2xl shadow-warm max-w-xl w-full p-6`}>
            <h3 className={`text-lg font-display font-semibold mb-4 ${darkMode ? 'text-ink-100' : 'text-ink-900'}`}>
              修改选中内容
            </h3>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className={`w-full input-field resize-none mb-4 ${darkMode ? 'bg-ink-800 border-ink-600 text-ink-100' : ''}`}
              rows={6}
              placeholder="输入修改后的内容..."
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowEditModal(false); setEditContent(''); }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  darkMode ? 'bg-ink-700 text-ink-300 hover:bg-ink-600' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                }`}
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="btn-minghuang flex items-center gap-1.5"
              >
                <Check size={16} />
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
