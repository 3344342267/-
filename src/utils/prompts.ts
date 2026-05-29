
import { Reference } from '../store/types';

export function buildSystemPrompt(
  references: Reference[],
  wordLimit?: number
): string {
  let prompt = `你是一位专业的小说写作助手，帮助用户创作小说内容。

写作要求：
- 保持自然流畅的文笔，避免生硬和AI感
- 注意人物性格的一致性
- 保持剧情连贯性
- 语言风格要适合小说阅读
- 避免重复和冗余的描述`;

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
1. 故事梗概
2. 主要人物设定
3. 世界观设定
4. 分章大纲（至少10章）

请用清晰的结构进行组织。`;
  
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
    previousChapters.slice(-2).forEach((chapter, index) => {
      prompt += `\n${chapter.title}：\n${chapter.content.slice(0, 500)}...\n`;
    });
  }
  
  prompt += `\n请根据以上信息创作完整的章节内容。`;
  
  return prompt;
}
