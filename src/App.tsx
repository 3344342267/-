
import React from 'react';
import { Menu, Settings } from 'lucide-react';
import { useStore } from './store';
import { SettingsPanel } from './components/SettingsPanel';
import { BookSidebar } from './components/BookSidebar';
import { Editor } from './components/Editor';
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
    <div className="h-screen flex flex-col bg-paper-50 overflow-hidden select-none">
      <header className="h-14 bg-white/80 backdrop-blur border-b border-wood-200 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="p-2 hover:bg-wood-100 rounded-lg transition-colors"
          >
            <Menu size={20} className="text-wood-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-warm">
              <span className="text-white font-bold">文</span>
            </div>
            <span className="font-display font-semibold text-wood-900">小说助手</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveRightTab('settings');
              setRightSidebarOpen(!rightSidebarOpen);
            }}
            className={`p-2 rounded-lg transition-colors ${
              rightSidebarOpen && activeRightTab === 'settings'
                ? 'bg-amber-100 text-amber-700'
                : 'text-wood-600 hover:bg-wood-100'
            }`}
          >
            <Settings size={20} />
          </button>
          <button
            onClick={() => {
              setActiveRightTab('reference');
              setRightSidebarOpen(!rightSidebarOpen);
            }}
            className={`p-2 rounded-lg transition-colors ${
              rightSidebarOpen && activeRightTab === 'reference'
                ? 'bg-amber-100 text-amber-700'
                : 'text-wood-600 hover:bg-wood-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside
          className={`${
            leftSidebarOpen ? 'w-80' : 'w-0'
          } border-r border-wood-200 transition-all duration-300 ease-out overflow-hidden bg-paper-50 shrink-0`}
        >
          {leftSidebarOpen && <BookSidebar />}
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-paper-50 min-w-0">
          <Editor />
        </main>

        <aside
          className={`${
            rightSidebarOpen ? 'w-96' : 'w-0'
          } border-l border-wood-200 transition-all duration-300 ease-out overflow-hidden bg-paper-50 shrink-0`}
        >
          {rightSidebarOpen && (
            <>
              {activeRightTab === 'settings' ? <SettingsPanel /> : <ReferencePanel />}
            </>
          )}
        </aside>
      </div>
    </div>
  );
};

export default App;
