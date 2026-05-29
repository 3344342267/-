import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Link2, Upload, Trash2, X, Eye, ExternalLink, Plus, Check, BookMarked, Settings } from 'lucide-react';
import { useStore } from '../store';
import { Reference, ReferenceType, BookSource } from '../store/types';

export const ReferencePanel: React.FC = () => {
  const {
    references,
    addReference,
    removeReference,
    setRightSidebarOpen,
    saveToStorage,
    bookSources,
    setBookSources,
    addBookSource,
    updateBookSource,
    deleteBookSource,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<ReferenceType>('file');
  const [addTitle, setAddTitle] = useState('');
  const [addUrl, setAddUrl] = useState('');
  const [addContent, setAddContent] = useState('');
  const [viewingReference, setViewingReference] = useState<Reference | null>(null);
  const [selectedBook, setSelectedBook] = useState<any>(null);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentSourcePage, setCurrentSourcePage] = useState(1);
  const [activeTab, setActiveTab] = useState<'search' | 'sources' | 'references'>('search');
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', url: '' });

  useEffect(() => {
    if (bookSources.length === 0) {
      loadDefaultBookSource();
    }
  }, []);

  const loadDefaultBookSource = async () => {
    const defaultSource: BookSource = {
      id: 'source-default',
      name: '默认书源',
      url: 'https://shuyuan.nyasama.cc/shuyuan/f5b15e9641d164937061974cfefb675c.json',
      enabled: true,
    };
    addBookSource(defaultSource);
    saveToStorage();
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.length >= 2) {
      setIsSearching(true);
      let allResults: any[] = [];
      
      for (const source of bookSources.filter(s => s.enabled)) {
        try {
          const response = await fetch(source.url);
          const data = await response.json();
          const books = Array.isArray(data) ? data : [];
          const filtered = books.filter((book: any) => 
            book.name?.toLowerCase().includes(term.toLowerCase()) ||
            book.author?.toLowerCase().includes(term.toLowerCase())
          );
          allResults = [...allResults, ...filtered];
        } catch (error) {
          console.error(`Failed to search source ${source.name}:`, error);
        }
      }
      
      setSearchResults(allResults);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const reference: Reference = {
        id: Date.now().toString(),
        type: 'file',
        title: file.name,
        content,
        createdAt: new Date().toISOString(),
      };
      addReference(reference);
      saveToStorage();
    };
    reader.readAsText(file);
  };

  const handleAdd = () => {
    if (!addTitle) return;

    const reference: Reference = {
      id: Date.now().toString(),
      type: addType,
      title: addTitle,
      url: addType === 'url' ? addUrl : undefined,
      content: addType === 'text' ? addContent : undefined,
      createdAt: new Date().toISOString(),
    };

    addReference(reference);
    setShowAddModal(false);
    setAddTitle('');
    setAddUrl('');
    setAddContent('');
    saveToStorage();
  };

  const handleRemove = (id: string) => {
    if (confirm('确定要删除这个参考吗？')) {
      removeReference(id);
      saveToStorage();
    }
  };

  const handleAddSource = () => {
    if (!newSource.name || !newSource.url) {
      alert('请填写完整的书源信息');
      return;
    }

    const source: BookSource = {
      id: Date.now().toString(),
      name: newSource.name,
      url: newSource.url,
      enabled: true,
    };

    addBookSource(source);
    setShowSourceModal(false);
    setNewSource({ name: '', url: '' });
    saveToStorage();
  };

  const handleToggleSource = (id: string) => {
    const source = bookSources.find(s => s.id === id);
    if (source) {
      updateBookSource(id, { enabled: !source.enabled });
      saveToStorage();
    }
  };

  const handleDeleteSource = (id: string) => {
    if (bookSources.length <= 1) {
      alert('至少需要保留一个书源');
      return;
    }
    if (confirm('确定要删除这个书源吗？')) {
      deleteBookSource(id);
      saveToStorage();
    }
  };

  const handleLearnFromBook = (book: any) => {
    setSelectedBook(book);
  };

  const confirmLearnStyle = () => {
    if (!selectedBook) return;

    const content = `书名: ${selectedBook.name}\n作者: ${selectedBook.author || '未知'}\n简介: ${selectedBook.desc || '暂无'}\n\n--- 书籍信息 ---\n这是一本${selectedBook.name}风格的小说，作者${selectedBook.author}。请学习其写作风格特点。`;

    const reference: Reference = {
      id: Date.now().toString(),
      type: 'book',
      title: selectedBook.name,
      url: selectedBook.bookUrl,
      content,
      createdAt: new Date().toISOString(),
    };

    addReference(reference);
    saveToStorage();
    setSelectedBook(null);
    alert(`已学习《${selectedBook.name}》的风格！`);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-3 text-sm font-medium transition-all relative ${
            activeTab === 'search'
              ? 'text-cyan-400'
              : 'text-slate-500 hover:text-slate-200'
          }`}
        >
          书源搜索
          {activeTab === 'search' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-violet-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('sources')}
          className={`flex-1 py-3 text-sm font-medium transition-all relative ${
            activeTab === 'sources'
              ? 'text-violet-400'
              : 'text-slate-500 hover:text-slate-200'
          }`}
        >
          书源管理
          {activeTab === 'sources' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-orange-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('references')}
          className={`flex-1 py-3 text-sm font-medium transition-all relative ${
            activeTab === 'references'
              ? 'text-orange-400'
              : 'text-slate-500 hover:text-slate-200'
          }`}
        >
          我的参考
          {activeTab === 'references' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-cyan-500" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {activeTab === 'search' && (
          <div className="p-4">
            <div className="relative mb-4">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="搜索书籍..."
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
              />
            </div>

            {isSearching ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto mb-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400">搜索中...</p>
              </div>
            ) : searchTerm.length >= 2 && searchResults.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {searchResults.map((book, index) => (
                  <div
                    key={index}
                    className="card-enhanced cursor-pointer hover:border-cyan-500/30 transition-all"
                    onClick={() => handleLearnFromBook(book)}
                  >
                    <div className="aspect-[3/4] bg-gradient-to-br from-cyan-500/10 to-violet-500/10 rounded-lg mb-2 overflow-hidden">
                      {book.cover ? (
                        <img
                          src={book.cover}
                          alt={book.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><BookMarked size={36} class="text-cyan-400" /></div>';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookMarked size={36} className="text-cyan-400" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-slate-200 text-sm truncate">{book.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 truncate">{book.author || '未知作者'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen size={48} className="mx-auto mb-3 text-slate-600" />
                <p className="text-slate-400 mb-1">输入关键词搜索书籍</p>
                <p className="text-xs text-slate-600">可搜索书名或作者</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="p-4 space-y-3">
            {bookSources.map(source => (
              <div
                key={source.id}
                className={`p-4 rounded-xl border transition-all ${
                  source.enabled
                    ? 'border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-violet-500/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {source.enabled && (
                      <Check size={16} className="text-cyan-400" />
                    )}
                    <div>
                      <span className="font-medium text-slate-200">{source.name}</span>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{source.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleSource(source.id)}
                      className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        source.enabled
                          ? 'bg-white/5 text-slate-400 hover:bg-white/10'
                          : 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 hover:shadow-neon'
                      }`}
                    >
                      {source.enabled ? '禁用' : '启用'}
                    </button>
                    <button
                      onClick={() => handleDeleteSource(source.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => setShowSourceModal(true)}
              className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-slate-400 hover:border-orange-500/50 hover:text-orange-400 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              添加书源
            </button>
          </div>
        )}

        {activeTab === 'references' && (
          <div className="p-4 space-y-3">
            {references.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen size={48} className="mx-auto mb-3 text-slate-600" />
                <p className="text-slate-400 mb-1">还没有风格参考</p>
                <p className="text-xs text-slate-600">上传文件、添加链接或搜索书籍</p>
              </div>
            ) : (
              references.map(ref => (
                <div key={ref.id} className="card-enhanced">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-200 truncate">{ref.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {ref.type === 'file' ? '文件' : ref.type === 'url' ? '链接' : ref.type === 'book' ? '书籍' : '文本'}
                        · {new Date(ref.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => setViewingReference(ref)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <Eye size={16} className="text-slate-400" />
                      </button>
                      <button
                        onClick={() => handleRemove(ref.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Floating add button */}
      {activeTab === 'references' && (
        <button
          onClick={() => setShowAddModal(true)}
          className="absolute right-4 bottom-4 w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 flex items-center justify-center shadow-neon hover:scale-105 transition-transform"
        >
          <Plus size={24} className="text-white" />
        </button>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-neon max-w-md w-full p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-100">添加风格参考</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setAddType('text')}
                  className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                    addType === 'text' 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 border border-cyan-500/30' 
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  文本
                </button>
                <button
                  onClick={() => setAddType('url')}
                  className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                    addType === 'url' 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 border border-cyan-500/30' 
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Link2 size={14} />
                    链接
                  </div>
                </button>
                <label className="flex-1 py-2 rounded-lg text-sm text-center transition-colors cursor-pointer bg-white/5 text-slate-400 hover:bg-white/10">
                  <div className="flex items-center justify-center gap-1">
                    <Upload size={14} />
                    文件
                  </div>
                  <input
                    type="file"
                    onChange={handleAddFile}
                    className="hidden"
                    accept=".txt,.md,.html"
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">标题</label>
                <input
                  type="text"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="参考标题"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                />
              </div>
              {addType === 'url' && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">URL</label>
                  <input
                    type="url"
                    value={addUrl}
                    onChange={(e) => setAddUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                  />
                </div>
              )}
              {addType === 'text' && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">内容</label>
                  <textarea
                    value={addContent}
                    onChange={(e) => setAddContent(e.target.value)}
                    placeholder="粘贴要参考的文字内容..."
                    rows={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all resize-none"
                  />
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!addTitle}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-medium hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingReference && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-neon max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-slate-100">
                {viewingReference.title}
              </h3>
              <button
                onClick={() => setViewingReference(null)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {viewingReference.type === 'url' && viewingReference.url ? (
                <div className="text-center">
                  <a
                    href={viewingReference.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={20} />
                    {viewingReference.url}
                  </a>
                </div>
              ) : viewingReference.content ? (
                <div className="text-slate-300 whitespace-pre-wrap font-serif leading-relaxed">
                  {viewingReference.content}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {selectedBook && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-neon max-w-md w-full p-6 animate-slide-up">
            <div className="text-center">
              <div className="aspect-[3/4] bg-gradient-to-br from-cyan-500/10 to-violet-500/10 rounded-xl mb-4 mx-auto max-w-[200px] overflow-hidden">
                {selectedBook.cover ? (
                  <img
                    src={selectedBook.cover}
                    alt={selectedBook.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><BookMarked size={48} class="text-cyan-400" /></div>';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookMarked size={48} className="text-cyan-400" />
                  </div>
                )}
              </div>
              <h3 className="text-xl font-semibold text-slate-100">{selectedBook.name}</h3>
              <p className="text-slate-400 mt-1">{selectedBook.author || '未知作者'}</p>
              {selectedBook.desc && (
                <p className="text-sm text-slate-500 mt-2 line-clamp-3">{selectedBook.desc}</p>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setSelectedBook(null)}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all"
              >
                取消
              </button>
              <button
                onClick={confirmLearnStyle}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-medium hover:shadow-neon transition-all"
              >
                学习风格
              </button>
            </div>
          </div>
        </div>
      )}

      {showSourceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-neon max-w-md w-full p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-100">添加书源</h3>
              <button
                onClick={() => setShowSourceModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">书源名称</label>
                <input
                  type="text"
                  value={newSource.name}
                  onChange={(e) => setNewSource(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="如：番茄小说"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">书源 URL</label>
                <input
                  type="url"
                  value={newSource.url}
                  onChange={(e) => setNewSource(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com/books.json"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowSourceModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleAddSource}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-medium hover:shadow-neon transition-all"
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
