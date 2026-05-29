# 墨韵 - AI智能写作平台 技术架构文档

## 1. 技术选型

### 1.1 前端技术栈
- **核心框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **样式方案**: CSS3 + CSS Variables
- **图标**: Lucide Icons
- **Markdown**: marked.js
- **UUID生成**: crypto.randomUUID()

### 1.2 数据存储
- **本地存储**: localStorage
- **数据格式**: JSON

### 1.3 外部依赖
- Google Fonts: Noto Serif SC, Noto Sans SC
- marked.js: Markdown解析

---

## 2. 项目结构

```
/workspace/
├── index.html              # 主入口
├── package.json            # 项目配置
├── vite.config.js          # Vite配置
├── src/
│   ├── main.js            # Vue入口
│   ├── App.vue            # 根组件
│   ├── assets/
│   │   └── styles/
│   │       ├── variables.css    # CSS变量
│   │       ├── base.css         # 基础样式
│   │       ├── components.css   # 组件样式
│   │       └── responsive.css   # 响应式
│   ├── components/
│   │   ├── layout/
│   │   │   ├── SidebarLeft.vue    # 左侧作品栏
│   │   │   ├── SidebarRight.vue   # 右侧设置栏
│   │   │   ├── HeaderBar.vue      # 顶部状态栏
│   │   │   └── FooterBar.vue      # 底部工具栏
│   │   ├── writing/
│   │   │   ├── OutlinePanel.vue   # 大纲面板
│   │   │   ├── ChapterEditor.vue  # 章节编辑
│   │   │   ├── ChatArea.vue       # 对话区域
│   │   │   └── MessageBubble.vue # 消息气泡
│   │   ├── settings/
│   │   │   ├── ApiSettings.vue   # API设置
│   │   │   ├── ModelList.vue     # 模型列表
│   │   │   └── PresetManager.vue # 预设管理
│   │   └── common/
│   │       ├── Modal.vue         # 弹窗组件
│   │       ├── Toast.vue         # 提示组件
│   │       ├── Collapse.vue      # 折叠组件
│   │       └── Button.vue        # 按钮组件
│   ├── composables/
│   │   ├── useApi.js            # API调用
│   │   ├── useStorage.js        # 存储管理
│   │   ├── useChat.js           # 对话逻辑
│   │   └── useBooks.js          # 书籍管理
│   └── utils/
│       ├── api-adapters.js      # API适配器
│       └── helpers.js           # 工具函数
└── public/
    └── favicon.ico
```

---

## 3. API适配器设计

### 3.1 统一接口
```javascript
class ApiAdapter {
  async chat(messages, model, config) {
    // 发送对话请求，返回流式响应
  }
  
  async listModels(apiKey, apiUrl, provider) {
    // 获取可用模型列表
  }
  
  async testConnection(apiKey, apiUrl, model, provider) {
    // 测试连接
  }
}
```

### 3.2 供应商适配器

#### OpenAI兼容
- 端点: `{apiUrl}/chat/completions`
- 格式: OpenAI Chat Format

#### Claude兼容
- 端点: `{apiUrl}/v1/messages`
- 格式: Anthropic Messages Format

#### Gemini兼容
- 端点: `{apiUrl}/v1beta/models`
- 格式: Google AI Format

---

## 4. 数据模型

### 4.1 设置数据
```javascript
{
  apiProvider: "openai" | "claude" | "gemini" | "custom",
  apiUrl: "https://api.openai.com/v1",
  apiKey: "sk-xxx",
  modelName: "gpt-4",
  temperature: 0.8,
  maxTokens: 2000
}
```

### 4.2 书籍数据
```javascript
{
  books: [{
    id: "uuid",
    name: "书名",
    outline: "大纲内容",
    characterSetting: "人物设定",
    createdAt: "2024-01-01",
    chapters: [{
      id: "uuid",
      title: "第一章",
      summary: "章节总结",
      content: "正文内容",
      wordCount: 2000,
      status: "draft" | "completed",
      messages: [],
      createdAt: "2024-01-01"
    }]
  }],
  currentBookId: "uuid",
  currentChapterId: "uuid"
}
```

### 4.3 消息格式
```javascript
{
  id: "uuid",
  role: "user" | "assistant" | "system",
  content: "消息内容",
  thinking: "思维链内容",  // 可选
  timestamp: 1234567890
}
```

### 4.4 预设格式
```javascript
{
  id: "uuid",
  title: "预设名称",
  description: "描述",
  content: "预设系统提示词",
  variables: ["变量1", "变量2"],
  createdAt: "2024-01-01"
}
```

---

## 5. 核心流程

### 5.1 写作流程
```
1. 创建/选择书籍
   ↓
2. 创建/编辑大纲
   ↓
3. 创建章节
   ↓
4. 输入剧情要求
   ↓
5. 调用AI生成内容
   ↓
6. 编辑/采纳内容
   ↓
7. 保存到章节
   ↓
8. 继续下一章
```

### 5.2 API调用流程
```
1. 用户配置API信息
   ↓
2. 点击"获取模型"
   ↓
3. 调用listModels()
   ↓
4. 显示模型列表
   ↓
5. 用户选择模型
   ↓
6. 点击"测试连接"
   ↓
7. 调用testConnection()
   ↓
8. 显示结果
```

---

## 6. 响应式断点

### 6.1 断点定义
```css
/* 手机端优先 */
@media (min-width: 768px) { /* 平板 */ }
@media (min-width: 1024px) { /* 桌面 */ }
@media (min-width: 1440px) { /* 大屏 */ }
```

### 6.2 移动端布局
- 单列布局
- 侧边栏全屏覆盖
- 底部固定工具栏
- 顶部可折叠

---

## 7. 性能优化

### 7.1 代码分割
- 按需加载组件
- 懒加载侧边栏

### 7.2 状态优化
- 合理使用computed
- 避免不必要的重渲染

### 7.3 存储优化
- 定期清理过期数据
- 压缩存储数据

---

## 8. 安全考虑

### 8.1 API密钥保护
- 不上传到服务器
- 仅本地存储
- 可手动清除

### 8.2 XSS防护
- HTML转义
- Markdown安全渲染

---

## 9. 可访问性

### 9.1 语义化
- 正确的HTML标签
- ARIA属性

### 9.2 键盘导航
- Tab顺序
- ESC关闭弹窗

### 9.3 色彩对比
- 满足WCAG AA标准
