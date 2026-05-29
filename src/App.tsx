import React from 'react';
import { Menu, Settings, BookOpen, MessageSquare, X } from 'lucide-react';
import { useStore } from './store';
import { ConfigPanel } from './components/ConfigPanel';
import { BookSidebar } from './components/BookSidebar';
import { ChatInterface } from './components/ChatInterface';
import { ReferencePanel } from './components/ReferencePanel';

const App: React.FC = () => {
  const {
    leftSidebarOpen,
    rightSidebarOpen,
    activeRightTab,
    setLeftSidebarOpen,
    setRightSidebarOpen,
    setActiveRightTab,
  } = useStore();

  return (
    <div className="h-screen flex flex-col bg-paper-100 overflow-hidden select-none">
      {/* Header - Mobile first design */}
      <header className="h-12 md:h-14 bg-white/90 backdrop-blur-md border-b border-ink-200 flex items-center justify-between px-3 md:px-4 shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="p-2 hover:bg-minghuang-100 rounded-lg transition-colors"
          >
            <Menu size={18} md:size={20} className="text-ink-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-minghuang-500 to-yexing-500 rounded-lg flex items-center justify-center shadow-warm">
              <span className="text-white font-bold text-sm">文</span>
            </div>
            <span className="font-display font-semibold text-ink-900 text-sm md:text-base">小说助手</span>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={() => {
              setActiveRightTab('reference');
              setRightSidebarOpen(!rightSidebarOpen);
            }}
            className={`p-2 rounded-lg transition-colors ${
              rightSidebarOpen && activeRightTab === 'reference'
                ? 'bg-minghuang-100 text-minghuang-700'
                : 'text-ink-600 hover:bg-minghuang-100'
            }`}
            title="风格参考"
          >
            <BookOpen size={18} md:size={20} />
          </button>
          <button
            onClick={() => {
              setActiveRightTab('config');
              setRightSidebarOpen(!rightSidebarOpen);
            }}
            className={`p-2 rounded-lg transition-colors ${
              rightSidebarOpen && activeRightTab === 'config'
                ? 'bg-minghuang-100 text-minghuang-700'
                : 'text-ink-600 hover:bg-minghuang-100'
            }`}
            title="AI配置"
          >
            <Settings size={18} md:size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Hidden on mobile by default */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-out md:relative md:z-auto md:transform-none ${
            leftSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:w-72 lg:w-80 border-r border-ink-200 bg-paper-50`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-200 md:hidden">
            <span className="font-display font-semibold text-ink-900">作品</span>
            <button onClick={() => setLeftSidebarOpen(false)} className="p-2 hover:bg-ink-100 rounded-lg">
              <X size={20} className="text-ink-500" />
            </button>
          </div>
          <BookSidebar />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-paper-100 min-w-0">
          <ChatInterface />
        </main>

        {/* Right Sidebar - Hidden on mobile by default */}
        <aside
          className={`fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 ease-out md:relative md:z-auto md:transform-none ${
            rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          } md:w-80 lg:w-96 border-l border-ink-200 bg-paper-50`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-200 md:hidden">
            <span className="font-display font-semibold text-ink-900">
              {activeRightTab === 'config' ? 'AI配置' : '风格参考'}
            </span>
            <button onClick={() => setRightSidebarOpen(false)} className="p-2 hover:bg-ink-100 rounded-lg">
              <X size={20} className="text-ink-500" />
            </button>
          </div>
          {activeRightTab === 'config' ? <ConfigPanel /> : <ReferencePanel />}
        </aside>
      </div>

      {/* Mobile backdrop when sidebar is open */}
      {(leftSidebarOpen || rightSidebarOpen) && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => {
            setLeftSidebarOpen(false);
            setRightSidebarOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default App;
