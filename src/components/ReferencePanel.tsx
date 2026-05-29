
import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Link2, Upload, Trash2, X, Eye, ExternalLink } from 'lucide-react';
import { useStore } from '../store';
import { Reference, ReferenceType } from '../store/types';

export const ReferencePanel: React.FC = () => {
  const {
    references,
    addReference,
    removeReference,
    setRightSidebarOpen,
    saveToStorage,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<ReferenceType>('file');
  const [addTitle, setAddTitle] = useState('');
  const [addUrl, setAddUrl] = useState('');
  const [addContent, setAddContent] = useState('');
  const [viewingReference, setViewingReference] = useState<Reference | null>(null);

  const [bookSources, setBookSources] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentSourcePage, setCurrentSourcePage] = useState(1);

  const DEFAULT_BOOK_SOURCE = 'https://shuyuan.nyasama.cc/shuyuan/f5b15e9641d164937061974cfefb675c.json';

  useEffect(() => {
    loadBookSources();
  }, []);

  const loadBookSources = async () => {
    try {
      const response = await fetch(DEFAULT_BOOK_SOURCE);
      const data = await response.json();
      setBookSources(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load book sources:', error);
    }
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.length > 0) {
      setIsSearching(true);
      const results = bookSources.filter(book => 
        book.name?.toLowerCase().includes(term.toLowerCase()) ||
        book.author?.toLowerCase().includes(term.toLowerCase())
      );
      setSearchResults(results);
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

  return (
    <div className="h-full bg-paper-50 border-l border-wood-200 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-wood-200">
        <h2 className="text-lg font-display font-semibold text-wood-900 flex items-center gap-2">
          <BookOpen size={20} />
          风格参考
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => setShowAddModal(true)}
            className="p-2 hover:bg-wood-100 rounded-lg transition-colors"
          >
            <Upload size={20} className="text-wood-600" />
          </button>
          <button
            onClick={() => setRightSidebarOpen(false)}
            className="p-2 hover:bg-wood-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-wood-600" />
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-wood-200">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-wood-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="搜索书籍参考..."
            className="w-full pl-10 pr-4 py-2 input-field"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {isSearching ? (
          <div className="text-center py-8 text-wood-500">
            搜索中...
          </div>
        ) : searchTerm.length > 0 && searchResults.length > 0 ? (
          searchResults.map((book, index) => (
            <div key={index} className="paper-texture rounded-xl p-4 shadow-paper border border-wood-100">
              <h3 className="font-medium text-wood-900">{book.name}</h3>
              {book.author && (
                <p className="text-sm text-wood-600 mt-1">{book.author}</p>
              )}
              {book.desc && (
                <p className="text-xs text-wood-500 mt-2 line-clamp-2">{book.desc}</p>
              )}
              {book.bookUrl && (
                <a
                  href={book.bookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
                >
                  <ExternalLink size={12} />
                  查看书籍
                </a>
              )}
            </div>
          ))
        ) : references.length === 0 ? (
          <div className="text-center py-8 text-wood-500">
            <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">还没有风格参考</p>
            <p className="text-xs mt-1">上传文件、添加链接或搜索书籍</p>
          </div>
        ) : (
          references.map(ref => (
            <div key={ref.id} className="paper-texture rounded-xl p-4 shadow-paper border border-wood-100">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-wood-900 truncate">{ref.title}</h3>
                  <p className="text-xs text-wood-500 mt-1">
                    {ref.type === 'file' ? '文件' : ref.type === 'url' ? '链接' : '文本'}
                    · {new Date(ref.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => setViewingReference(ref)}
                    className="p-1.5 hover:bg-wood-100 rounded transition-colors"
                  >
                    <Eye size={16} className="text-wood-600" />
                  </button>
                  <button
                    onClick={() => handleRemove(ref.id)}
                    className="p-1.5 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-paper-50 rounded-2xl shadow-warm max-w-md w-full p-6">
            <h3 className="text-lg font-display font-semibold text-wood-900 mb-4">
              添加风格参考
            </h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setAddType('text')}
                  className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                    addType === 'text' ? 'bg-amber-100 text-amber-800' : 'bg-wood-100 text-wood-700'
                  }`}
                >
                  文本
                </button>
                <button
                  onClick={() => setAddType('url')}
                  className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                    addType === 'url' ? 'bg-amber-100 text-amber-800' : 'bg-wood-100 text-wood-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Link2 size={14} />
                    链接
                  </div>
                </button>
                <label className="flex-1 py-2 rounded-lg text-sm text-center transition-colors cursor-pointer bg-wood-100 text-wood-700">
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
                <label className="block text-sm text-wood-600 mb-2">标题</label>
                <input
                  type="text"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="参考标题"
                  className="w-full input-field"
                />
              </div>
              {addType === 'url' && (
                <div>
                  <label className="block text-sm text-wood-600 mb-2">URL</label>
                  <input
                    type="url"
                    value={addUrl}
                    onChange={(e) => setAddUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full input-field"
                  />
                </div>
              )}
              {addType === 'text' && (
                <div>
                  <label className="block text-sm text-wood-600 mb-2">内容</label>
                  <textarea
                    value={addContent}
                    onChange={(e) => setAddContent(e.target.value)}
                    placeholder="粘贴要参考的文字内容..."
                    rows={6}
                    className="w-full input-field resize-none"
                  />
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 btn-ghost"
                >
                  取消
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!addTitle}
                  className="flex-1 btn-amber"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingReference && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-paper-50 rounded-2xl shadow-warm max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-wood-200">
              <h3 className="text-lg font-display font-semibold text-wood-900">
                {viewingReference.title}
              </h3>
              <button
                onClick={() => setViewingReference(null)}
                className="p-2 hover:bg-wood-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-wood-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {viewingReference.type === 'url' && viewingReference.url ? (
                <div className="text-center">
                  <a
                    href={viewingReference.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 hover:text-amber-700 flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={20} />
                    {viewingReference.url}
                  </a>
                </div>
              ) : viewingReference.content ? (
                <div className="text-wood-800 whitespace-pre-wrap font-serif leading-relaxed">
                  {viewingReference.content}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
