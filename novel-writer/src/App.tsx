import { useState, useRef, useEffect } from 'react';
import './App.css';

// 类型定义
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface NovelType {
  id: string;
  label: string;
  icon: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  prompt: string;
}

// 小说类型
const NOVEL_TYPES: NovelType[] = [
  { id: 'romance', label: '女频言情', icon: '💕' },
  { id: 'ancient', label: '古言仙侠', icon: '🗡️' },
  { id: 'male', label: '男频爽文', icon: '🔥' },
  { id: 'mystery', label: '悬疑推理', icon: '🔍' },
  { id: 'historical', label: '历史古风', icon: '📜' },
  { id: 'sci-fi', label: '科幻末世', icon: '🚀' },
];

// 快捷指令
const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'continue',
    title: '续写当前章节',
    description: '以学到的风格续写当前章节，推进情节，保持风格一致',
    icon: '✍️',
    prompt: '以学到的风格续写当前章节，推进情节，保持风格一致',
  },
  {
    id: 'scene',
    title: '描写场景',
    description: '用这个风格描写一个清晨的山村场景，给人宁静而略带忧伤的氛围',
    icon: '🌄',
    prompt: '用这个风格描写一个清晨的山村场景，给人宁静而略带忧伤的氛围',
  },
  {
    id: 'rewrite',
    title: '改写章节',
    description: '改写当前章节，让战斗场景更加热血激烈',
    icon: '⚔️',
    prompt: '改写当前章节，让战斗场景更加热血激烈',
  },
  {
    id: 'dialogue',
    title: '生成对话',
    description: '写一段都市情感小说的对话，两个久别重逢的人相遇',
    icon: '💬',
    prompt: '写一段都市情感小说的对话，两个久别重逢的人相遇',
  },
  {
    id: 'chase',
    title: '创作情节',
    description: '用学到的风格，写一段紧张刺激的追逐戏',
    icon: '🏃',
    prompt: '用学到的风格，写一段紧张刺激的追逐戏',
  },
];

// 模拟 AI 响应
const simulateAIResponse = async (message: string, novelType: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
  
  const responses: Record<string, string> = {
    'continue': `【续写内容】

夜色渐深，月光如水般倾泻在青石板上。她独自站在庭院中，望着那轮明月，心中思绪万千。

"你来了。"一个低沉的声音从身后传来。

她缓缓转身，看见他站在月光下，一袭白衣被夜风吹得猎猎作响。那双深邃的眼眸中，藏着说不清道不明的情绪。

"我以为你不会再来了。"她的声音有些颤抖。

他缓步走近，每一步都像是踩在她的心尖上..."`,
    
    'scene': `【场景描写】

清晨的山村笼罩在一层薄雾之中，远山如黛，若隐若现。

东方天际泛起鱼肚白，第一缕阳光穿透云层，洒在青瓦白墙上。村口那棵老槐树上，几只早起的鸟儿叽叽喳喳地叫着，清脆的鸣叫声在山谷间回荡。

炊烟袅袅升起，带着柴火特有的香气。一条蜿蜒的小溪从村中流过，溪水清澈见底，偶尔可见几尾小鱼在水中嬉戏。

村头的石磨旁，一位老妇人正慢悠悠地推着磨，脸上刻满了岁月的痕迹。她的动作缓慢而从容，仿佛这清晨的宁静就是她全部的世界...`,
    
    'rewrite': `【改写后的战斗场景】

"找死！"对方怒吼一声，身形如电般扑来。

他冷哼一声，不退反进，右手握拳，体内真气疯狂涌动。拳风呼啸，带着雷霆万钧之势迎击而上。

"轰！"

两股力量碰撞，发出震耳欲聋的巨响。气浪翻滚，周围的树木被连根拔起，碎石飞溅。

他的眼中燃起熊熊战意，每一招每一式都蕴含着滔天怒火。拳影重重，如狂风暴雨般倾泻而下，打得对方节节败退...`,
    
    'dialogue': `【对话内容】

"好久不见。"她微笑着说，声音却有些发颤。

他看着她，眼中闪过复杂的情绪："是啊，十年了。"

"你...过得还好吗？"

"还行。"他顿了顿，"你呢？"

她低下头，轻轻搅动着杯中的咖啡："就那样，日复一日。"

沉默在两人之间蔓延。曾经有那么多话想说，此刻却不知从何说起。

"当初为什么..."他开口，却又停住。

她抬起头，眼中闪过一丝苦涩："都过去了，不是吗？"`,
    
    'chase': `【追逐戏】

"站住！"身后传来急促的脚步声和怒吼。

他头也不回，在狭窄的巷子里飞奔。脚步声越来越近，呼吸也变得急促起来。

前方出现一个岔路口，他毫不犹豫地拐进左边的小巷。这是一条死胡同！

"该死！"他咬牙，看着面前的高墙。身后的脚步声已经近在咫尺。

没有退路了。他深吸一口气，助跑几步，双手撑住墙壁，双脚用力蹬踏，身体如壁虎般向上攀爬...`,
  };

  // 根据消息内容匹配响应
  const matchedKey = Object.keys(responses).find(key => 
    message.toLowerCase().includes(key) || 
    (key === 'continue' && (message.includes('续写') || message.includes('章节'))) ||
    (key === 'scene' && (message.includes('场景') || message.includes('描写'))) ||
    (key === 'rewrite' && message.includes('改写')) ||
    (key === 'dialogue' && message.includes('对话')) ||
    (key === 'chase' && (message.includes('追逐') || message.includes('情节')))
  );

  if (matchedKey) {
    return responses[matchedKey];
  }

  // 默认响应
  return `【AI 创作内容】

根据您选择的"${NOVEL_TYPES.find(t => t.id === novelType)?.label}"风格，我为您创作以下内容：

夜色如水，月光透过雕花的窗棂洒进屋内，在地上投下斑驳的光影。

她静静坐在梳妆台前，铜镜中映出一张清丽的脸庞。指尖轻轻抚过桌上的信笺，那是他临走前留下的，字迹依旧清晰，人却已远去多时。

窗外传来更夫打更的声音，已是三更天了。

"小姐，该歇息了。"丫鬟轻声劝道。

她摇摇头，目光落在信笺末尾的那句"等我归来"上。这一等，便是三年...

（继续输入指令，我可以为您创作更多精彩内容）`;
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('romance');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasReferenceFile, setHasReferenceFile] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 发送消息
  const handleSendMessage = async (content: string = inputValue) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await simulateAIResponse(content, selectedType);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理快捷指令
  const handleQuickAction = (action: QuickAction) => {
    handleSendMessage(action.prompt);
  };

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // 验证文件类型
    const validTypes = ['text/plain', 'application/pdf', 
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.txt')) {
      alert('请上传文本文件（.txt, .doc, .docx, .pdf）');
      return;
    }

    setIsUploading(true);

    // 模拟文件上传和处理
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsUploading(false);
    setHasReferenceFile(true);
    setShowUploadModal(false);

    // 添加系统消息
    const systemMessage: Message = {
      id: Date.now().toString(),
      role: 'system',
      content: `已学习参考文件《${file.name}》的写作风格，后续创作将保持该风格。`,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, systemMessage]);
  };

  // 处理拖拽上传
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="app">
      {/* 头部 */}
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">📖</span>
            <span>小说创作助手</span>
          </div>
          <div className="novel-type-selector">
            {NOVEL_TYPES.map(type => (
              <button
                key={type.id}
                className={`type-btn ${selectedType === type.id ? 'active' : ''}`}
                onClick={() => setSelectedType(type.id)}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>
        </div>
        <div className="header-right">
          <button
            className="upload-btn"
            onClick={() => setShowUploadModal(true)}
            disabled={isUploading}
          >
            <span>{isUploading ? '⏳' : '📎'}</span>
            <span>{isUploading ? '学习中...' : hasReferenceFile ? '已学习风格' : '上传参考小说'}</span>
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="main-content">
        <div className="chat-area">
          {messages.length === 0 ? (
            <div className="welcome-section">
              <h1 className="welcome-title">你好，我是你的小说创作助手</h1>
              <p className="welcome-subtitle">
                可先上传参考小说学习风格，或直接输入创作指令
              </p>
              
              <div className="quick-actions">
                {QUICK_ACTIONS.map(action => (
                  <div
                    key={action.id}
                    className="action-card"
                    onClick={() => handleQuickAction(action)}
                  >
                    <div className="action-icon">{action.icon}</div>
                    <div className="action-title">{action.title}</div>
                    <div className="action-desc">{action.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`message-item ${msg.role}`}
                >
                  <div className="message-avatar">
                    {msg.role === 'assistant' ? '🤖' : msg.role === 'system' ? 'ℹ️' : '👤'}
                  </div>
                  <div className="message-content">
                    {msg.content}
                    <div className="message-time">
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message-item assistant">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="loading-indicator">
                      <span>正在创作中</span>
                      <div className="loading-dots">
                        <div className="loading-dot"></div>
                        <div className="loading-dot"></div>
                        <div className="loading-dot"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* 输入区域 */}
      <div className="input-area">
        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              className="input-box"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入创作指令，或选择上方的快捷指令..."
              disabled={isLoading}
            />
            <div className="input-hint">
              按 Enter 发送，Shift + Enter 换行
            </div>
          </div>
          <button
            className="send-btn"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
          >
            ➤
          </button>
        </div>
      </div>

      {/* 文件上传模态框 */}
      {showUploadModal && (
        <div className="upload-modal-overlay" onClick={() => !isUploading && setShowUploadModal(false)}>
          <div className="upload-modal" onClick={e => e.stopPropagation()}>
            <h3 className="upload-modal-title">上传参考小说</h3>
            <div
              className={`upload-area ${isUploading ? 'uploading' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                if (!isUploading) e.currentTarget.classList.add('drag-over');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('drag-over');
              }}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <div className="upload-icon">📄</div>
              <div className="upload-text">
                {isUploading ? '正在学习写作风格...' : '点击或将文件拖拽到此处'}
              </div>
              <div className="upload-hint">
                支持 .txt, .doc, .docx, .pdf 格式
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.doc,.docx,.pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </div>
            <div className="upload-close">
              <button
                className="close-btn"
                onClick={() => setShowUploadModal(false)}
                disabled={isUploading}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部 */}
      <footer className="footer">
        <span>小说创作助手 V1.0 · 让创作更简单</span>
      </footer>
    </div>
  );
}

export default App;
