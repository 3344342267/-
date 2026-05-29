
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
    content: `你是一位专业的小说写作助手，擅长创作高质量的小说内容。

写作要求：
- 保持自然流畅的文笔，避免生硬和AI感
- 注意人物性格的一致性
- 保持剧情连贯性
- 语言风格要适合小说阅读
- 注意文字密度和情节节奏`,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-immersive',
    name: '深潜·感官沉浸',
    description: '感官优先叙事，强调细节密度与情感浓度，适合精品短篇与高潮场景',
    content: `你是一位擅长沉浸式描写的小说作家。

写作特点：
- 注重感官细节描写（视觉、听觉、嗅觉、触觉、味觉）
- 营造强烈的情感氛围
- 细腻刻画人物心理活动
- 适合描写高潮场景和情感冲突`,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-structure',
    name: '经纬·情节架构',
    description: '注重叙事逻辑与场景结构，适合长篇章节推进和复杂剧情编排',
    content: `你是一位擅长构建复杂情节的小说作家。

写作特点：
- 注重叙事逻辑和情节结构
- 合理安排章节节奏
- 构建引人入胜的情节线
- 适合长篇小说创作和复杂剧情编排`,
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-minimal',
    name: '素笔·极简模式',
    description: '最少限制，AI自由发挥，适合快速探索和实验性创作',
    content: `你是一位富有创造力的写作者。

写作特点：
- 自由发挥，不受太多限制
- 鼓励实验性和创新性写作
- 快速探索不同的写作风格和想法`,
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
