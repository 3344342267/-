
import { Reference, Preset } from '../store/types';

export function buildSystemPrompt(
  references: Reference[],
  preset: Preset | null,
  wordLimit?: number
): string {
  let prompt = '';

  if (preset && preset.content) {
    prompt += preset.content;
  } else {
    prompt = `你是一位专业的小说写作助手，帮助用户创作小说内容。

写作要求：
- 保持自然流畅的文笔，避免生硬和AI感
- 注意人物性格的一致性
- 保持剧情连贯性
- 语言风格要适合小说阅读
- 避免重复和冗余的描述
- 注重细节描写，营造画面感
- 对话要符合人物性格和场景`;
  }

  if (wordLimit) {
    prompt += `\n\n本次生成的字数控制在约 ${wordLimit} 字左右。`;
  }

  if (references.length > 0) {
    prompt += `\n\n【风格参考】
请参考以下内容的写作风格（但不要参考其中的剧情）：
`;
    references.forEach((ref, index) => {
      prompt += `\n--- 参考 ${index + 1}: ${ref.title} ---\n`;
      if (ref.content) {
        prompt += ref.content.slice(0, 3000);
        if (ref.content.length > 3000) {
          prompt += '\n...（内容已截断）';
        }
      }
      prompt += '\n';
    });
  }

  return prompt;
}

export function buildContinuePrompt(
  currentContent: string,
  userInstruction?: string
): string {
  let prompt = '请继续创作以下内容';
  
  if (userInstruction) {
    prompt += `，并注意：${userInstruction}`;
  }
  
  prompt += `：\n\n--- 当前内容 ---\n${currentContent}\n\n`;
  
  return prompt;
}

export function buildRewritePrompt(
  content: string,
  instruction: string
): string {
  return `请根据以下要求重写这段内容：
${instruction}

--- 原文 ---\n${content}

请只返回重写后的内容，不要包含其他说明。
`;
}

export function buildExpandPrompt(
  content: string
): string {
  return `请扩写以下内容，增加更多细节描写、心理活动和场景营造，让内容更加丰富生动：

--- 原文 ---\n${content}

请只返回扩写后的内容，不要包含其他说明。
`;
}

export function buildSummarizePrompt(
  content: string
): string {
  return `请总结以下内容的要点，保持核心信息：

--- 原文 ---\n${content}

请只返回总结后的内容，不要包含其他说明。
`;
}

export function buildPolishPrompt(
  content: string
): string {
  return `请润色以下内容，优化文笔表达，让文字更加流畅优美：

--- 原文 ---\n${content}

请只返回润色后的内容，不要包含其他说明。
`;
}

export function buildOutlinePrompt(
  bookTitle: string,
  bookDescription?: string
): string {
  let prompt = `请为小说《${bookTitle}》创建一个详细的大纲。`;
  
  if (bookDescription) {
    prompt += `\n\n小说简介：${bookDescription}`;
  }
  
  prompt += `\n\n请包括以下部分：
1. 故事梗概（300-500字）
2. 主要人物设定（姓名、性格、背景、动机）
3. 世界观设定
4. 分章大纲（至少15章，每章包含章节标题和剧情概要）
5. 核心冲突和主题

请用清晰的结构进行组织，使用 Markdown 格式。`;
  
  return prompt;
}

export function buildChapterPrompt(
  chapterTitle: string,
  plotSummary: string,
  previousChapters: any[]
): string {
  let prompt = `请创作章节：${chapterTitle}

本章剧情梗概：${plotSummary}`;
  
  if (previousChapters.length > 0) {
    prompt += `\n\n--- 前文回顾 ---`;
    previousChapters.slice(-3).forEach((chapter, index) => {
      prompt += `\n${chapter.title}：\n${chapter.content.slice(0, 800)}...\n`;
    });
  }
  
  prompt += `\n请根据以上信息创作完整的章节内容，要求：
- 内容连贯，承接前文
- 人物性格一致
- 注重细节描写
- 字数在2000-3000字左右`;
  
  return prompt;
}

export function buildStyleLearningPrompt(
  text: string
): string {
  return `请分析以下文本的写作风格特点：

--- 参考文本 ---
${text.slice(0, 5000)}
${text.length > 5000 ? '\n...（内容已截断）' : ''}

--- 分析要求 ---
请详细分析这段文本的：
1. 文笔特点和常用措辞
2. 段落结构和叙事节奏
3. 氛围营造方式
4. 修辞手法运用
5. 人物描写风格
6. 对话特点

请提供一份详细的风格分析报告，以便我后续模仿这种风格进行创作。`;
}

export function buildCharacterPrompt(
  characterName: string,
  description?: string
): string {
  let prompt = `请创建一个详细的人物设定：${characterName}`;
  
  if (description) {
    prompt += `\n\n初步描述：${description}`;
  }
  
  prompt += `\n\n请包括以下信息：
1. 基本信息（姓名、年龄、外貌）
2. 性格特点
3. 背景故事
4. 核心动机和目标
5. 人物关系
6. 标志性台词或动作
7. 人物弧光（成长变化）

请用清晰的结构进行组织。`;
  
  return prompt;
}

export function buildDialoguePrompt(
  scene: string,
  characters: string[]
): string {
  return `请为以下场景创作对话：

场景：${scene}
人物：${characters.join('、')}

要求：
- 对话符合人物性格
- 自然流畅，不生硬
- 通过对话展现人物关系和剧情
- 适当添加动作和神态描写`;
}

export function buildScenePrompt(
  sceneDescription: string
): string {
  return `请描写以下场景：

${sceneDescription}

要求：
- 注重环境和氛围营造
- 有画面感
- 调动多种感官描写
- 为情节发展做好铺垫`;
}

export const BUILT_IN_PRESETS = [
  {
    id: 'default',
    name: '通用创作',
    description: '适合大多数小说类型的通用写作风格',
    content: `你是一位专业的小说写作助手，帮助用户创作小说内容。

写作要求：
- 保持自然流畅的文笔，避免生硬和AI感
- 注意人物性格的一致性
- 保持剧情连贯性
- 语言风格要适合小说阅读
- 避免重复和冗余的描述
- 注重细节描写，营造画面感
- 对话要符合人物性格和场景`,
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'fantasy',
    name: '奇幻史诗',
    description: '宏大的世界观设定，史诗感的叙事风格',
    content: `你是一位奇幻小说创作专家，擅长构建宏大的奇幻世界和史诗般的故事。

写作风格要求：
- 宏大的世界观设定，详细的魔法体系
- 史诗感的叙事风格
- 丰富的种族和文化描写
- 壮丽的场景描绘
- 英雄主义和宿命感
- 注重世界构建的细节和逻辑自洽`,
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'romance',
    name: '浪漫言情',
    description: '细腻的情感描写，温暖的叙事风格',
    content: `你是一位言情小说创作专家，擅长描写细腻的情感和浪漫的故事。

写作风格要求：
- 细腻的情感描写和心理刻画
- 温暖甜美的叙事风格
- 注重人物互动和化学反应
- 浪漫的氛围营造
- 情感发展的层次感
- 温柔优美的文笔`,
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mystery',
    name: '悬疑推理',
    description: '紧凑的节奏，巧妙的悬念设置',
    content: `你是一位悬疑推理小说创作专家，擅长设置悬念和营造紧张氛围。

写作风格要求：
- 紧凑的叙事节奏
- 巧妙的悬念设置和伏笔
- 逻辑严密的推理过程
- 紧张压抑的氛围营造
- 出人意料但合理的反转
- 注重细节线索的铺陈`,
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'scifi',
    name: '科幻未来',
    description: '硬核的科技设定，对未来的深度思考',
    content: `你是一位科幻小说创作专家，擅长构建未来世界和探讨科技与人性的关系。

写作风格要求：
- 硬核但合理的科技设定
- 对未来社会的深度思考
- 科技与人性的冲突
- 未来感的语言风格
- 宏大的时空概念
- 注重科幻概念的解释和融入`,
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'xianxia',
    name: '仙侠玄幻',
    description: '东方玄幻风格，修仙设定和战斗描写',
    content: `你是一位仙侠玄幻小说创作专家，擅长构建修仙世界和描写精彩的战斗场景。

写作风格要求：
- 完整的修仙体系和境界设定
- 东方古典美学的语言风格
- 精彩的战斗场面描写
- 宏大的世界观和力量体系
- 飘逸出尘的气质
- 注重意境和氛围的营造`,
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'literary',
    name: '文学经典',
    description: '深刻的思想内涵，优美的文学语言',
    content: `你是一位文学创作专家，追求深刻的思想和优美的文学表达。

写作风格要求：
- 深刻的思想内涵和主题表达
- 优美精致的文学语言
- 人物塑造的深度和复杂性
- 象征和隐喻的运用
- 对人性和社会的洞察
- 注重文学性和艺术性的统一`,
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'webnovel',
    name: '网文爽文',
    description: '快节奏，强情节，读者代入感强',
    content: `你是一位网络小说创作专家，擅长创作快节奏、强情节的故事。

写作风格要求：
- 快节奏的情节推进
- 强烈的代入感和爽点
- 清晰的升级和成长体系
- 讨喜的人物设定
- 不断的悬念和期待感
- 语言直白易懂，适合快速阅读`,
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  }
];

