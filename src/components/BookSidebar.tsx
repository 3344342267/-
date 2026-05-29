
import React, { useState } from 'react';
import { BookOpen, Plus, Folder, FileText, X, ChevronDown, ChevronRight, Trash2, Upload, Edit2 } from 'lucide-react';
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
    updateChapter,
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
    <div className="h-full bg-paper-50 border-r border-wood-200 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-wood-200">
        <h2 className="text-lg font-display font-semibold text-wood-900 flex items-center gap-2">
          <BookOpen size={20} />
          作品
        </h2>
        <div className="flex gap-1">
          <label className="p-2 hover:bg-wood-100 rounded-lg transition-colors cursor-pointer">
            <Upload size={20} className="text-wood-600" />
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".txt,.md"
            />
          </label>
          <button
            onClick={() => setShowNewBookModal(true)}
            className="p-2 hover:bg-wood-100 rounded-lg transition-colors"
          >
            <Plus size={20} className="text-wood-600" />
          </button>
          <button
            onClick={() => setLeftSidebarOpen(false)}
            className="p-2 hover:bg-wood-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-wood-600" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
        {books.length === 0 ? (
          <div className="text-center py-8 text-wood-500">
            <Folder size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">还没有作品</p>
            <p className="text-xs mt-1">点击 + 创建第一本书</p>
          </div>
        ) : (
          books.map(book => {
            const bookChapters = chapters
              .filter(c => c.bookId === book.id)
              .sort((a, b) => a.order - b.order);
            const isExpanded = expandedBooks.has(book.id);
            const isActive = currentBookId === book.id;

            return (
              <div key={book.id} className="space-y-1">
                <div
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                    isActive ? 'bg-amber-50 border border-amber-200' : 'hover:bg-wood-100'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      onClick={() => toggleBookExpand(book.id)}
                      className="p-1 hover:bg-wood-200 rounded"
                    >
                      {isExpanded ? <ChevronDown size={16} className="text-wood-600" /> : <ChevronRight size={16} className="text-wood-600" />}
                    </button>
                    <button
                      onClick={() => {
                        setCurrentBookId(book.id);
                        if (bookChapters.length > 0 && !currentChapterId) {
                          setCurrentChapterId(bookChapters[0].id);
                        }
                      }}
                      className="flex-1 text-left min-w-0"
                    >
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-amber-800' : 'text-wood-800'}`}>
                        {book.title}
                      </p>
                      <p className="text-xs text-wood-500">{bookChapters.length} 章</p>
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingBook(book);
                        setNewBookTitle(book.title);
                        setNewBookDesc(book.description);
                      }}
                      className="p-1 hover:bg-wood-200 rounded transition-colors"
                    >
                      <Edit2 size={14} className="text-wood-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteBook(book.id)}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="ml-6 space-y-1">
                    {bookChapters.map(chapter => (
                      <button
                        key={chapter.id}
                        onClick={() => {
                          setCurrentBookId(book.id);
                          setCurrentChapterId(chapter.id);
                        }}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                          currentChapterId === chapter.id
                            ? 'bg-amber-100 text-amber-800'
                            : 'hover:bg-wood-100 text-wood-700'
                        }`}
                      >
                        <FileText size={14} />
                        <span className="text-sm truncate">{chapter.title}</span>
                      </button>
                    ))}
                    {currentBookId === book.id && (
                      <button
                        onClick={() => setShowNewChapterModal(true)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-wood-500 hover:bg-wood-100 transition-colors"
                      >
                        <Plus size={14} />
                        <span className="text-sm">添加章节</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New Book Modal */}
      {showNewBookModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-paper-50 rounded-2xl shadow-warm max-w-md w-full p-6">
            <h3 className="text-lg font-display font-semibold text-wood-900 mb-4">
              创建新书
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-wood-600 mb-2">书名</label>
                <input
                  type="text"
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  placeholder="输入书名"
                  className="w-full input-field"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-wood-600 mb-2">简介</label>
                <textarea
                  value={newBookDesc}
                  onChange={(e) => setNewBookDesc(e.target.value)}
                  placeholder="简单描述一下这本书"
                  rows={3}
                  className="w-full input-field resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowNewBookModal(false)}
                  className="flex-1 btn-ghost"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateBook}
                  disabled={!newBookTitle}
                  className="flex-1 btn-amber"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {editingBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-paper-50 rounded-2xl shadow-warm max-w-md w-full p-6">
            <h3 className="text-lg font-display font-semibold text-wood-900 mb-4">
              编辑书籍
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-wood-600 mb-2">书名</label>
                <input
                  type="text"
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  className="w-full input-field"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-wood-600 mb-2">简介</label>
                <textarea
                  value={newBookDesc}
                  onChange={(e) => setNewBookDesc(e.target.value)}
                  rows={3}
                  className="w-full input-field resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setEditingBook(null)}
                  className="flex-1 btn-ghost"
                >
                  取消
                </button>
                <button
                  onClick={handleUpdateBook}
                  disabled={!newBookTitle}
                  className="flex-1 btn-amber"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Chapter Modal */}
      {showNewChapterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-paper-50 rounded-2xl shadow-warm max-w-md w-full p-6">
            <h3 className="text-lg font-display font-semibold text-wood-900 mb-4">
              添加章节
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-wood-600 mb-2">章节标题</label>
                <input
                  type="text"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="第一章"
                  className="w-full input-field"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowNewChapterModal(false)}
                  className="flex-1 btn-ghost"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateChapter}
                  disabled={!newChapterTitle}
                  className="flex-1 btn-amber"
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
