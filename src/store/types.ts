
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

export type ApiProvider = 'openai' | 'openai-responses' | 'claude' | 'gemini' | 'custom';

export interface ApiSettings {
  provider: ApiProvider;
  apiUrl: string;
  apiKey: string;
  model: string;
  models: string[];
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: ApiProvider;
  apiUrl: string;
  apiKey: string;
  model: string;
  presetId: string;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  maxTokens: number;
  minTokens: number;
  maxContextTokens: number;
  isActive: boolean;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  content: string;
  isBuiltIn: boolean;
  createdAt: string;
}

export interface ThemeSettings {
  backgroundImage?: string;
}

export interface Settings {
  id: string;
  activeModelConfigId: string;
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

export interface BookSource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

export interface BookInfo {
  id: string;
  name: string;
  author: string;
  cover: string;
  desc: string;
  bookUrl: string;
}

export interface AppState {
  books: Book[];
  currentBookId: string | null;
  chapters: Chapter[];
  currentChapterId: string | null;
  outlines: Outline[];
  history: HistoryItem[];
  settings: Settings;
  apiSettings: ApiSettings;
  modelConfigs: ModelConfig[];
  presets: Preset[];
  references: Reference[];
  bookSources: BookSource[];
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  activeRightTab: 'config' | 'reference';
  isGenerating: boolean;
  abortController: AbortController | null;
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
  removeHistoryItem: (id: string) => void;
  clearHistory: (chapterId: string) => void;
  setSettings: (settings: Partial<Settings>) => void;
  setApiSettings: (settings: Partial<ApiSettings>) => void;
  setModelConfigs: (configs: ModelConfig[]) => void;
  addModelConfig: (config: ModelConfig) => void;
  updateModelConfig: (id: string, updates: Partial<ModelConfig>) => void;
  deleteModelConfig: (id: string) => void;
  setActiveModelConfig: (id: string) => void;
  setPresets: (presets: Preset[]) => void;
  addPreset: (preset: Preset) => void;
  updatePreset: (id: string, updates: Partial<Preset>) => void;
  deletePreset: (id: string) => void;
  setReferences: (references: Reference[]) => void;
  addReference: (reference: Reference) => void;
  removeReference: (id: string) => void;
  setBookSources: (sources: BookSource[]) => void;
  addBookSource: (source: BookSource) => void;
  updateBookSource: (id: string, updates: Partial<BookSource>) => void;
  deleteBookSource: (id: string) => void;
  setLeftSidebarOpen: (open: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;
  setActiveRightTab: (tab: 'config' | 'reference') => void;
  setIsGenerating: (generating: boolean) => void;
  setAbortController: (controller: AbortController | null) => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}
