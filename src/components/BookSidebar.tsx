import React, { useState } from 'react';
import { BookOpen, Plus, Folder, FileText, ChevronDown, ChevronRight, Trash2, Edit2, Upload, Sparkles, Zap } from 'lucide-react';
import { useStore } from '../store';
import { Book, Chapter } from '../store/types';

export const BookSidebar: React.FC = () => {
  const {
    books,
    chapters,
    currentBookId,
    currentChapterId,
    addBook,
    updateBook,
    deleteBook,
    setCurrentBookId,
    addChapter,
    deleteChapter,
    setCurrentChapterId,
    setLeftSidebarOpen,
    saveToStorage,
  } = useStore();

  const [showNewBookModal, setShowNewBookModal] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookDesc, setNewBookDesc] = useState('');
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showNewChapterModal, setShowNewChapterModal] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set(books.map(b => b.id)));
  const [showWelcome, setShowWelcome] = useState(true);

  const toggleBookExpand = (bookId: string) => {
    const newExpanded = new Set(expandedBooks);
    if (newExpanded.has(bookId)) {
      newExpanded.delete(bookId);
    } else {
      newExpanded.add(bookId);
    }
    setExpandedBooks(newExpanded);
  };

  const handleCreateBook = () => {
    if (!newBookTitle) return;

    const book: Book = {
      id: Date.now().toString(),
      title: newBookTitle,
      description: newBookDesc,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addBook(book);
    setCurrentBookId(book.id);
    setExpandedBooks(new Set([...expandedBooks, book.id]));
    setNewBookTitle('');
    setNewBookDesc('');
    setShowNewBookModal(false);
    setShowWelcome(false);
    saveToStorage();
  };

  const handleUpdateBook = () => {
    if (!editingBook || !newBookTitle) return;
    
    updateBook(editingBook.id, {
      title: newBookTitle,
      description: newBookDesc,
    });
    setEditingBook(null);
    setNewBookTitle('');
    setNewBookDesc('');
    saveToStorage();
  };

  const handleDeleteBook = (bookId: string) => {
    if (confirm('确定要删除这本书吗？这将同时删除所有章节。')) {
      deleteBook(bookId);
      saveToStorage();
    }
  };

  const handleCreateChapter = () => {
    if (!currentBookId || !newChapterTitle) return;

    const bookChapters = chapters.filter(c => c.bookId === currentBookId);
    const chapter: Chapter = {
      id: Date.now().toString(),
      bookId: currentBookId,
      title: newChapterTitle,
      content: '',
      order: bookChapters.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addChapter(chapter);
    setCurrentChapterId(chapter.id);
    setNewChapterTitle('');
    setShowNewChapterModal(false);
    saveToStorage();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      if (!currentBookId) {
        const book: Book = {
          id: Date.now().toString(),
          title: file.name.replace(/\.[^/.]+$/, ''),
          description: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addBook(book);
        setCurrentBookId(book.id);
        setExpandedBooks(new Set([...expandedBooks, book.id]));
        setShowWelcome(false);

        const chapter: Chapter = {
          id: (Date.now() + 1).toString(),
          bookId: book.id,
          title: '第一章',
          content: content,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addChapter(chapter);
        setCurrentChapterId(chapter.id);
      } else {
        const bookChapters = chapters.filter(c => c.bookId === currentBookId);
        const chapter: Chapter = {
          id: Date.now().toString(),
          bookId: currentBookId,
          title: file.name.replace(/\.[^/.]+$/, ''),
          content: content,
          order: bookChapters.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addChapter(chapter);
        setCurrentChapterId(chapter.id);
      }
      saveToStorage();
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* 头部 */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <BookOpen size={20} className="text-cyan-400" />
            我的作品
          </h2>
          <div className="flex gap-1">
            <label className="p-2 rounded-xl hover:bg-white/10 transition-all duration-300 cursor-pointer group">
              <Upload size={18} className="text-slate-400 group-hover:text-cyan-400" />
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".txt,.md"
              />
            </label>
            <button
              onClick={() => setShowNewBookModal(true)}
              className="p-2 rounded-xl hover:bg-white/10 transition-all duration-300 group"
            >
              <Plus size={18} className="text-slate-400 group-hover:text-cyan-400" />
            </button>
          </div>
        </div>
        
        {/* 快捷统计 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-2xl font-bold text-cyan-400">{books.length}</p>
            <p className="text-xs text-slate-500">作品数</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-2xl font-bold text-violet-400">{chapters.length}</p>
            <p className="text-xs text-slate-500">章节数</p>
          </div>
        </div>
      </div>

      {/* 作品列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {books.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center">
              <Sparkles size={32} className="text-cyan-400" />
            </div>
            <p className="text-slate-400 mb-2">开始您的创作之旅</p>
            <p className="text-xs text-slate-600 mb-4">点击上方按钮创建您的第一部作品</p>
            <button
              onClick={() => setShowNewBookModal(true)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-sm font-medium hover:shadow-neon transition-all duration-300"
            >
              立即创作
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {books.map(book => {
              const bookChapters = chapters
                .filter(c => c.bookId === book.id)
                .sort((a, b) => a.order - b.order);
              const isExpanded = expandedBooks.has(book.id);
              const isActive = currentBookId === book.id;

              return (
                <div key={book.id} className="space-y-1">
                  <div
                    className={`group relative rounded-xl p-3 transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30'
                        : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookExpand(book.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown size={16} className="text-slate-400" />
                        ) : (
                          <ChevronRight size={16} className="text-slate-400" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setCurrentBookId(book.id);
                          if (bookChapters.length > 0 && !currentChapterId) {
                            setCurrentChapterId(bookChapters[0].id);
                          }
                          setShowWelcome(false);
                        }}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${isActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                            {book.title}
                          </p>
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{bookChapters.length} 章</p>
                      </button>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingBook(book);
                            setNewBookTitle(book.title);
                            setNewBookDesc(book.description);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <Edit2 size={14} className="text-slate-500 hover:text-slate-300" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBook(book.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 size={14} className="text-slate-500 hover:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="ml-8 space-y-1 mt-1">
                      {bookChapters.map(chapter => (
                        <button
                          key={chapter.id}
                          onClick={() => {
                            setCurrentBookId(book.id);
                            setCurrentChapterId(chapter.id);
                            setShowWelcome(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all duration-300 ${
                            currentChapterId === chapter.id
                              ? 'bg-gradient-to-r from-cyan-500/15 to-violet-500/15 text-cyan-300 border border-cyan-500/20'
                              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                          }`}
                        >
                          <FileText size={14} className={currentChapterId === chapter.id ? 'text-cyan-400' : ''} />
                          <span className="text-sm truncate">{chapter.title}</span>
                          {chapter.content.length > 0 && (
                            <span className="ml-auto text-xs text-slate-600">
                              {Math.round(chapter.content.length / 2)} 字
                            </span>
                          )}
                        </button>
                      ))}
                      {currentBookId === book.id && (
                        <button
                          onClick={() => setShowNewChapterModal(true)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-all duration-300 border border-dashed border-white/10 hover:border-white/20"
                        >
                          <Plus size={14} />
                          <span className="text-sm">添加章节</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 新建作品模态框 */}
      {showNewBookModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-neon max-w-md w-full p-6 animate-slide-up">
            <h3 className="text-xl font-semibold text-slate-100 mb-4">创建新作品</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">作品标题</label>
                <input
                  type="text"
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  placeholder="输入作品标题..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">作品简介</label>
                <textarea
                  value={newBookDesc}
                  onChange={(e) => setNewBookDesc(e.target.value)}
                  placeholder="简单描述一下您的作品..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNewBookModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateBook}
                  disabled={!newBookTitle}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-medium hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑作品模态框 */}
      {editingBook && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-neon max-w-md w-full p-6 animate-slide-up">
            <h3 className="text-xl font-semibold text-slate-100 mb-4">编辑作品</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">作品标题</label>
                <input
                  type="text"
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">作品简介</label>
                <textarea
                  value={newBookDesc}
                  onChange={(e) => setNewBookDesc(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setEditingBook(null);
                    setNewBookTitle('');
                    setNewBookDesc('');
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleUpdateBook}
                  disabled={!newBookTitle}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-medium hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新建章节模态框 */}
      {showNewChapterModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-neon max-w-md w-full p-6 animate-slide-up">
            <h3 className="text-xl font-semibold text-slate-100 mb-4">添加新章节</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">章节标题</label>
                <input
                  type="text"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="第一章"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-100 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNewChapterModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateChapter}
                  disabled={!newChapterTitle}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-medium hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
