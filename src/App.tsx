import React from 'react';
import { Menu, Settings, BookOpen, MessageSquare } from 'lucide-react';
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
      <header className="h-14 bg-white/90 backdrop-blur-md border-b border-ink-200 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="p-2 hover:bg-minghuang-100 rounded-lg transition-colors"
          >
            <Menu size={20} className="text-ink-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-minghuang-500 to-yexing-500 rounded-lg flex items-center justify-center shadow-warm">
              <span className="text-white font-bold">文</span>
            </div>
            <span className="font-display font-semibold text-ink-900">小说助手</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
            <BookOpen size={20} />
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
            <Settings size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside
          className={`${
            leftSidebarOpen ? 'w-80' : 'w-0'
          } border-r border-ink-200 transition-all duration-300 ease-out overflow-hidden bg-paper-50 shrink-0`}
        >
          {leftSidebarOpen && <BookSidebar />}
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-paper-100 min-w-0">
          <ChatInterface />
        </main>

        <aside
          className={`${
            rightSidebarOpen ? 'w-96' : 'w-0'
          } border-l border-ink-200 transition-all duration-300 ease-out overflow-hidden bg-paper-50 shrink-0`}
        >
          {rightSidebarOpen && (
            activeRightTab === 'config' ? <ConfigPanel /> : <ReferencePanel />
          )}
        </aside>
      </div>
    </div>
  );
};

export default App;
