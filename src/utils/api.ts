
import { ApiSettings } from '../store/types';

export interface ApiError {
  message: string;
  code?: string;
}

export const getModelList = async (settings: ApiSettings): Promise<string[]> => {
  const { provider, apiUrl, apiKey } = settings;
  
  try {
    let url: string;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    switch (provider) {
      case 'openai':
      case 'openai-responses':
        url = `${apiUrl}/models`;
        headers['Authorization'] = `Bearer ${apiKey}`;
        break;
      case 'claude':
        url = `${apiUrl}/models`;
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
        break;
      case 'gemini':
        url = `${apiUrl}/models?key=${apiKey}`;
        break;
      default:
        throw new Error('Unsupported provider');
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse response based on provider
    let models: string[] = [];
    if (provider === 'openai' || provider === 'openai-responses') {
      models = data.data?.map((m: any) => m.id) || [];
    } else if (provider === 'claude') {
      models = data.models?.map((m: any) => m.id) || ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'];
    } else if (provider === 'gemini') {
      models = data.models?.map((m: any) => m.name.replace('models/', '')) || ['gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    }

    return models.filter(m => {
      const lower = m.toLowerCase();
      return lower.includes('gpt') || lower.includes('claude') || lower.includes('gemini') || lower.includes('llama') || lower.includes('qwen');
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error;
  }
};

export const testConnection = async (settings: ApiSettings): Promise<boolean> => {
  try {
    // Just try to get models as a test
    await getModelList(settings);
    return true;
  } catch (error) {
    return false;
  }
};

export const streamCompletion = async (
  settings: ApiSettings,
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  onChunk: (chunk: string, thinking?: string) => void,
  onComplete: () => void,
  onError: (error: ApiError) => void,
  signal: AbortSignal
) => {
  const { provider, apiUrl, apiKey, model } = settings;

  try {
    let url: string;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    let body: any;

    switch (provider) {
      case 'openai':
        url = `${apiUrl}/chat/completions`;
        headers['Authorization'] = `Bearer ${apiKey}`;
        body = {
          model,
          messages,
          stream: true,
        };
        break;
      case 'openai-responses':
        url = `${apiUrl}/responses`;
        headers['Authorization'] = `Bearer ${apiKey}`;
        body = {
          model,
          input: messages.map(m => ({ role: m.role, content: m.content })),
          stream: true,
        };
        break;
      case 'claude':
        url = `${apiUrl}/messages`;
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
        body = {
          model,
          messages: messages.filter(m => m.role !== 'system'),
          stream: true,
          max_tokens: 4096,
          system: messages.find(m => m.role === 'system')?.content || '',
        };
        break;
      case 'gemini':
        url = `${apiUrl}/models/${model}:streamGenerateContent?key=${apiKey}`;
        body = {
          contents: messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
        };
        break;
      default:
        throw new Error('Unsupported provider');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Request failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;

        let dataStr = trimmed;
        if (dataStr.startsWith('data: ')) {
          dataStr = dataStr.slice(6);
        }

        try {
          const data = JSON.parse(dataStr);
          let content = '';
          let thinking = '';

          if (provider === 'openai') {
            content = data.choices?.[0]?.delta?.content || '';
          } else if (provider === 'openai-responses') {
            content = data.output?.[0]?.content?.[0]?.text || '';
          } else if (provider === 'claude') {
            if (data.type === 'content_block_delta') {
              content = data.delta?.text || '';
            }
          } else if (provider === 'gemini') {
            content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          }

          if (content) {
            onChunk(content, thinking);
          }
        } catch (e) {
          // Skip invalid JSON lines
        }
      }
    }

    onComplete();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      onComplete();
      return;
    }
    onError({
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
