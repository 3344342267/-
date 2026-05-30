<template>
  <div class="app">
    <!-- 主界面 -->
    <div v-if="currentModule === null" class="home-page">
      <header class="home-header">
        <h1 class="app-title">墨韵</h1>
        <p class="app-subtitle">AI智能创作平台</p>
      </header>
      
      <main class="home-content">
        <div class="feature-cards">
          <!-- 图片配色生成卡片 -->
          <div class="feature-card color-card" @click="selectModule('color')">
            <div class="card-icon-wrapper">
              <svg class="card-icon" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </div>
            <h2 class="card-title">从图片生成配色</h2>
            <p class="card-description">上传图片或输入URL，AI将自动分析色彩并生成专业配色方案</p>
            <div class="card-arrow">
              <svg viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </div>

          <!-- 交互式小说创作卡片 -->
          <div class="feature-card story-card" @click="selectModule('story')">
            <div class="card-icon-wrapper">
              <svg class="card-icon" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
              </svg>
            </div>
            <h2 class="card-title">开始交互式小说创作</h2>
            <p class="card-description">以第一人称视角沉浸创作，让AI成为你的叙事伙伴</p>
            <div class="card-arrow">
              <svg viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- 返回按钮 -->
    <button 
      v-if="currentModule !== null" 
      class="back-btn" 
      @click="goBack"
    >
      <svg viewBox="0 0 24 24">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      返回首页
    </button>

    <!-- 配色生成模块 -->
    <div v-if="currentModule === 'color'" class="color-module">
      <div class="module-header">
        <h2>图片配色生成</h2>
        <p>上传图片或输入图片URL，AI将为您提取配色方案</p>
      </div>
      
      <div class="color-content">
        <div class="upload-area">
          <input 
            type="file" 
            ref="fileInput" 
            accept="image/*" 
            @change="handleImageUpload"
            class="file-input"
          >
          <div class="upload-box" @click="triggerFileInput">
            <svg class="upload-icon" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p>点击或拖拽上传图片</p>
            <p class="upload-hint">支持 JPG、PNG、WebP 格式</p>
          </div>
          
          <div class="url-input-group">
            <input 
              type="url" 
              v-model="imageUrl" 
              placeholder="或输入图片URL..."
              class="url-input"
              @keydown.enter="loadFromUrl"
            >
            <button class="btn btn-primary" @click="loadFromUrl" :disabled="!imageUrl">
              加载图片
            </button>
          </div>
        </div>

        <div v-if="selectedImage" class="preview-section">
          <div class="image-preview">
            <img :src="selectedImage" alt="预览图片">
          </div>
          
          <div v-if="colorPalette.length > 0" class="palette-section">
            <h3>生成的配色方案</h3>
            <div class="color-palette">
              <div 
                v-for="(color, index) in colorPalette" 
                :key="index" 
                class="color-item"
                :style="{ backgroundColor: color.hex }"
                @click="copyColor(color.hex)"
                :title="`点击复制 ${color.hex}`"
              >
                <div class="color-info">
                  <span class="color-hex">{{ color.hex }}</span>
                  <span class="color-name">{{ color.name }}</span>
                </div>
              </div>
            </div>
            
            <div class="palette-actions">
              <button class="btn btn-secondary" @click="generatePalette">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                重新生成
              </button>
              <button class="btn btn-primary" @click="downloadPalette">
                <svg viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                下载配色
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 交互式小说创作模块 -->
    <div v-if="currentModule === 'story'" class="story-module">
      <!-- 控制区 - 剧情控制台 -->
      <div class="control-panel">
        <div class="panel-header">
          <h2>剧情控制台</h2>
          <div class="chapter-info">
            <span>第 {{ currentChapter }} 章</span>
          </div>
        </div>
        
        <div class="input-wrapper">
          <textarea
            v-model="storyInput"
            placeholder="请描述接下来希望「我」（您故事中的角色）经历什么？

例如：在古堡中发现一封密信，并因此被守卫追赶。

您可以描述：
• 场景转换（如：来到一片神秘的森林）
• 角色互动（如：遇到一位神秘的老者）
• 关键事件（如：发现一个隐藏的秘密）
• 内心活动（如：突然感到一阵不安）"
            class="story-textarea"
            rows="5"
          ></textarea>
          
          <div class="input-actions">
            <div class="character-settings">
              <label class="form-label">当前角色</label>
              <select v-model="currentCharacter" class="character-select">
                <option v-for="char in characters" :key="char.id" :value="char.id">
                  {{ char.name }}
                </option>
              </select>
            </div>
            <button class="btn btn-primary btn-lg" @click="generateStory" :disabled="!storyInput.trim() || isGenerating">
              <svg v-if="isGenerating" class="loading-icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="20 10"/>
              </svg>
              <svg v-else viewBox="0 0 24 24">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
              {{ isGenerating ? '生成中...' : '生成章节' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 展示区 - 故事内容 -->
      <div class="story-display">
        <div class="display-header">
          <h3>故事内容</h3>
          <div class="story-stats">
            <span>已生成 {{ storyChapters.length }} 章</span>
          </div>
        </div>
        
        <div class="story-content">
          <div v-if="storyChapters.length === 0" class="empty-story">
            <svg class="empty-icon" viewBox="0 0 24 24">
              <path d="M12 19l7-7 3 3-7 7-3-3z"/>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
            </svg>
            <p>开始你的故事创作之旅</p>
            <p class="empty-hint">在上方控制台输入剧情要求，AI将以第一人称视角为你生成故事</p>
          </div>
          
          <div v-else class="chapters-container">
            <div 
              v-for="(chapter, index) in storyChapters" 
              :key="index" 
              class="chapter-block"
            >
              <div class="chapter-header">
                <h4>第 {{ index + 1 }} 章</h4>
                <span class="chapter-time">{{ formatTime(chapter.timestamp) }}</span>
              </div>
              <div class="chapter-input">
                <span class="input-label">剧情要求：</span>
                <p>{{ chapter.prompt }}</p>
              </div>
              <div class="chapter-content" v-html="chapter.content"></div>
              
              <div class="chapter-actions">
                <button class="btn btn-sm btn-secondary" @click="regenerateChapter(index)">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/>
                  </svg>
                  重新生成
                </button>
                <button class="btn btn-sm btn-accent" @click="deleteChapter(index)">
                  <svg viewBox="0 0 24 24">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
                  </svg>
                  删除章节
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.type">
        <svg v-if="toast.type === 'success'" viewBox="0 0 24 24">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        <svg v-else-if="toast.type === 'error'" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <svg v-else viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

// 当前模块
const currentModule = ref(null)

// 配色模块状态
const fileInput = ref(null)
const imageUrl = ref('')
const selectedImage = ref('')
const colorPalette = ref([])

// 故事模块状态
const storyInput = ref('')
const isGenerating = ref(false)
const currentChapter = ref(1)
const storyChapters = ref([])
const currentCharacter = ref('1')

// 角色设定
const characters = ref([
  { id: '1', name: '林墨', description: '一位年轻的书生，好奇心强，善于观察' },
  { id: '2', name: '苏婉', description: '一位神秘的女子，通晓古今' },
  { id: '3', name: '陈风', description: '一位江湖侠客，武艺高强' }
])

// Toast 提示
const toast = reactive({
  show: false,
  message: '',
  type: 'info'
})

// 选择模块
function selectModule(module) {
  currentModule.value = module
}

// 返回首页
function goBack() {
  currentModule.value = null
}

// 显示提示
function showToast(message, type = 'info') {
  toast.message = message
  toast.type = type
  toast.show = true
  setTimeout(() => {
    toast.show = false
  }, 3000)
}

// 图片配色生成相关
function triggerFileInput() {
  fileInput.value?.click()
}

function handleImageUpload(event) {
  const file = event.target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      selectedImage.value = e.target?.result
      generatePalette()
    }
    reader.readAsDataURL(file)
  }
}

function loadFromUrl() {
  if (!imageUrl.value) return
  selectedImage.value = imageUrl.value
  generatePalette()
}

function generatePalette() {
  if (!selectedImage.value) return
  
  // 模拟AI生成配色方案
  const palettes = [
    [
      { hex: '#F4BB2E', name: '明黄月' },
      { hex: '#D76B58', name: '野杏橙' },
      { hex: '#8B4513', name: '棕褐色' },
      { hex: '#FFF8DC', name: '米白色' },
      { hex: '#2F4F4F', name: '深青色' }
    ],
    [
      { hex: '#4A90D9', name: '晴空蓝' },
      { hex: '#67C23A', name: '翡翠绿' },
      { hex: '#E6A23C', name: '琥珀金' },
      { hex: '#F5F5F5', name: '云雾白' },
      { hex: '#303133', name: '墨色黑' }
    ],
    [
      { hex: '#E85D75', name: '胭脂红' },
      { hex: '#FFB6C1', name: '樱花粉' },
      { hex: '#FFF0F5', name: '雪纺粉' },
      { hex: '#8B0000', name: '暗红' },
      { hex: '#DDA0DD', name: '紫罗兰' }
    ]
  ]
  
  const randomPalette = palettes[Math.floor(Math.random() * palettes.length)]
  colorPalette.value = randomPalette
  showToast('配色方案生成成功！', 'success')
}

function copyColor(hex) {
  navigator.clipboard.writeText(hex)
  showToast(`已复制 ${hex}`, 'success')
}

function downloadPalette() {
  if (colorPalette.value.length === 0) return
  
  const content = colorPalette.value.map(c => `${c.name}: ${c.hex}`).join('\n')
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'color-palette.txt'
  a.click()
  URL.revokeObjectURL(url)
  showToast('配色方案已下载', 'success')
}

// 故事创作相关
async function generateStory() {
  if (!storyInput.value.trim() || isGenerating.value) return
  
  isGenerating.value = true
  
  // 模拟AI生成故事内容
  const character = characters.value.find(c => c.id === currentCharacter.value)
  const storyContent = generateMockStory(storyInput.value, character?.name || '我')
  
  const newChapter = {
    prompt: storyInput.value,
    content: storyContent,
    timestamp: Date.now()
  }
  
  storyChapters.value.push(newChapter)
  currentChapter.value = storyChapters.value.length
  storyInput.value = ''
  
  isGenerating.value = false
  showToast('章节生成成功！', 'success')
}

function generateMockStory(prompt, characterName) {
  const stories = [
    `<p>${characterName}的心猛地一跳，手中的烛台险些滑落。${prompt}。</p>
    <p>夜色如墨，古老的城堡在月光下投下斑驳的影子。我握紧了藏在袖中的玉佩，那是母亲临终前交给我的遗物，据说能指引我找到失散多年的父亲。走廊尽头传来沉重的脚步声，我屏住呼吸，闪身躲进了旁边的壁橱。</p>
    <p>"吱呀——" 木门被推开的声音在寂静中格外刺耳。我透过门缝向外望去，只见两个身着黑衣的守卫手持火把走过，他们低声交谈着什么，提到了"密信"和"禁地"。</p>
    <p>等守卫走远，我小心翼翼地走出壁橱。走廊尽头的画像后面似乎有什么东西在闪烁，那是……一双眼睛？还是烛光的倒影？我深吸一口气，一步步向那边走去。</p>`,
    
    `<p>${characterName}站在十字路口，望着茫茫人海，心中一片茫然。${prompt}。</p>
    <p>三天前，师父突然将我叫到密室，交给我一封密封的信，只说了一句"去江南找你师姐"便飘然离去。如今我站在这座繁华的江南古城，却不知师姐身在何方。</p>
    <p>"这位公子，可是在找人？" 一个清脆的声音在身后响起。我转过身，只见一位身着浅蓝色衣裙的少女正笑吟吟地看着我，她手中拿着一把油纸伞，伞面上绘着淡雅的兰花。</p>
    <p>"你是……" 我正要询问，她却抢先说道："我知道你在找什么。跟我来。" 说完便转身走向一条幽深的小巷。我犹豫片刻，还是跟了上去。</p>`,
    
    `<p>${prompt}，${characterName}的手微微颤抖。</p>
    <p>这本泛黄的古籍是我在藏书阁的角落里发现的，书页间夹着一张残破的地图，上面标注着一个叫"归墟"的地方。传说那里藏着能让人长生不老的秘药，但去过的人从未有回来的。</p>
    <p>"少爷，该用晚膳了。" 门外传来管家的声音。我赶紧将地图藏好，应了一声。</p>
    <p>夜幕降临，我换上夜行衣，悄悄离开了府邸。地图上的路线指向城外的迷雾森林，据说那里常年被迷雾笼罩，进去的人很容易迷失方向。但我别无选择，我必须找到那个地方。</p>`
  ]
  
  return stories[Math.floor(Math.random() * stories.length)]
}

function regenerateChapter(index) {
  const chapter = storyChapters.value[index]
  if (!chapter) return
  
  isGenerating.value = true
  
  const character = characters.value.find(c => c.id === currentCharacter.value)
  chapter.content = generateMockStory(chapter.prompt, character?.name || '我')
  chapter.timestamp = Date.now()
  
  isGenerating.value = false
  showToast('章节已重新生成', 'success')
}

function deleteChapter(index) {
  storyChapters.value.splice(index, 1)
  currentChapter.value = Math.max(1, storyChapters.value.length)
  showToast('章节已删除', 'info')
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
/* 主界面 */
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FAF8F5 0%, #F5F2ED 100%);
  padding: 20px;
}

.home-header {
  text-align: center;
  margin-bottom: 60px;
}

.app-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 48px;
  font-weight: 700;
  color: #2D5A4A;
  margin-bottom: 8px;
}

.app-subtitle {
  font-size: 16px;
  color: #8A8A8A;
}

.home-content {
  width: 100%;
  max-width: 900px;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.feature-card {
  background: white;
  border-radius: 20px;
  padding: 32px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(45, 90, 74, 0.08);
  position: relative;
  overflow: hidden;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 32px rgba(45, 90, 74, 0.15);
}

.color-card {
  border-top: 4px solid #C45C48;
}

.story-card {
  border-top: 4px solid #2D5A4A;
}

.card-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.color-card .card-icon-wrapper {
  background: rgba(196, 92, 72, 0.1);
}

.story-card .card-icon-wrapper {
  background: rgba(45, 90, 74, 0.1);
}

.card-icon {
  width: 32px;
  height: 32px;
  stroke-width: 1.5;
}

.color-card .card-icon {
  color: #C45C48;
}

.story-card .card-icon {
  color: #2D5A4A;
}

.card-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 22px;
  font-weight: 600;
  color: #2C2C2C;
  margin-bottom: 8px;
}

.card-description {
  font-size: 14px;
  color: #8A8A8A;
  line-height: 1.6;
}

.card-arrow {
  position: absolute;
  right: 24px;
  bottom: 24px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(45, 90, 74, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
}

.feature-card:hover .card-arrow {
  opacity: 1;
}

.card-arrow svg {
  width: 16px;
  height: 16px;
  color: #2D5A4A;
}

/* 返回按钮 */
.back-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 1px solid rgba(45, 90, 74, 0.15);
  border-radius: 20px;
  font-size: 14px;
  color: #2D5A4A;
  box-shadow: 0 2px 8px rgba(45, 90, 74, 0.08);
  z-index: 100;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #2D5A4A;
  color: white;
}

.back-btn svg {
  width: 16px;
  height: 16px;
}

/* 配色模块 */
.color-module {
  min-height: 100vh;
  background: #FAF8F5;
  padding: 60px 20px 20px;
}

.module-header {
  text-align: center;
  margin-bottom: 40px;
}

.module-header h2 {
  font-family: 'Noto Serif SC', serif;
  font-size: 32px;
  font-weight: 600;
  color: #2C2C2C;
  margin-bottom: 8px;
}

.module-header p {
  font-size: 16px;
  color: #8A8A8A;
}

.color-content {
  max-width: 800px;
  margin: 0 auto;
}

.upload-area {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(45, 90, 74, 0.08);
  margin-bottom: 30px;
}

.file-input {
  display: none;
}

.upload-box {
  border: 2px dashed rgba(45, 90, 74, 0.2);
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 24px;
}

.upload-box:hover {
  border-color: #2D5A4A;
  background: rgba(45, 90, 74, 0.02);
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: #8A8A8A;
  margin-bottom: 16px;
}

.upload-box p {
  font-size: 16px;
  color: #2C2C2C;
  margin-bottom: 4px;
}

.upload-hint {
  font-size: 13px !important;
  color: #8A8A8A !important;
}

.url-input-group {
  display: flex;
  gap: 12px;
}

.url-input {
  flex: 1;
  padding: 12px 16px;
  border: 1.5px solid rgba(45, 90, 74, 0.2);
  border-radius: 8px;
  font-size: 14px;
}

.url-input:focus {
  border-color: #2D5A4A;
  outline: none;
}

.preview-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.image-preview {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(45, 90, 74, 0.08);
}

.image-preview img {
  width: 100%;
  height: 280px;
  object-fit: cover;
}

.palette-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(45, 90, 74, 0.08);
}

.palette-section h3 {
  font-family: 'Noto Serif SC', serif;
  font-size: 18px;
  margin-bottom: 20px;
  color: #2C2C2C;
}

.color-palette {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.color-item {
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.color-item:hover {
  transform: translateX(8px);
}

.color-info {
  display: flex;
  flex-direction: column;
}

.color-hex {
  font-size: 14px;
  font-weight: 500;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.color-name {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.palette-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* 故事模块 */
.story-module {
  min-height: 100vh;
  background: #FAF8F5;
  display: flex;
  flex-direction: column;
  padding-top: 60px;
}

.control-panel {
  background: white;
  border-bottom: 1px solid rgba(45, 90, 74, 0.1);
  padding: 20px;
  box-shadow: 0 2px 8px rgba(45, 90, 74, 0.05);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-header h2 {
  font-family: 'Noto Serif SC', serif;
  font-size: 20px;
  color: #2C2C2C;
}

.chapter-info {
  padding: 6px 12px;
  background: rgba(45, 90, 74, 0.1);
  border-radius: 16px;
  font-size: 13px;
  color: #2D5A4A;
}

.input-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.story-textarea {
  width: 100%;
  min-height: 120px;
  padding: 16px;
  border: 1.5px solid rgba(45, 90, 74, 0.2);
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  margin-bottom: 16px;
}

.story-textarea:focus {
  border-color: #2D5A4A;
  outline: none;
  box-shadow: 0 0 0 3px rgba(45, 90, 74, 0.1);
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.character-settings {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-label {
  font-size: 13px;
  color: #5A5A5A;
}

.character-select {
  padding: 8px 12px;
  border: 1.5px solid rgba(45, 90, 74, 0.2);
  border-radius: 8px;
  font-size: 14px;
  background: white;
}

.btn-lg {
  padding: 14px 28px;
  font-size: 16px;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.story-display {
  flex: 1;
  padding: 20px;
}

.display-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto 20px;
}

.display-header h3 {
  font-family: 'Noto Serif SC', serif;
  font-size: 18px;
  color: #2C2C2C;
}

.story-stats {
  font-size: 13px;
  color: #8A8A8A;
}

.story-content {
  max-width: 1200px;
  margin: 0 auto;
}

.empty-story {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: #8A8A8A;
  margin-bottom: 16px;
}

.empty-story p {
  font-size: 16px;
  color: #5A5A5A;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 14px !important;
  color: #8A8A8A !important;
}

.chapters-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chapter-block {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(45, 90, 74, 0.06);
}

.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chapter-header h4 {
  font-family: 'Noto Serif SC', serif;
  font-size: 18px;
  color: #2D5A4A;
}

.chapter-time {
  font-size: 12px;
  color: #8A8A8A;
}

.chapter-input {
  background: rgba(45, 90, 74, 0.05);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.input-label {
  font-size: 12px;
  font-weight: 500;
  color: #2D5A4A;
  margin-right: 8px;
}

.chapter-input p {
  font-size: 14px;
  color: #5A5A5A;
  margin: 0;
}

.chapter-content {
  font-size: 15px;
  line-height: 1.8;
  color: #2C2C2C;
  margin-bottom: 16px;
}

.chapter-content p {
  margin-bottom: 12px;
  text-indent: 2em;
}

.chapter-content p:last-child {
  margin-bottom: 0;
}

.chapter-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.btn-accent {
  background: #C45C48;
  color: white;
}

.btn-accent:hover {
  background: #D67A68;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 14px;
  color: white;
  z-index: 1000;
  animation: slideUp 0.3s ease;
}

.toast svg {
  width: 18px;
  height: 18px;
}

.toast.info {
  background: #5A5A5A;
}

.toast.success {
  background: #4A8B6E;
}

.toast.error {
  background: #C45C48;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* 响应式 */
@media (max-width: 768px) {
  .app-title {
    font-size: 32px;
  }
  
  .feature-cards {
    grid-template-columns: 1fr;
  }
  
  .preview-section {
    grid-template-columns: 1fr;
  }
  
  .image-preview img {
    height: 200px;
  }
  
  .url-input-group {
    flex-direction: column;
  }
  
  .input-actions {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .character-settings {
    justify-content: space-between;
  }
}
</style>