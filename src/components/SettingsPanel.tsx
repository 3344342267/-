
import React, { useState } from 'react';
import { Settings, X, ChevronDown, ChevronUp, Check, AlertCircle, Upload, Image } from 'lucide-react';
import { useStore } from '../store';
import { getModelList, testConnection } from '../utils/api';

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI API 兼容', defaultUrl: 'https://api.openai.com/v1' },
  { value: 'openai-responses', label: 'OpenAI Responses API 兼容', defaultUrl: 'https://api.openai.com/v1' },
  { value: 'claude', label: 'Claude API 兼容', defaultUrl: 'https://api.anthropic.com/v1' },
  { value: 'gemini', label: 'Google Gemini API 兼容', defaultUrl: 'https://generativelanguage.googleapis.com/v1beta' },
];

export const SettingsPanel: React.FC = () => {
  const {
    settings,
    setSettings,
    setRightSidebarOpen,
    saveToStorage,
  } = useStore();
  
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const handleProviderChange = (provider: string) => {
    const providerConfig = PROVIDERS.find(p => p.value === provider);
    setSettings({
      provider: provider as any,
      apiUrl: providerConfig?.defaultUrl || '',
      model: '',
      models: [],
    });
  };

  const handleGetModels = async () => {
    if (!settings.apiKey) return;
    
    setIsLoadingModels(true);
    try {
      const models = await getModelList(settings);
      setSettings({ models });
    } catch (error) {
      console.error('Failed to get models:', error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings.apiKey || !settings.model) return;
    
    setIsTesting(true);
    setTestResult(null);
    try {
      const success = await testConnection(settings);
      setTestResult(success ? 'success' : 'error');
    } catch (error) {
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSelectModel = (model: string) => {
    setSettings({ model });
    setShowModelDropdown(false);
    saveToStorage();
  };

  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSettings({ backgroundImage: content });
      saveToStorage();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="h-full bg-paper-50 border-l border-wood-200 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-wood-200">
        <h2 className="text-lg font-display font-semibold text-wood-900 flex items-center gap-2">
          <Settings size={20} />
          设置
        </h2>
        <button
          onClick={() => setRightSidebarOpen(false)}
          className="p-2 hover:bg-wood-100 rounded-lg transition-colors"
        >
          <X size={20} className="text-wood-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {/* API Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-wood-700 uppercase tracking-wide">API 配置</h3>
          
          <div>
            <label className="block text-sm text-wood-600 mb-2">模型提供商</label>
            <select
              value={settings.provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full input-field"
            >
              {PROVIDERS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-wood-600 mb-2">API 地址</label>
            <input
              type="text"
              value={settings.apiUrl}
              onChange={(e) => setSettings({ apiUrl: e.target.value })}
              placeholder="https://api.example.com/v1"
              className="w-full input-field"
            />
          </div>

          <div>
            <label className="block text-sm text-wood-600 mb-2">API 密钥</label>
            <input
              type="password"
              value={settings.apiKey}
              onChange={(e) => setSettings({ apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full input-field"
            />
          </div>

          <div>
            <label className="block text-sm text-wood-600 mb-2">模型</label>
            <div className="relative">
              <div
                className="w-full input-field flex items-center justify-between cursor-pointer"
                onClick={() => setShowModelDropdown(!showModelDropdown)}
              >
                <span className={settings.model ? 'text-wood-900' : 'text-wood-400'}>
                  {settings.model || '选择或获取模型'}
                </span>
                {showModelDropdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              
              {showModelDropdown && settings.models.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-wood-200 rounded-xl shadow-warm max-h-60 overflow-y-auto">
                  {settings.models.map(model => (
                    <button
                      key={model}
                      onClick={() => handleSelectModel(model)}
                      className="w-full px-4 py-2 text-left hover:bg-wood-100 text-wood-800 transition-colors"
                    >
                      {model}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGetModels}
              disabled={isLoadingModels || !settings.apiKey}
              className="flex-1 btn-wood"
            >
              {isLoadingModels ? '获取中...' : '获取模型'}
            </button>
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !settings.apiKey || !settings.model}
              className="flex-1 btn-amber"
            >
              {isTesting ? '测试中...' : '测试连接'}
            </button>
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-xl ${
              testResult === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {testResult === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
              <span className="text-sm">
                {testResult === 'success' ? '连接成功！' : '连接失败，请检查配置'}
              </span>
            </div>
          )}
        </div>

        <hr className="border-wood-200" />

        {/* Theme Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-wood-700 uppercase tracking-wide flex items-center gap-2">
            <Image size={16} />
            主题设置
          </h3>

          <div>
            <label className="block text-sm text-wood-600 mb-2">自定义背景</label>
            <label className="w-full input-field flex items-center justify-center gap-2 cursor-pointer hover:bg-wood-100 transition-colors">
              <Upload size={20} />
              <span>选择背景图片</span>
              <input
                type="file"
                onChange={handleBackgroundImageUpload}
                className="hidden"
                accept=".png,.jpg,.jpeg,.webp"
              />
            </label>
          </div>

          {settings.backgroundImage && (
            <div>
              <div className="w-full h-32 bg-cover bg-center rounded-xl border border-wood-200" style={{ backgroundImage: `url(${settings.backgroundImage})` }} />
              <button
                onClick={() => {
                  setSettings({ backgroundImage: undefined });
                  saveToStorage();
                }}
                className="mt-2 text-sm text-red-500 hover:text-red-600"
              >
                移除背景图片
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
