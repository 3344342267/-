import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  AppState, 
  Book, 
  Chapter, 
  Outline, 
  HistoryItem, 
  Reference,
  ModelConfig,
  Preset,
  BookSource,
  ApiProvider
} from './types';

const STORAGE_KEY = 'novel-ai-writer';

const DEFAULT_API_SETTINGS = {
  provider: 'openai' as ApiProvider,
  apiUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4',
  models: [],
};

const DEFAULT_SETTINGS = {
  id: 'default',
  activeModelConfigId: '',
};

const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'preset-none',
    name: '无预设',
    description: '不注入任何系统提示词，完全由用户指令驱动',
    content: '',
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-narrative',
    name: '灵犀·叙事引擎',
    description: '深度叙事美学框架，注重文字密度、风格精准性与情节节奏',
    content: `你是一位经验丰富的小说家，擅长创作引人入胜的故事。

写作原则：
1. 使用自然流畅的语言，避免生硬、机械化的表达
2. 注重细节描写，让场景和人物更加生动立体
3. 保持人物性格的一致性和真实感
4. 情节推进要有节奏感，适当设置悬念和转折
5. 避免使用过于夸张或不自然的比喻和形容词
6. 语言风格要贴近真实的小说写作，避免AI感

注意事项：
- 不要使用"AI"、"模型"、"算法"等与人工智能相关的词汇
- 不要出现"以下是..."、"根据您的要求..."等格式化的开头
- 直接进入故事，用自然的叙述方式展现内容
- 注意段落结构，使用适当的换行和分段`,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-immersive',
    name: '深潜·感官沉浸',
    description: '感官优先叙事，强调细节密度与情感浓度，适合精品短篇与高潮场景',
    content: `你是一位擅长沉浸式描写的小说家，注重通过感官细节让读者身临其境。

写作特点：
1. 注重感官细节描写——视觉、听觉、嗅觉、触觉、味觉
2. 营造强烈的情感氛围，让读者感同身受
3. 细腻刻画人物的心理活动和情绪变化
4. 适合描写高潮场景和情感冲突
5. 使用具体、生动的意象，避免抽象和空洞的表达

语言风格：
- 细腻而不繁琐，生动而不夸张
- 避免使用陈词滥调和俗套比喻
- 让文字富有画面感和感染力
- 保持自然流畅的叙事节奏`,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-structure',
    name: '经纬·情节架构',
    description: '注重叙事逻辑与场景结构，适合长篇章节推进和复杂剧情编排',
    content: `你是一位擅长构建复杂情节的小说家，注重故事的逻辑性和结构美。

写作特点：
1. 注重叙事逻辑和情节结构的合理性
2. 合理安排章节节奏和情节推进
3. 构建引人入胜的情节线和人物关系
4. 适合长篇小说创作和复杂剧情编排
5. 保持故事的连贯性和完整性

创作要点：
- 每个场景都要有明确的目的和作用
- 人物的行动和决策要符合其性格和处境
- 伏笔和铺垫要自然，不要显得刻意
- 避免情节漏洞和逻辑矛盾`,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-character',
    name: '众生·人物塑造',
    description: '聚焦人物内心与成长，深入刻画角色的性格、动机与情感变化',
    content: `你是一位擅长刻画人物的小说家，能够深入挖掘角色的内心世界。

写作特点：
1. 深入刻画人物的性格特点和内心活动
2. 展现人物的成长和变化过程
3. 让人物的动机和行为逻辑清晰可信
4. 通过细节展现人物个性，而非直接描述
5. 创造真实、立体、有血有肉的角色

创作要点：
- 人物对话要符合其身份和性格
- 通过人物的选择和行动展现其价值观
- 避免扁平的人物设定，赋予每个角色独特性
- 描写人物的情感变化要细腻自然`,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-minimal',
    name: '素笔·极简模式',
    description: '最少限制，自由发挥，适合快速探索和实验性创作',
    content: `你是一位富有创造力的写作者，善于捕捉灵感并自由表达。

写作特点：
1. 自由发挥，不受太多限制
2. 鼓励实验性和创新性写作
3. 快速探索不同的写作风格和想法
4. 保持文字的简洁和力量

注意事项：
- 保持自然的叙事节奏
- 避免过于复杂的结构
- 让故事自然地展开和流动`,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_BOOK_SOURCES: BookSource[] = [
  {
    id: 'source-default',
    name: '默认书源',
    url: 'https://shuyuan.nyasama.cc/shuyuan/f5b15e9641d164937061974cfefb675c.json',
    enabled: true,
  },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      books: [],
      currentBookId: null,
      chapters: [],
      currentChapterId: null,
      outlines: [],
      history: [],
      settings: DEFAULT_SETTINGS,
      apiSettings: DEFAULT_API_SETTINGS,
      modelConfigs: [],
      presets: DEFAULT_PRESETS,
      references: [],
      bookSources: DEFAULT_BOOK_SOURCES,
      leftSidebarOpen: true,
      rightSidebarOpen: false,
      activeRightTab: 'config',
      isGenerating: false,
      abortController: null,

      setBooks: (books) => set({ books }),
      addBook: (book) => set((state) => ({ books: [...state.books, book] })),
      updateBook: (id, updates) => set((state) => ({
        books: state.books.map(book => book.id === id ? { ...book, ...updates } : book)
      })),
      deleteBook: (id) => set((state) => ({
        books: state.books.filter(book => book.id !== id),
        chapters: state.chapters.filter(chapter => chapter.bookId !== id),
        outlines: state.outlines.filter(outline => outline.bookId !== id),
        currentBookId: state.currentBookId === id ? null : state.currentBookId,
        currentChapterId: state.chapters.find(c => c.bookId === id)?.id === state.currentChapterId ? null : state.currentChapterId,
      })),
      setCurrentBookId: (id) => set({ currentBookId: id }),

      setChapters: (chapters) => set({ chapters }),
      addChapter: (chapter) => set((state) => ({ chapters: [...state.chapters, chapter] })),
      updateChapter: (id, updates) => set((state) => ({
        chapters: state.chapters.map(chapter =>
          chapter.id === id ? { ...chapter, ...updates, updatedAt: new Date().toISOString() } : chapter
        )
      })),
      deleteChapter: (id) => set((state) => ({
        chapters: state.chapters.filter(chapter => chapter.id !== id),
        currentChapterId: state.currentChapterId === id ? null : state.currentChapterId,
        history: state.history.filter(h => h.chapterId !== id)
      })),
      setCurrentChapterId: (id) => set({ currentChapterId: id }),

      setOutlines: (outlines) => set({ outlines }),
      addOutline: (outline) => set((state) => ({ outlines: [...state.outlines, outline] })),
      updateOutline: (id, updates) => set((state) => ({
        outlines: state.outlines.map(outline =>
          outline.id === id ? { ...outline, ...updates } : outline
        )
      })),

      setHistory: (history) => set({ history }),
      addHistoryItem: (item) => set((state) => ({ history: [...state.history, item] })),
      updateHistoryItem: (id, updates) => set((state) => ({
        history: state.history.map(h => h.id === id ? { ...h, ...updates } : h)
      })),
      removeHistoryItem: (id) => set((state) => ({
        history: state.history.filter(h => h.id !== id)
      })),
      clearHistory: (chapterId) => set((state) => ({
        history: state.history.filter(h => h.chapterId !== chapterId)
      })),

      setSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),
      setApiSettings: (settings) => set((state) => ({ apiSettings: { ...state.apiSettings, ...settings } })),

      setModelConfigs: (configs) => set({ modelConfigs: configs }),
      addModelConfig: (config) => set((state) => ({ modelConfigs: [...state.modelConfigs, config] })),
      updateModelConfig: (id, updates) => set((state) => ({
        modelConfigs: state.modelConfigs.map(c => c.id === id ? { ...c, ...updates } : c)
      })),
      deleteModelConfig: (id) => set((state) => ({
        modelConfigs: state.modelConfigs.filter(c => c.id !== id),
        settings: state.settings.activeModelConfigId === id ? { ...state.settings, activeModelConfigId: '' } : state.settings
      })),
      setActiveModelConfig: (id) => {
        set({ settings: { ...get().settings, activeModelConfigId: id } });
        const config = get().modelConfigs.find(c => c.id === id);
        if (config) {
          set({ 
            apiSettings: {
              provider: config.provider,
              apiUrl: config.apiUrl,
              apiKey: config.apiKey,
              model: config.model,
              models: []
            }
          });
        }
      },

      setPresets: (presets) => set({ presets }),
      addPreset: (preset) => set((state) => ({ presets: [...state.presets, preset] })),
      updatePreset: (id, updates) => set((state) => ({
        presets: state.presets.map(p => p.id === id ? { ...p, ...updates } : p)
      })),
      deletePreset: (id) => set((state) => ({
        presets: state.presets.filter(p => !p.isBuiltIn && p.id !== id)
      })),

      setReferences: (references) => set({ references }),
      addReference: (reference) => set((state) => ({ references: [...state.references, reference] })),
      removeReference: (id) => set((state) => ({ references: state.references.filter(r => r.id !== id) })),

      setBookSources: (sources) => set({ bookSources: sources }),
      addBookSource: (source) => set((state) => ({ bookSources: [...state.bookSources, source] })),
      updateBookSource: (id, updates) => set((state) => ({
        bookSources: state.bookSources.map(s => s.id === id ? { ...s, ...updates } : s)
      })),
      deleteBookSource: (id) => set((state) => ({ bookSources: state.bookSources.filter(s => s.id !== id) })),

      setLeftSidebarOpen: (open) => set({ leftSidebarOpen: open }),
      setRightSidebarOpen: (open) => set({ rightSidebarOpen: open }),
      setActiveRightTab: (tab) => set({ activeRightTab: tab }),
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      setAbortController: (controller) => set({ abortController: controller }),

      loadFromStorage: () => {},
      saveToStorage: () => {},
    }),
    {
      name: STORAGE_KEY,
    }
  )
);
