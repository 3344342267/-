
export interface Book {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  content: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Outline {
  id: string;
  bookId: string;
  content: string;
  chapterPlans: ChapterPlan[];
  createdAt: string;
}

export interface ChapterPlan {
  id: string;
  chapterNumber: number;
  title: string;
  plot: string;
}

export interface HistoryItem {
  id: string;
  chapterId: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  createdAt: string;
}

export interface ApiSettings {
  provider: 'openai' | 'openai-responses' | 'claude' | 'gemini';
  apiUrl: string;
  apiKey: string;
  model: string;
  models: string[];
}

export interface ThemeSettings {
  backgroundImage?: string;
}

export interface Settings extends ApiSettings, ThemeSettings {
  id: string;
}

export type ReferenceType = 'text' | 'file' | 'url' | 'book';

export interface Reference {
  id: string;
  type: ReferenceType;
  title: string;
  url?: string;
  content?: string;
  createdAt: string;
}

export interface AppState {
  // Books
  books: Book[];
  currentBookId: string | null;
  // Chapters
  chapters: Chapter[];
  currentChapterId: string | null;
  // Outlines
  outlines: Outline[];
  // History
  history: HistoryItem[];
  // Settings
  settings: Settings;
  // Style References
  references: Reference[];
  // UI State
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  activeRightTab: 'settings' | 'reference';
  isGenerating: boolean;
  abortController: AbortController | null;
  // Actions
  setBooks: (books: Book[]) => void;
  addBook: (book: Book) => void;
  updateBook: (id: string, updates: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  setCurrentBookId: (id: string | null) => void;
  setChapters: (chapters: Chapter[]) => void;
  addChapter: (chapter: Chapter) => void;
  updateChapter: (id: string, updates: Partial<Chapter>) => void;
  deleteChapter: (id: string) => void;
  setCurrentChapterId: (id: string | null) => void;
  setOutlines: (outlines: Outline[]) => void;
  addOutline: (outline: Outline) => void;
  updateOutline: (id: string, updates: Partial<Outline>) => void;
  setHistory: (history: HistoryItem[]) => void;
  addHistoryItem: (item: HistoryItem) => void;
  updateHistoryItem: (id: string, updates: Partial<HistoryItem>) => void;
  clearHistory: (chapterId: string) => void;
  setSettings: (settings: Partial<Settings>) => void;
  setReferences: (references: Reference[]) => void;
  addReference: (reference: Reference) => void;
  removeReference: (id: string) => void;
  setLeftSidebarOpen: (open: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;
  setActiveRightTab: (tab: 'settings' | 'reference') => void;
  setIsGenerating: (generating: boolean) => void;
  setAbortController: (controller: AbortController | null) => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}
