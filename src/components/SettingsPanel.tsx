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
    apiSettings,
    setApiSettings,
    setRightSidebarOpen,
    saveToStorage,
  } = useStore();
  
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const handleProviderChange = (provider: string) => {
    const providerConfig = PROVIDERS.find(p => p.value === provider);
    setApiSettings({
      provider: provider as any,
      apiUrl: providerConfig?.defaultUrl || '',
      model: '',
      models: [],
    });
  };

  const handleGetModels = async () => {
    if (!apiSettings.apiKey) return;
    
    setIsLoadingModels(true);
    try {
      const models = await getModelList(apiSettings);
      setApiSettings({ models });
    } catch (error) {
      console.error('Failed to get models:', error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiSettings.apiKey || !apiSettings.model) return;
    
    setIsTesting(true);
    setTestResult(null);
    try {
      const success = await testConnection(apiSettings);
      setTestResult(success ? 'success' : 'error');
    } catch (error) {
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSelectModel = (model: string) => {
    setApiSettings({ model });
    setShowModelDropdown(false);
    saveToStorage();
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
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-wood-700 uppercase tracking-wide">API 配置</h3>
          
          <div>
            <label className="block text-sm text-wood-600 mb-2">模型提供商</label>
            <select
              value={apiSettings.provider}
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
              value={apiSettings.apiUrl}
              onChange={(e) => setApiSettings({ apiUrl: e.target.value })}
              placeholder="https://api.example.com/v1"
              className="w-full input-field"
            />
          </div>

          <div>
            <label className="block text-sm text-wood-600 mb-2">API 密钥</label>
            <input
              type="password"
              value={apiSettings.apiKey}
              onChange={(e) => setApiSettings({ apiKey: e.target.value })}
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
                <span className={apiSettings.model ? 'text-wood-900' : 'text-wood-400'}>
                  {apiSettings.model || '选择或获取模型'}
                </span>
                {showModelDropdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              
              {showModelDropdown && apiSettings.models.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-wood-200 rounded-xl shadow-warm max-h-60 overflow-y-auto">
                  {apiSettings.models.map(model => (
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
              disabled={isLoadingModels || !apiSettings.apiKey}
              className="flex-1 btn-wood"
            >
              {isLoadingModels ? '获取中...' : '获取模型'}
            </button>
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !apiSettings.apiKey || !apiSettings.model}
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
      </div>
    </div>
  );
};