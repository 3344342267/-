<template>
  <div class="app" :class="{ 'sidebar-left-open': sidebarLeftOpen, 'sidebar-right-open': sidebarRightOpen }">
    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <button class="btn-icon" @click="toggleSidebarLeft" :title="sidebarLeftOpen ? '关闭作品栏' : '打开作品栏'">
          <svg class="icon" viewBox="0 0 24 24">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
      </div>
      <div class="header-center">
        <h1 class="app-title">墨韵</h1>
      </div>
      <div class="header-right">
        <button class="btn-icon" @click="toggleSidebarRight" :title="sidebarRightOpen ? '关闭设置' : '打开设置'">
          <svg class="icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Left Sidebar - Works -->
      <aside class="sidebar sidebar-left" :class="{ open: sidebarLeftOpen }">
        <div class="sidebar-header">
          <h2>作品</h2>
          <button class="btn btn-sm btn-primary" @click="createNewBook">
            <svg class="icon icon-sm" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            新建
          </button>
        </div>
        <div class="sidebar-content">
          <div class="works-list">
            <div v-if="books.length === 0" class="empty-state">
              <p>暂无作品</p>
              <button class="btn btn-sm btn-secondary mt-3" @click="createNewBook">创建第一本书</button>
            </div>
            <div
              v-for="book in books"
              :key="book.id"
              class="work-item"
              :class="{ active: currentBook?.id === book.id }"
              @click="selectBook(book)"
            >
              <div class="work-info">
                <div class="work-title text-ellipsis">{{ book.name || '未命名作品' }}</div>
                <div class="work-meta">{{ book.chapters?.length || 0 }} 章 · {{ formatDate(book.createdAt) }}</div>
              </div>
              <div class="work-actions">
                <button class="btn-icon btn-icon-sm" @click.stop="deleteBook(book.id)" title="删除">
                  <svg class="icon icon-sm" viewBox="0 0 24 24">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Center Content -->
      <div class="content-area">
        <!-- Writing Mode Tabs -->
        <div class="mode-tabs">
          <button 
            class="mode-tab" 
            :class="{ active: currentMode === 'outline' }"
            @click="currentMode = 'outline'"
          >
            <svg class="icon icon-sm" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
            </svg>
            大纲
          </button>
          <button 
            class="mode-tab" 
            :class="{ active: currentMode === 'writing' }"
            @click="currentMode = 'writing'"
          >
            <svg class="icon icon-sm" viewBox="0 0 24 24">
              <path d="M12 19l7-7 3 3-7 7-3-3z"/>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
              <path d="M2 2l7.586 7.586"/>
              <circle cx="11" cy="11" r="2"/>
            </svg>
            写作
          </button>
          <button 
            class="mode-tab" 
            :class="{ active: currentMode === 'reference' }"
            @click="currentMode = 'reference'"
          >
            <svg class="icon icon-sm" viewBox="0 0 24 24">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
            </svg>
            参考
          </button>
        </div>

        <!-- Content Panel -->
        <div class="content-panel">
          <!-- Outline Mode -->
          <div v-if="currentMode === 'outline'" class="outline-panel">
            <div class="outline-header">
              <h2>创作大纲</h2>
              <div class="outline-actions">
                <button class="btn btn-sm btn-secondary" @click="generateOutline" :disabled="isGenerating">
                  <svg class="icon icon-sm" viewBox="0 0 24 24">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  智能生成
                </button>
              </div>
            </div>
            <div class="outline-form">
              <div class="form-group">
                <label class="form-label">书名（可选）</label>
                <input 
                  type="text" 
                  class="input" 
                  v-model="outlineData.bookName" 
                  placeholder="输入书名"
                >
              </div>
              <div class="form-group">
                <label class="form-label">人物设定</label>
                <textarea 
                  class="textarea" 
                  v-model="outlineData.characters" 
                  placeholder="描述主角、配角的外貌、性格、背景等..."
                  rows="4"
                ></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">章节数量</label>
                <input 
                  type="number" 
                  class="input" 
                  v-model="outlineData.chapterCount" 
                  min="1"
                  max="100"
                  placeholder="输入章节数"
                >
              </div>
              <div class="form-group">
                <label class="form-label">剧情走向</label>
                <textarea 
                  class="textarea" 
                  v-model="outlineData.plotOutline" 
                  placeholder="描述每章的大概剧情走向，每章用空行分隔..."
                  rows="10"
                ></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">写作风格参考（可选）</label>
                <textarea 
                  class="textarea" 
                  v-model="outlineData.styleReference" 
                  placeholder="描述你想要的写作风格，如：古典文学、网络文学、严肃文学等..."
                  rows="3"
                ></textarea>
              </div>
              <div class="form-actions">
                <button class="btn btn-primary btn-lg" @click="startWriting" :disabled="!outlineData.plotOutline">
                  开始创作
                </button>
              </div>
            </div>
          </div>

          <!-- Writing Mode -->
          <div v-if="currentMode === 'writing'" class="writing-panel">
            <div v-if="!currentBook" class="empty-state">
              <svg class="icon icon-lg" viewBox="0 0 24 24" style="width: 64px; height: 64px; color: var(--text-muted);">
                <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
              </svg>
              <p>请先创建或选择一个作品</p>
              <button class="btn btn-primary mt-3" @click="createNewBook">创建新作品</button>
            </div>
            <div v-else class="writing-area">
              <!-- Chapter List -->
              <div class="chapters-section">
                <div class="section-header" @click="chaptersExpanded = !chaptersExpanded">
                  <h3>章节列表</h3>
                  <button class="btn btn-sm btn-primary" @click.stop="createNewChapter">
                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    新建章节
                  </button>
                  <svg class="icon collapse-icon" :class="{ expanded: chaptersExpanded }" viewBox="0 0 24 24">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
                <div class="section-content" v-show="chaptersExpanded">
                  <div class="chapters-list">
                    <div
                      v-for="chapter in currentBook.chapters"
                      :key="chapter.id"
                      class="chapter-item"
                      :class="{ active: currentChapter?.id === chapter.id }"
                      @click="selectChapter(chapter)"
                    >
                      <div class="chapter-info">
                        <div class="chapter-title">{{ chapter.title }}</div>
                        <div class="chapter-meta">{{ chapter.wordCount || 0 }} 字</div>
                      </div>
                      <div class="chapter-actions">
                        <button class="btn-icon btn-icon-sm" @click.stop="deleteChapter(chapter.id)" title="删除">
                          <svg class="icon icon-sm" viewBox="0 0 24 24">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div v-if="!currentBook.chapters || currentBook.chapters.length === 0" class="empty-chapters">
                      暂无章节，点击上方按钮创建
                    </div>
                  </div>
                </div>
              </div>

              <!-- Current Chapter Writing -->
              <div v-if="currentChapter" class="current-chapter">
                <div class="chapter-header">
                  <input 
                    type="text" 
                    class="input chapter-title-input" 
                    v-model="currentChapter.title" 
                    placeholder="章节标题"
                  >
                  <div class="chapter-stats">
                    <span>{{ currentChapter.wordCount || 0 }} 字</span>
                  </div>
                </div>
                
                <!-- Chat Messages -->
                <div class="chat-messages" ref="chatMessagesRef">
                  <div v-if="currentChapter.messages?.length === 0" class="empty-chat">
                    <p>输入剧情要求，AI将为你生成章节内容</p>
                  </div>
                  <div
                    v-for="(msg, index) in currentChapter.messages"
                    :key="index"
                    class="message"
                    :class="msg.role"
                  >
                    <div class="message-header">
                      <span class="message-role">{{ msg.role === 'user' ? '我' : 'AI' }}</span>
                      <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
                    </div>
                    <div class="message-content">
                      <div v-if="msg.role === 'user'" class="user-content">
                        {{ msg.content }}
                      </div>
                      <div v-else class="ai-content">
                        <div v-if="msg.thinking" class="thinking-section" @click="msg.thinkingExpanded = !msg.thinkingExpanded">
                          <div class="thinking-header">
                            <svg class="icon icon-sm" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"/>
                              <path d="M12 16v-4M12 8h.01"/>
                            </svg>
                            思维链
                            <svg class="icon icon-sm collapse-icon" :class="{ expanded: msg.thinkingExpanded }" viewBox="0 0 24 24">
                              <path d="m6 9 6 6 6-6"/>
                            </svg>
                          </div>
                          <div class="thinking-content" v-show="msg.thinkingExpanded">
                            {{ msg.thinking }}
                          </div>
                        </div>
                        <div class="generated-content" v-html="renderMarkdown(msg.content)"></div>
                      </div>
                    </div>
                    <div class="message-actions">
                      <button class="btn-icon btn-icon-sm" @click="editMessage(index)" title="编辑">
                        <svg class="icon icon-sm" viewBox="0 0 24 24">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button class="btn-icon btn-icon-sm" @click="deleteMessage(index)" title="删除">
                        <svg class="icon icon-sm" viewBox="0 0 24 24">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
                        </svg>
                      </button>
                      <button v-if="msg.role === 'assistant'" class="btn-icon btn-icon-sm" @click="adoptContent(msg.content)" title="采纳">
                        <svg class="icon icon-sm" viewBox="0 0 24 24">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div v-if="isGenerating" class="message assistant generating">
                    <div class="message-header">
                      <span class="message-role">AI</span>
                      <span class="message-time">生成中...</span>
                    </div>
                    <div class="message-content">
                      <div class="ai-content">
                        <div class="generating-indicator">
                          <span class="dot"></span>
                          <span class="dot"></span>
                          <span class="dot"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Input Area -->
                <div class="input-area">
                  <div class="input-wrapper">
                    <textarea
                      class="textarea"
                      v-model="userInput"
                      placeholder="输入你想要的剧情..."
                      rows="3"
                      @keydown.enter.exact.prevent="sendMessage"
                    ></textarea>
                    <div class="input-actions">
                      <button class="btn btn-primary" @click="sendMessage" :disabled="!userInput.trim() || isGenerating">
                        <svg class="icon icon-sm" viewBox="0 0 24 24">
                          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                        </svg>
                        发送
                      </button>
                    </div>
                  </div>
                  <div class="generation-controls">
                    <button class="btn btn-accent" @click="regenerate" :disabled="!canRegenerate || isGenerating">
                      <svg class="icon icon-sm" viewBox="0 0 24 24">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/>
                      </svg>
                      重新生成
                    </button>
                    <button class="btn btn-secondary" @click="stopGeneration" :disabled="!isGenerating">
                      <svg class="icon icon-sm" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12"/>
                      </svg>
                      停止
                    </button>
                    <button class="btn btn-primary" @click="continueGeneration" :disabled="isGenerating">
                      <svg class="icon icon-sm" viewBox="0 0 24 24">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      继续生成
                    </button>
                  </div>
                  <div class="generation-options">
                    <div class="option-item">
                      <label class="form-label">字数约束</label>
                      <input type="number" class="input" v-model="wordLimit" min="100" max="10000" step="100">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Reference Mode -->
          <div v-if="currentMode === 'reference'" class="reference-panel">
            <div class="reference-header">
              <h2>参考资料</h2>
            </div>
            
            <!-- Book Source -->
            <div class="reference-section">
              <h3>书院书源</h3>
              <div class="book-search">
                <input 
                  type="text" 
                  class="input" 
                  v-model="bookSearchQuery" 
                  placeholder="搜索书籍..."
                  @keydown.enter="searchBooks"
                >
                <button class="btn btn-primary" @click="searchBooks">
                  <svg class="icon icon-sm" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  搜索
                </button>
              </div>
              <div class="book-results">
                <div v-if="isSearchingBooks" class="loading-state">
                  <div class="spinner"></div>
                  <p>搜索中...</p>
                </div>
                <div v-else-if="searchResults.length > 0" class="books-grid">
                  <div
                    v-for="book in searchResults"
                    :key="book.id"
                    class="book-card"
                    @click="viewBook(book)"
                  >
                    <div class="book-cover">
                      <svg class="icon icon-lg" viewBox="0 0 24 24" style="width: 48px; height: 48px; color: var(--text-muted);">
                        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                      </svg>
                    </div>
                    <div class="book-info">
                      <div class="book-title text-ellipsis">{{ book.title }}</div>
                      <div class="book-author text-ellipsis">{{ book.author }}</div>
                    </div>
                  </div>
                </div>
                <div v-else class="empty-state">
                  <p>搜索书院中的书籍作为参考</p>
                </div>
              </div>
            </div>

            <!-- Reference Management -->
            <div class="reference-section">
              <h3>我的参考资料</h3>
              <div class="reference-list">
                <div
                  v-for="(ref, index) in references"
                  :key="index"
                  class="reference-item"
                >
                  <div class="ref-info">
                    <div class="ref-title text-ellipsis">{{ ref.title }}</div>
                    <div class="ref-type">{{ ref.type }}</div>
                  </div>
                  <button class="btn-icon btn-icon-sm" @click="removeReference(index)">
                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
                <div v-if="references.length === 0" class="empty-state">
                  <p>暂无参考资料</p>
                </div>
              </div>
              <div class="upload-area">
                <input type="file" ref="fileInputRef" @change="handleFileUpload" accept=".txt,.md,.pdf" style="display: none;">
                <button class="btn btn-secondary" @click="$refs.fileInputRef.click()">
                  <svg class="icon icon-sm" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  上传文件
                </button>
                <input 
                  type="url" 
                  class="input" 
                  v-model="referenceUrl" 
                  placeholder="输入URL获取参考"
                  style="flex: 1;"
                >
                <button class="btn btn-primary" @click="fetchReferenceUrl" :disabled="!referenceUrl">
                  获取
                </button>
              </div>
            </div>

            <!-- Presets -->
            <div class="reference-section">
              <h3>预设管理</h3>
              <div class="preset-list">
                <div
                  v-for="preset in presets"
                  :key="preset.id"
                  class="preset-item"
                  :class="{ active: activePreset?.id === preset.id }"
                  @click="activatePreset(preset)"
                >
                  <div class="preset-info">
                    <div class="preset-title text-ellipsis">{{ preset.title }}</div>
                    <div class="preset-description text-ellipsis">{{ preset.description }}</div>
                  </div>
                  <button class="btn-icon btn-icon-sm" @click.stop="deletePreset(preset.id)">
                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="upload-area">
                <input type="file" ref="presetInputRef" @change="handlePresetUpload" accept=".json" style="display: none;">
                <button class="btn btn-secondary" @click="$refs.presetInputRef.click()">
                  <svg class="icon icon-sm" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  上传预设
                </button>
                <button class="btn btn-primary" @click="saveCurrentAsPreset">
                  保存当前为预设
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Sidebar - Settings -->
      <aside class="sidebar sidebar-right" :class="{ open: sidebarRightOpen }">
        <div class="sidebar-header">
          <h2>设置</h2>
          <button class="btn-icon" @click="toggleSidebarRight">
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="sidebar-content">
          <!-- API Settings -->
          <div class="settings-section">
            <h3>API 设置</h3>
            <div class="form-group">
              <label class="form-label">模型供应商</label>
              <select class="select" v-model="settings.apiProvider" @change="onProviderChange">
                <option value="openai">OpenAI API 兼容</option>
                <option value="claude">Claude API 兼容</option>
                <option value="gemini">Google Gemini API 兼容</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">API 地址</label>
              <input 
                type="url" 
                class="input" 
                v-model="settings.apiUrl" 
                placeholder="https://api.openai.com/v1"
              >
            </div>
            <div class="form-group">
              <label class="form-label">API 密钥</label>
              <div class="password-input">
                <input 
                  :type="showApiKey ? 'text' : 'password'" 
                  class="input" 
                  v-model="settings.apiKey" 
                  placeholder="输入你的API密钥"
                >
                <button class="btn-icon btn-icon-sm" @click="showApiKey = !showApiKey">
                  <svg v-if="showApiKey" class="icon icon-sm" viewBox="0 0 24 24">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                  <svg v-else class="icon icon-sm" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">
                模型名称
                <button class="btn btn-sm btn-secondary" @click="fetchModels" :disabled="!settings.apiKey || isFetchingModels">
                  <svg class="icon icon-sm" viewBox="0 0 24 24">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                  </svg>
                  获取模型
                </button>
              </label>
              <div class="model-input-wrapper">
                <input 
                  type="text" 
                  class="input" 
                  v-model="settings.modelName" 
                  placeholder="输入模型名称，如 gpt-4"
                >
                <button 
                  v-if="availableModels.length > 0" 
                  class="btn-icon model-dropdown-btn"
                  @click="showModelList = !showModelList"
                >
                  <svg class="icon icon-sm" :class="{ rotated: showModelList }" viewBox="0 0 24 24">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </button>
                <div v-if="showModelList" class="model-dropdown">
                  <div
                    v-for="model in availableModels"
                    :key="model"
                    class="model-option"
                    @click="selectModel(model)"
                  >
                    {{ model }}
                  </div>
                </div>
              </div>
              <div v-if="isFetchingModels" class="fetching-indicator">
                <div class="spinner-small"></div>
                <span>获取中...</span>
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" @click="testConnection" :disabled="!canTestConnection || isTesting">
                <svg class="icon icon-sm" viewBox="0 0 24 24">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                测试连接
              </button>
            </div>
          </div>

          <!-- Generation Settings -->
          <div class="settings-section">
            <h3>生成设置</h3>
            <div class="form-group">
              <label class="form-label">Temperature</label>
              <input 
                type="range" 
                class="range-input" 
                v-model="settings.temperature" 
                min="0" 
                max="2" 
                step="0.1"
              >
              <span class="range-value">{{ settings.temperature }}</span>
            </div>
            <div class="form-group">
              <label class="form-label">Max Tokens</label>
              <input 
                type="number" 
                class="input" 
                v-model="settings.maxTokens" 
                min="100" 
                max="8000" 
                step="100"
              >
            </div>
          </div>

          <!-- Current Book Info -->
          <div v-if="currentBook" class="settings-section">
            <h3>当前作品</h3>
            <div class="book-summary">
              <div class="summary-item">
                <span class="summary-label">书名</span>
                <span class="summary-value">{{ currentBook.name || '未命名' }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">章节数</span>
                <span class="summary-value">{{ currentBook.chapters?.length || 0 }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">总字数</span>
                <span class="summary-value">{{ calculateTotalWords() }}</span>
              </div>
            </div>
            <div class="book-operations">
              <button class="btn btn-secondary btn-sm" @click="exportBook('txt')">
                <svg class="icon icon-sm" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                导出TXT
              </button>
              <button class="btn btn-secondary btn-sm" @click="copyBookContent">
                <svg class="icon icon-sm" viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
                复制内容
              </button>
            </div>
          </div>
        </div>
      </aside>
    </main>

    <!-- Overlay for mobile -->
    <div 
      v-if="sidebarLeftOpen || sidebarRightOpen" 
      class="overlay" 
      @click="closeAllSidebars"
    ></div>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.type">
        <svg v-if="toast.type === 'success'" class="icon icon-sm" viewBox="0 0 24 24">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        <svg v-else-if="toast.type === 'error'" class="icon icon-sm" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <svg v-else class="icon icon-sm" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {{ toast.message }}
      </div>
    </Transition>

    <!-- Modal -->
    <div v-if="modal.show" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ modal.title }}</h3>
          <button class="btn-icon" @click="closeModal">
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="modal.type === 'input'">
            <input 
              type="text" 
              class="input" 
              v-model="modal.inputValue" 
              :placeholder="modal.placeholder"
              @keydown.enter="modal.onConfirm()"
            >
          </div>
          <div v-else>
            {{ modal.message }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="modal.onConfirm">确定</button>
        </div>
      </div>
    </div>

    <!-- Book Detail Modal -->
    <div v-if="bookDetailModal.show" class="modal-overlay" @click.self="closeBookDetail">
      <div class="modal" style="max-width: 600px;">
        <div class="modal-header">
          <h3 class="modal-title">{{ bookDetailModal.book?.title }}</h3>
          <button class="btn-icon" @click="closeBookDetail">
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="book-detail-content" v-html="renderMarkdown(bookDetailModal.content || '')"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeBookDetail">关闭</button>
          <button class="btn btn-primary" @click="useAsReference(bookDetailModal.book)">
            <svg class="icon icon-sm" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            学习风格
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { marked } from 'marked'

// State
const sidebarLeftOpen = ref(false)
const sidebarRightOpen = ref(false)
const currentMode = ref('outline')
const chaptersExpanded = ref(true)

// Data
const books = ref([])
const currentBook = ref(null)
const currentChapter = ref(null)

// Settings
const settings = reactive({
  apiProvider: 'openai',
  apiUrl: 'https://api.openai.com/v1',
  apiKey: '',
  modelName: '',
  temperature: 0.8,
  maxTokens: 2000
})

const showApiKey = ref(false)
const availableModels = ref([])
const showModelList = ref(false)
const isFetchingModels = ref(false)
const isTesting = ref(false)

// Writing
const userInput = ref('')
const isGenerating = ref(false)
const wordLimit = ref(2000)
const chatMessagesRef = ref(null)

// Outline
const outlineData = reactive({
  bookName: '',
  characters: '',
  chapterCount: 3,
  plotOutline: '',
  styleReference: ''
})

// Reference
const bookSearchQuery = ref('')
const searchResults = ref([])
const isSearchingBooks = ref(false)
const references = ref([])
const referenceUrl = ref('')
const fileInputRef = ref(null)
const presetInputRef = ref(null)
const presets = ref([])
const activePreset = ref(null)
const bookDetailModal = reactive({
  show: false,
  book: null,
  content: ''
})

// Toast & Modal
const toast = reactive({
  show: false,
  message: '',
  type: 'info'
})

const modal = reactive({
  show: false,
  title: '',
  type: 'info',
  message: '',
  inputValue: '',
  placeholder: '',
  onConfirm: () => {}
})

// Computed
const canTestConnection = computed(() => {
  return settings.apiKey && settings.apiUrl && settings.modelName
})

const canRegenerate = computed(() => {
  return currentChapter.value?.messages?.length > 0
})

// Methods
function toggleSidebarLeft() {
  sidebarLeftOpen.value = !sidebarLeftOpen.value
  if (sidebarLeftOpen.value) {
    sidebarRightOpen.value = false
  }
}

function toggleSidebarRight() {
  sidebarRightOpen.value = !sidebarRightOpen.value
  if (sidebarRightOpen.value) {
    sidebarLeftOpen.value = false
  }
}

function closeAllSidebars() {
  sidebarLeftOpen.value = false
  sidebarRightOpen.value = false
}

function showToast(message, type = 'info') {
  toast.message = message
  toast.type = type
  toast.show = true
  setTimeout(() => {
    toast.show = false
  }, 3000)
}

function showModal(options) {
  modal.title = options.title || ''
  modal.type = options.type || 'info'
  modal.message = options.message || ''
  modal.inputValue = options.inputValue || ''
  modal.placeholder = options.placeholder || ''
  modal.onConfirm = options.onConfirm || (() => {})
  modal.show = true
}

function closeModal() {
  modal.show = false
}

// Book Management
function createNewBook() {
  const newBook = {
    id: crypto.randomUUID(),
    name: '',
    outline: '',
    characterSetting: '',
    createdAt: new Date().toISOString(),
    chapters: []
  }
  books.value.push(newBook)
  currentBook.value = newBook
  sidebarLeftOpen.value = false
  saveData()
  showModal({
    title: '创建新作品',
    type: 'input',
    placeholder: '输入书名',
    inputValue: '',
    onConfirm: () => {
      if (modal.inputValue.trim()) {
        currentBook.value.name = modal.inputValue.trim()
        saveData()
      }
      closeModal()
    }
  })
}

function selectBook(book) {
  currentBook.value = book
  currentChapter.value = null
  sidebarLeftOpen.value = false
}

function deleteBook(bookId) {
  books.value = books.value.filter(b => b.id !== bookId)
  if (currentBook.value?.id === bookId) {
    currentBook.value = null
    currentChapter.value = null
  }
  saveData()
  showToast('作品已删除')
}

// Chapter Management
function createNewChapter() {
  if (!currentBook.value) return
  
  const chapterNum = (currentBook.value.chapters?.length || 0) + 1
  const newChapter = {
    id: crypto.randomUUID(),
    title: `第${chapterNum}章`,
    summary: '',
    content: '',
    wordCount: 0,
    status: 'draft',
    messages: [],
    createdAt: new Date().toISOString()
  }
  
  if (!currentBook.value.chapters) {
    currentBook.value.chapters = []
  }
  currentBook.value.chapters.push(newChapter)
  currentChapter.value = newChapter
  saveData()
}

function selectChapter(chapter) {
  currentChapter.value = chapter
}

function deleteChapter(chapterId) {
  if (!currentBook.value) return
  currentBook.value.chapters = currentBook.value.chapters.filter(c => c.id !== chapterId)
  if (currentChapter.value?.id === chapterId) {
    currentChapter.value = null
  }
  saveData()
  showToast('章节已删除')
}

// Outline
async function generateOutline() {
  if (!settings.apiKey || !settings.modelName) {
    showToast('请先配置API设置', 'error')
    sidebarRightOpen.value = true
    return
  }
  
  isGenerating.value = true
  
  const prompt = `作为一个专业的小说大纲生成器，请根据以下信息生成一个详细的创作大纲：

人物设定：${outlineData.characters || '未指定'}
章节数量：${outlineData.chapterCount || 3}
想要的剧情走向：${outlineData.plotOutline || '未指定'}
写作风格：${outlineData.styleReference || '网络小说风格'}

请生成一个包含以下内容的完整大纲：
1. 故事背景设定
2. 主要人物介绍（姓名、性格、外貌特点、背景）
3. 每章的详细剧情走向
4. 故事主线和支线

请用中文回答，格式清晰。`
  
  try {
    const response = await callAI([
      { role: 'user', content: prompt }
    ])
    
    outlineData.plotOutline = response
    showToast('大纲生成成功')
  } catch (error) {
    showToast('生成失败: ' + error.message, 'error')
  } finally {
    isGenerating.value = false
  }
}

function startWriting() {
  if (!outlineData.plotOutline) {
    showToast('请先输入剧情走向', 'error')
    return
  }
  
  if (!currentBook.value) {
    createNewBook()
  }
  
  if (currentBook.value) {
    currentBook.value.outline = outlineData.plotOutline
    currentBook.value.characterSetting = outlineData.characters
    if (outlineData.bookName) {
      currentBook.value.name = outlineData.bookName
    }
  }
  
  currentMode.value = 'writing'
  createNewChapter()
  saveData()
}

// Chat & Generation
async function sendMessage() {
  if (!userInput.value.trim() || !currentChapter.value || isGenerating.value) return
  
  if (!settings.apiKey || !settings.modelName) {
    showToast('请先配置API设置', 'error')
    sidebarRightOpen.value = true
    return
  }
  
  const userMessage = {
    role: 'user',
    content: userInput.value.trim(),
    timestamp: Date.now()
  }
  
  if (!currentChapter.value.messages) {
    currentChapter.value.messages = []
  }
  currentChapter.value.messages.push(userMessage)
  
  const inputText = userInput.value
  userInput.value = ''
  
  await generateAIResponse(inputText)
  scrollToBottom()
}

async function generateAIResponse(context) {
  isGenerating.value = true
  
  const messages = buildMessages(context)
  
  try {
    const response = await callAI(messages)
    
    const aiMessage = {
      role: 'assistant',
      content: response,
      thinking: null,
      thinkingExpanded: false,
      timestamp: Date.now()
    }
    
    currentChapter.value.messages.push(aiMessage)
    saveData()
  } catch (error) {
    showToast('生成失败: ' + error.message, 'error')
    currentChapter.value.messages.pop()
  } finally {
    isGenerating.value = false
  }
}

function buildMessages(context) {
  const messages = []
  
  if (activePreset.value) {
    let systemPrompt = activePreset.value.content
    
    if (currentBook.value?.characterSetting) {
      systemPrompt = systemPrompt.replace(/\{角色设定\}/g, currentBook.value.characterSetting)
    }
    if (currentBook.value?.outline) {
      systemPrompt = systemPrompt.replace(/\{大纲\}/g, currentBook.value.outline)
    }
    if (context) {
      systemPrompt = systemPrompt.replace(/\{剧情要求\}/g, context)
    }
    if (wordLimit.value) {
      systemPrompt = systemPrompt.replace(/\{字数要求\}/g, `约${wordLimit.value}字`)
    }
    
    messages.push({ role: 'system', content: systemPrompt })
  } else {
    const systemPrompt = `你是一位专业的小说作者，擅长创作中文网络小说。请根据用户的要求生成高质量的小说章节内容。

${currentBook.value?.characterSetting ? `人物设定：\n${currentBook.value.characterSetting}\n` : ''}
${currentBook.value?.outline ? `故事大纲：\n${currentBook.value.outline}\n` : ''}
${references.value.length > 0 ? `参考资料：\n${references.value.map(r => r.content).join('\n\n')}\n` : ''}

写作要求：
- 只输出小说正文，不要输出其他内容
- 字数约 ${wordLimit.value} 字
- 注重描写，不要概括剧情
- 保持文风连贯一致`
    
    messages.push({ role: 'system', content: systemPrompt })
  }
  
  if (currentChapter.value?.messages) {
    currentChapter.value.messages.forEach(msg => {
      if (msg.role === 'user') {
        messages.push({ role: 'user', content: `用户要求：${msg.content}` })
      } else if (msg.role === 'assistant') {
        messages.push({ role: 'assistant', content: msg.content })
      }
    })
  }
  
  if (context) {
    messages.push({ role: 'user', content: `请根据以下要求继续创作：\n${context}\n\n要求：约${wordLimit.value}字` })
  }
  
  return messages
}

async function callAI(messages) {
  const baseUrl = settings.apiUrl.replace(/\/$/, '')
  let endpoint = ''
  let body = {}
  
  switch (settings.apiProvider) {
    case 'openai':
      endpoint = `${baseUrl}/chat/completions`
      body = {
        model: settings.modelName,
        messages,
        temperature: parseFloat(settings.temperature),
        max_tokens: parseInt(settings.maxTokens)
      }
      break
    case 'claude':
      endpoint = `${baseUrl}/v1/messages`
      body = {
        model: settings.modelName,
        messages: messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        })),
        system: messages.find(m => m.role === 'system')?.content || '',
        max_tokens: parseInt(settings.maxTokens)
      }
      break
    case 'gemini':
      endpoint = `${baseUrl}/models/${settings.modelName}:generateContent?key=${settings.apiKey}`
      body = {
        contents: messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        systemInstruction: messages.find(m => m.role === 'system') ? {
          parts: [{ text: messages.find(m => m.role === 'system').content }]
        } : undefined,
        generationConfig: {
          temperature: parseFloat(settings.temperature),
          maxOutputTokens: parseInt(settings.maxTokens)
        }
      }
      break
    default:
      endpoint = `${baseUrl}/chat/completions`
      body = {
        model: settings.modelName,
        messages,
        temperature: parseFloat(settings.temperature),
        max_tokens: parseInt(settings.maxTokens)
      }
  }
  
  const headers = {
    'Content-Type': 'application/json'
  }
  
  if (settings.apiProvider !== 'gemini') {
    headers['Authorization'] = `Bearer ${settings.apiKey}`
  }
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
    throw new Error(error.error?.message || `API请求失败: ${response.status}`)
  }
  
  const data = await response.json()
  
  switch (settings.apiProvider) {
    case 'openai':
    case 'custom':
      return data.choices[0].message.content
    case 'claude':
      return data.content[0].text
    case 'gemini':
      return data.candidates[0].content.parts[0].text
    default:
      return data.choices[0].message.content
  }
}

async function regenerate() {
  if (!canRegenerate.value || isGenerating.value) return
  
  currentChapter.value.messages.pop()
  const lastUserMessage = [...currentChapter.value.messages].reverse().find(m => m.role === 'user')
  
  if (lastUserMessage) {
    await generateAIResponse(lastUserMessage.content)
  }
}

function stopGeneration() {
  isGenerating.value = false
}

async function continueGeneration() {
  if (isGenerating.value || !currentChapter.value) return
  
  const lastMessage = [...currentChapter.value.messages].reverse().find(m => m.role === 'assistant')
  if (lastMessage) {
    await generateAIResponse('请继续之前的剧情，补充更多细节和内容')
  }
}

function editMessage(index) {
  const msg = currentChapter.value.messages[index]
  showModal({
    title: '编辑消息',
    type: 'input',
    inputValue: msg.content,
    placeholder: '输入内容',
    onConfirm: () => {
      msg.content = modal.inputValue
      saveData()
      closeModal()
    }
  })
}

function deleteMessage(index) {
  currentChapter.value.messages.splice(index, 1)
  saveData()
}

function adoptContent(content) {
  if (!currentChapter.value) return
  
  if (currentChapter.value.content) {
    currentChapter.value.content += '\n\n' + content
  } else {
    currentChapter.value.content = content
  }
  
  currentChapter.value.wordCount = currentChapter.value.content.replace(/\s/g, '').length
  currentChapter.value.status = 'completed'
  
  if (!currentBook.value.summary) {
    currentBook.value.summary = ''
  }
  currentBook.value.summary += `\n\n【${currentChapter.value.title}】\n${content.substring(0, 200)}...`
  
  saveData()
  showToast('内容已采纳到章节')
}

function scrollToBottom() {
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
}

// API Settings
function onProviderChange() {
  switch (settings.apiProvider) {
    case 'openai':
      settings.apiUrl = 'https://api.openai.com/v1'
      break
    case 'claude':
      settings.apiUrl = 'https://api.anthropic.com'
      break
    case 'gemini':
      settings.apiUrl = 'https://generativelanguage.googleapis.com'
      break
  }
}

async function fetchModels() {
  if (!settings.apiKey) return
  
  isFetchingModels.value = true
  showModelList.value = false
  
  try {
    const baseUrl = settings.apiUrl.replace(/\/$/, '')
    let endpoint = ''
    let headers = {
      'Authorization': `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json'
    }
    
    switch (settings.apiProvider) {
      case 'openai':
        endpoint = `${baseUrl}/models`
        break
      case 'claude':
        endpoint = `${baseUrl}/v1/models`
        break
      case 'gemini':
        endpoint = `${baseUrl}/v1beta/models?key=${settings.apiKey}`
        break
      default:
        endpoint = `${baseUrl}/models`
    }
    
    const response = await fetch(endpoint, { headers })
    
    if (!response.ok) {
      throw new Error('获取模型列表失败')
    }
    
    const data = await response.json()
    
    switch (settings.apiProvider) {
      case 'openai':
        availableModels.value = data.data
          .filter(m => m.id.includes('gpt') || m.id.includes('4') || m.id.includes('3.5'))
          .map(m => m.id)
          .slice(0, 20)
        break
      case 'claude':
        availableModels.value = data.data
          .map(m => m.id)
          .filter(id => !id.includes('claude-code'))
          .slice(0, 20)
        break
      case 'gemini':
        availableModels.value = data.models
          .map(m => m.name.replace('models/', ''))
          .slice(0, 20)
        break
      default:
        availableModels.value = data.data?.map(m => m.id) || []
    }
    
    if (availableModels.value.length > 0) {
      showModelList.value = true
    } else {
      showToast('未找到可用模型', 'warning')
    }
  } catch (error) {
    showToast('获取模型失败: ' + error.message, 'error')
  } finally {
    isFetchingModels.value = false
  }
}

function selectModel(model) {
  settings.modelName = model
  showModelList.value = false
}

async function testConnection() {
  if (!canTestConnection.value) return
  
  isTesting.value = true
  
  try {
    const testMessages = [
      { role: 'user', content: '你好，请回复"连接成功"' }
    ]
    
    await callAI(testMessages)
    showToast('连接成功！', 'success')
  } catch (error) {
    showToast('连接失败: ' + error.message, 'error')
  } finally {
    isTesting.value = false
  }
}

// Reference
async function searchBooks() {
  if (!bookSearchQuery.value.trim()) return
  
  isSearchingBooks.value = true
  
  try {
    const response = await fetch(
      `https://shuyuan.nyasama.cc/shuyuan/f5b15e9641d164937061974cfefb675c.json`
    )
    
    if (!response.ok) throw new Error('获取书源失败')
    
    const data = await response.json()
    
    const query = bookSearchQuery.value.toLowerCase()
    searchResults.value = data.books
      ? data.books.filter(book => 
          book.title?.toLowerCase().includes(query) ||
          book.author?.toLowerCase().includes(query)
        ).slice(0, 20)
      : []
    
    if (searchResults.value.length === 0) {
      showToast('未找到相关书籍', 'warning')
    }
  } catch (error) {
    showToast('搜索失败: ' + error.message, 'error')
  } finally {
    isSearchingBooks.value = false
  }
}

async function viewBook(book) {
  bookDetailModal.book = book
  bookDetailModal.content = ''
  bookDetailModal.show = true
  
  try {
    if (book.url) {
      const response = await fetch(book.url)
      const text = await response.text()
      bookDetailModal.content = text
    } else if (book.content) {
      bookDetailModal.content = book.content
    }
  } catch (error) {
    bookDetailModal.content = '无法加载内容'
  }
}

function closeBookDetail() {
  bookDetailModal.show = false
}

function useAsReference(book) {
  references.value.push({
    title: book.title,
    type: '书院',
    content: bookDetailModal.content || book.content || ''
  })
  closeBookDetail()
  showToast('已添加到参考资料')
}

async function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    const text = await file.text()
    references.value.push({
      title: file.name,
      type: file.type.includes('pdf') ? 'PDF' : '文件',
      content: text
    })
    showToast('文件已添加')
  } catch (error) {
    showToast('读取文件失败', 'error')
  }
  
  event.target.value = ''
}

async function fetchReferenceUrl() {
  if (!referenceUrl.value) return
  
  try {
    const response = await fetch(referenceUrl.value)
    const text = await response.text()
    
    references.value.push({
      title: new URL(referenceUrl.value).hostname,
      type: 'URL',
      content: text.substring(0, 5000)
    })
    
    showToast('URL内容已添加')
    referenceUrl.value = ''
  } catch (error) {
    showToast('获取URL失败', 'error')
  }
}

function removeReference(index) {
  references.value.splice(index, 1)
}

// Presets
function handlePresetUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const preset = JSON.parse(e.target.result)
      presets.value.push({
        id: crypto.randomUUID(),
        title: preset.title || preset.name || '未命名预设',
        description: preset.description || '',
        content: preset.content || preset.system_prompt || '',
        createdAt: new Date().toISOString()
      })
      saveData()
      showToast('预设已添加')
    } catch (error) {
      showToast('解析预设失败', 'error')
    }
  }
  reader.readAsText(file)
  
  event.target.value = ''
}

function activatePreset(preset) {
  activePreset.value = activePreset.value?.id === preset.id ? null : preset
}

function deletePreset(presetId) {
  presets.value = presets.value.filter(p => p.id !== presetId)
  if (activePreset.value?.id === presetId) {
    activePreset.value = null
  }
  saveData()
}

function saveCurrentAsPreset() {
  showModal({
    title: '保存预设',
    type: 'input',
    placeholder: '输入预设名称',
    inputValue: '',
    onConfirm: () => {
      if (!modal.inputValue.trim()) return
      
      const preset = {
        id: crypto.randomUUID(),
        title: modal.inputValue.trim(),
        description: '用户创建的预设',
        content: activePreset.value?.content || '',
        createdAt: new Date().toISOString()
      }
      
      presets.value.push(preset)
      saveData()
      closeModal()
      showToast('预设已保存')
    }
  })
}

// Export
function exportBook(format) {
  if (!currentBook.value) return
  
  let content = `# ${currentBook.value.name || '未命名作品'}\n\n`
  
  if (currentBook.value.outline) {
    content += `## 大纲\n${currentBook.value.outline}\n\n`
  }
  
  currentBook.value.chapters?.forEach(chapter => {
    content += `## ${chapter.title}\n\n`
    content += chapter.content || ''
    content += '\n\n---\n\n'
  })
  
  if (format === 'txt') {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentBook.value.name || '作品'}.txt`
    a.click()
    URL.revokeObjectURL(url)
    showToast('导出成功')
  }
}

function copyBookContent() {
  if (!currentBook.value) return
  
  let content = `# ${currentBook.value.name || '未命名作品'}\n\n`
  
  currentBook.value.chapters?.forEach(chapter => {
    content += `## ${chapter.title}\n\n`
    content += chapter.content || ''
    content += '\n\n'
  })
  
  navigator.clipboard.writeText(content).then(() => {
    showToast('内容已复制')
  }).catch(() => {
    showToast('复制失败', 'error')
  })
}

// Utilities
function renderMarkdown(text) {
  if (!text) return ''
  return marked.parse(text)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

function calculateTotalWords() {
  if (!currentBook.value?.chapters) return 0
  return currentBook.value.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0)
}

// Storage
function saveData() {
  const data = {
    books: books.value,
    settings: settings,
    references: references.value,
    presets: presets.value
  }
  localStorage.setItem('moyun-data', JSON.stringify(data))
}

function loadData() {
  const saved = localStorage.getItem('moyun-data')
  if (saved) {
    try {
      const data = JSON.parse(saved)
      books.value = data.books || []
      if (data.settings) {
        Object.assign(settings, data.settings)
      }
      references.value = data.references || []
      presets.value = data.presets || []
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }
}

// Lifecycle
onMounted(() => {
  loadData()
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.model-input-wrapper')) {
      showModelList.value = false
    }
  })
})

watch(books, saveData, { deep: true })
</script>

<style scoped>
.app {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow: hidden;
}

/* Header */
.header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: white;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  z-index: 100;
}

.header-left, .header-right {
  width: 60px;
}

.header-center {
  flex: 1;
  text-align: center;
}

.app-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: 2px;
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  position: fixed;
  top: var(--header-height);
  height: calc(100% - var(--header-height));
  background: white;
  transition: transform var(--transition-slow);
  z-index: 200;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

.sidebar-left {
  left: 0;
  width: var(--sidebar-width-left);
  transform: translateX(-100%);
}

.sidebar-right {
  right: 0;
  width: var(--sidebar-width-right);
  transform: translateX(100%);
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.sidebar-header h2 {
  font-size: 18px;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* Works List */
.works-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.work-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.work-item:hover {
  background: var(--bg-tertiary);
}

.work-item.active {
  background: var(--primary);
  color: white;
}

.work-title {
  font-weight: 500;
  max-width: 160px;
}

.work-meta {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.work-item.active .work-meta {
  color: rgba(255, 255, 255, 0.8);
}

/* Settings Section */
.settings-section {
  margin-bottom: 24px;
}

.settings-section h3 {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.password-input {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input .input {
  padding-right: 48px;
}

.password-input .btn-icon {
  position: absolute;
  right: 8px;
}

.model-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.model-input-wrapper .input {
  padding-right: 48px;
}

.model-dropdown-btn {
  position: absolute;
  right: 8px;
}

.model-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
  margin-top: 4px;
}

.model-option {
  padding: 10px 16px;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.model-option:hover {
  background: var(--bg-secondary);
}

.fetching-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 13px;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.range-input {
  width: 100%;
  height: 4px;
  appearance: none;
  background: var(--bg-tertiary);
  border-radius: 2px;
  margin: 8px 0;
}

.range-input::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--primary);
  border-radius: 50%;
  cursor: pointer;
}

.range-value {
  font-size: 13px;
  color: var(--text-muted);
}

.book-summary {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: 12px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
}

.summary-label {
  color: var(--text-muted);
}

.book-operations {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

/* Content Area */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: margin var(--transition-slow);
}

/* Mode Tabs */
.mode-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid var(--border);
}

.mode-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.mode-tab:hover {
  background: var(--bg-secondary);
}

.mode-tab.active {
  background: var(--primary);
  color: white;
}

/* Content Panel */
.content-panel {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* Outline Panel */
.outline-panel {
  max-width: 800px;
  margin: 0 auto;
}

.outline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.outline-header h2 {
  font-size: 24px;
}

.outline-form {
  background: white;
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow);
}

.form-actions {
  margin-top: 24px;
  text-align: center;
}

/* Writing Panel */
.writing-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.writing-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chapters-section {
  background: white;
  border-radius: var(--radius-lg);
  margin-bottom: 16px;
  box-shadow: var(--shadow);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
}

.section-header h3 {
  font-size: 16px;
}

.collapse-icon {
  transition: transform var(--transition-normal);
}

.collapse-icon.expanded {
  transform: rotate(180deg);
}

.section-content {
  border-top: 1px solid var(--border);
  padding: 12px 20px 20px;
}

.chapters-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chapter-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.chapter-item:hover {
  background: var(--bg-tertiary);
}

.chapter-item.active {
  background: var(--primary);
  color: white;
}

.chapter-title {
  font-weight: 500;
}

.chapter-meta {
  font-size: 12px;
  color: var(--text-muted);
}

.chapter-item.active .chapter-meta {
  color: rgba(255, 255, 255, 0.8);
}

.empty-chapters {
  color: var(--text-muted);
  font-size: 14px;
  padding: 12px 0;
}

/* Current Chapter */
.current-chapter {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.chapter-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.chapter-title-input {
  flex: 1;
  font-size: 18px;
  font-family: 'Noto Serif SC', serif;
  font-weight: 600;
  border: none;
  background: transparent;
}

.chapter-title-input:focus {
  outline: none;
  box-shadow: none;
}

.chapter-stats {
  font-size: 13px;
  color: var(--text-muted);
}

/* Chat Messages */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.empty-chat {
  text-align: center;
  color: var(--text-muted);
  padding: 40px 20px;
}

.message {
  margin-bottom: 20px;
  animation: fadeIn var(--transition-normal);
}

.message.user {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message.assistant {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
}

.message-role {
  font-weight: 500;
  color: var(--text-secondary);
}

.message-time {
  color: var(--text-muted);
}

.message-content {
  max-width: 85%;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  line-height: 1.8;
}

.user .message-content {
  background: #E8F5E9;
  color: var(--text-primary);
}

.ai .message-content {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.generating-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.generating-indicator .dot {
  width: 8px;
  height: 8px;
  background: var(--primary);
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite;
}

.generating-indicator .dot:nth-child(1) { animation-delay: 0s; }
.generating-indicator .dot:nth-child(2) { animation-delay: 0.2s; }
.generating-indicator .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.message-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.message:hover .message-actions {
  opacity: 1;
}

.thinking-section {
  background: rgba(74, 139, 110, 0.1);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  margin-bottom: 12px;
  cursor: pointer;
}

.thinking-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--success);
  font-weight: 500;
}

.thinking-header .collapse-icon {
  margin-left: auto;
}

.thinking-content {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--border);
}

.generated-content {
  white-space: pre-wrap;
}

/* Input Area */
.input-area {
  padding: 16px 20px;
  border-top: 1px solid var(--border);
  background: var(--bg-secondary);
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-wrapper .textarea {
  flex: 1;
  min-height: 60px;
  max-height: 150px;
}

.input-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.generation-controls {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.generation-options {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-item .form-label {
  margin: 0;
  white-space: nowrap;
}

.option-item .input {
  width: 100px;
}

/* Reference Panel */
.reference-panel {
  max-width: 1000px;
  margin: 0 auto;
}

.reference-header {
  margin-bottom: 24px;
}

.reference-header h2 {
  font-size: 24px;
}

.reference-section {
  background: white;
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: var(--shadow);
}

.reference-section h3 {
  font-size: 16px;
  margin-bottom: 16px;
}

.book-search {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.book-search .input {
  flex: 1;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.book-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: 16px;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.book-card:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
}

.book-cover {
  width: 80px;
  height: 100px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-title {
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 4px;
}

.book-author {
  font-size: 12px;
  color: var(--text-muted);
}

.reference-list {
  margin-bottom: 16px;
}

.reference-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  margin-bottom: 8px;
}

.ref-title {
  font-weight: 500;
  max-width: 200px;
}

.ref-type {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.upload-area {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.preset-list {
  margin-bottom: 16px;
}

.preset-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.preset-item:hover {
  background: var(--bg-tertiary);
}

.preset-item.active {
  background: var(--primary);
  color: white;
}

.preset-title {
  font-weight: 500;
  max-width: 200px;
}

.preset-description {
  font-size: 12px;
  color: var(--text-muted);
  max-width: 200px;
}

.preset-item.active .preset-description {
  color: rgba(255, 255, 255, 0.8);
}

/* Book Detail Modal */
.book-detail-content {
  max-height: 60vh;
  overflow-y: auto;
  line-height: 2;
  white-space: pre-wrap;
}

/* Toast */
.toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--text-primary);
  color: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
}

.toast.success {
  background: var(--success);
}

.toast.error {
  background: var(--error);
}

.toast.warning {
  background: var(--warning);
}

.toast-enter-active,
.toast-leave-active {
  transition: all var(--transition-normal);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

/* Overlay */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 150;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
}

.empty-state svg {
  margin-bottom: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  :root {
    --sidebar-width-left: 85%;
    --sidebar-width-right: 85%;
    --header-height: 50px;
  }
  
  .app-title {
    font-size: 18px;
  }
  
  .content-panel {
    padding: 12px;
  }
  
  .mode-tabs {
    padding: 8px 12px;
  }
  
  .mode-tab {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .mode-tab .icon {
    width: 16px;
    height: 16px;
  }
  
  .outline-form,
  .reference-section,
  .current-chapter {
    padding: 16px;
  }
  
  .generation-controls {
    flex-direction: column;
  }
  
  .generation-controls .btn {
    width: 100%;
  }
  
  .input-wrapper {
    flex-direction: column;
  }
  
  .input-actions {
    flex-direction: row;
    width: 100%;
  }
  
  .input-actions .btn {
    flex: 1;
  }
  
  .books-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .upload-area {
    flex-direction: column;
  }
  
  .upload-area .btn,
  .upload-area .input {
    width: 100%;
  }
}
</style>
