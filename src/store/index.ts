
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  AppState, 
  Book, 
  Chapter, 
  Outline, 
  HistoryItem, 
  Reference 
} from './types';

const STORAGE_KEY = 'novel-ai-writer';

const DEFAULT_SETTINGS = {
  id: 'default',
  provider: 'openai' as const,
  apiUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4',
  models: [],
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      books: [],
      currentBookId: null,
      chapters: [],
      currentChapterId: null,
      outlines: [],
      history: [],
      settings: DEFAULT_SETTINGS,
      references: [],
      leftSidebarOpen: true,
      rightSidebarOpen: false,
      activeRightTab: 'settings' as const,
      isGenerating: false,
      abortController: null,

      // Book actions
      setBooks: (books) => set({ books }),
      addBook: (book) => set((state) => ({ 
        books: [...state.books, book] 
      })),
      updateBook: (id, updates) => set((state) => ({
        books: state.books.map(book => 
          book.id === id ? { ...book, ...updates } : book
        )
      })),
      deleteBook: (id) => set((state) => ({
        books: state.books.filter(book => book.id !== id),
        chapters: state.chapters.filter(chapter => chapter.bookId !== id),
        outlines: state.outlines.filter(outline => outline.bookId !== id),
        currentBookId: state.currentBookId === id ? null : state.currentBookId,
        currentChapterId: state.chapters.find(c => c.bookId === id)?.id === state.currentChapterId 
          ? null 
          : state.currentChapterId,
      })),
      setCurrentBookId: (id) => set({ currentBookId: id }),

      // Chapter actions
      setChapters: (chapters) => set({ chapters }),
      addChapter: (chapter) => set((state) => ({
        chapters: [...state.chapters, chapter]
      })),
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

      // Outline actions
      setOutlines: (outlines) => set({ outlines }),
      addOutline: (outline) => set((state) => ({
        outlines: [...state.outlines, outline]
      })),
      updateOutline: (id, updates) => set((state) => ({
        outlines: state.outlines.map(outline =>
          outline.id === id ? { ...outline, ...updates } : outline
        )
      })),

      // History actions
      setHistory: (history) => set({ history }),
      addHistoryItem: (item) => set((state) => ({
        history: [...state.history, item]
      })),
      updateHistoryItem: (id, updates) => set((state) => ({
        history: state.history.map(h =>
          h.id === id ? { ...h, ...updates } : h
        )
      })),
      clearHistory: (chapterId) => set((state) => ({
        history: state.history.filter(h => h.chapterId !== chapterId)
      })),

      // Settings actions
      setSettings: (settings) => set((state) => ({
        settings: { ...state.settings, ...settings }
      })),

      // Reference actions
      setReferences: (references) => set({ references }),
      addReference: (reference) => set((state) => ({
        references: [...state.references, reference]
      })),
      removeReference: (id) => set((state) => ({
        references: state.references.filter(r => r.id !== id)
      })),

      // UI actions
      setLeftSidebarOpen: (open) => set({ leftSidebarOpen: open }),
      setRightSidebarOpen: (open) => set({ rightSidebarOpen: open }),
      setActiveRightTab: (tab) => set({ activeRightTab: tab }),
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      setAbortController: (controller) => set({ abortController: controller }),

      // Storage actions
      loadFromStorage: () => {
        // Handled by persist middleware
      },
      saveToStorage: () => {
        // Handled by persist middleware
      },
    }),
    {
      name: STORAGE_KEY,
    }
  )
);
