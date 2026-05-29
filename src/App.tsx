import React from 'react';
import { Menu, Settings, BookOpen, Sparkles, Bot, Zap, PanelLeft, PanelRight, Home, Plus } from 'lucide-react';
import { useStore } from './store';
import { ConfigPanel } from './components/ConfigPanel';
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
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-950 relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      {/* 顶部导航栏 */}
      <header className="h-16 border-b border-white/10 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80 backdrop-blur-xl z-10 flex-shrink-0">
        <div className="h-full px-4 flex items-center justify-between max-w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
              className="p-3 rounded-xl hover:bg-white/10 transition-all duration-300 group"
            >
              <PanelLeft 
                size={20} 
                className={`text-slate-400 group-hover:text-cyan-400 transition-colors duration-300 ${leftSidebarOpen ? 'text-cyan-400' : ''}`}
              />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-violet-500 to-orange-500 flex items-center justify-center shadow-neon animate-float">
                  <Bot size={22} className="text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900" />
              </div>
              <div>
                <h1 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 via-violet-400 to-orange-400 bg-clip-text text-transparent">
                  神笔 AI
                </h1>
                <p className="text-xs text-slate-500">您的智能创作伙伴</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 快速操作按钮 */}
            <button
              onClick={() => {
                setActiveRightTab('reference');
                setRightSidebarOpen(true);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                rightSidebarOpen && activeRightTab === 'reference'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <BookOpen size={18} />
              <span className="hidden sm:inline">风格参考</span>
            </button>

            <button
              onClick={() => {
                setActiveRightTab('config');
                setRightSidebarOpen(true);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                rightSidebarOpen && activeRightTab === 'config'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Settings size={18} />
              <span className="hidden sm:inline">AI配置</span>
            </button>

            <button
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              className="p-3 rounded-xl hover:bg-white/10 transition-all duration-300 group"
            >
              <PanelRight 
                size={20} 
                className={`text-slate-400 group-hover:text-violet-400 transition-colors duration-300 ${rightSidebarOpen ? 'text-violet-400' : ''}`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* 主体内容区 */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 左侧侧边栏 - 作品管理 */}
        <aside
          className={`${
            leftSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full'
          } border-r border-white/10 bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-xl transition-all duration-500 ease-out overflow-hidden z-20 flex-shrink-0`}
        >
          {leftSidebarOpen && <BookSidebar />}
        </aside>

        {/* 主要内容区 - 编辑器界面 */}
        <main className="flex-1 flex flex-col overflow-hidden relative z-10">
          <Editor />
        </main>

        {/* 右侧侧边栏 - 配置/参考 */}
        <aside
          className={`${
            rightSidebarOpen ? 'w-96 translate-x-0' : 'w-0 translate-x-full'
          } border-l border-white/10 bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-xl transition-all duration-500 ease-out overflow-hidden z-20 flex-shrink-0`}
        >
          {rightSidebarOpen && (
            <div className="h-full flex flex-col">
              {/* 右侧标签页切换 */}
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setActiveRightTab('config')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-300 relative ${
                    activeRightTab === 'config'
                      ? 'text-cyan-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Settings size={16} />
                    <span>AI配置</span>
                  </div>
                  {activeRightTab === 'config' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-violet-500" />
                  )}
                </button>
                <button
                  onClick={() => setActiveRightTab('reference')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-300 relative ${
                    activeRightTab === 'reference'
                      ? 'text-violet-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <BookOpen size={16} />
                    <span>风格参考</span>
                  </div>
                  {activeRightTab === 'reference' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-orange-500" />
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                {activeRightTab === 'config' ? <ConfigPanel /> : <ReferencePanel />}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default App;
