
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
import { BUILT_IN_PRESETS } from '../utils/prompts';

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

const DEFAULT_PRESETS: Preset[] = BUILT_IN_PRESETS as Preset[];

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
