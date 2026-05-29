
import React, { useState } from 'react';
import { X, Settings, RotateCcw, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { useStore } from '../store';
import { getModelList, testConnection } from '../utils/api';
import { ApiProvider, ModelConfig } from '../store/types';

const PROVIDERS = [
  { value: 'openai' as ApiProvider, label: 'OpenAI (API)', defaultUrl: 'https://api.openai.com/v1' },
  { value: 'openai-responses' as ApiProvider, label: 'OpenAI (Responses API)', defaultUrl: 'https://api.openai.com/v1' },
  { value: 'claude' as ApiProvider, label: 'Claude API', defaultUrl: 'https://api.anthropic.com/v1' },
  { value: 'gemini' as ApiProvider, label: 'Google Gemini API', defaultUrl: 'https://generativelanguage.googleapis.com/v1beta' },
  { value: 'custom' as ApiProvider, label: '其他', defaultUrl: '' },
];

export const ConfigPanel: React.FC = () => {
  const {
    modelConfigs,
    presets,
    setModelConfigs,
    addModelConfig,
    updateModelConfig,
    deleteModelConfig,
    setActiveModelConfig,
    setRightSidebarOpen,
    saveToStorage,
    settings,
    setSettings,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'model' | 'params' | 'preset'>('model');
  const [showAddConfigModal, setShowAddConfigModal] = useState(false);
  const [showEditConfigModal, setShowEditConfigModal] = useState(false);
  const [configToEdit, setConfigToEdit] = useState<ModelConfig | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const [newConfig, setNewConfig] = useState<Partial<ModelConfig>>({
    name: '',
    provider: 'openai',
    apiUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: '',
    presetId: 'preset-none',
    temperature: 1,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    maxTokens: 4096,
    minTokens: 0,
    maxContextTokens: 32000,
  });

  const currentConfig = modelConfigs.find(c => c.id === settings.activeModelConfigId);

  const handleProviderChange = (provider: ApiProvider) => {
    const providerConfig = PROVIDERS.find(p => p.value === provider);
    setNewConfig(prev => ({
      ...prev,
      provider,
      apiUrl: providerConfig?.defaultUrl || '',
      model: '',
    }));
  };

  const handleGetModels = async () => {
    if (!newConfig.apiKey || !newConfig.apiUrl) return;
    
    setIsLoadingModels(true);
    try {
      const models = await getModelList({
        provider: newConfig.provider || 'openai',
        apiUrl: newConfig.apiUrl,
        apiKey: newConfig.apiKey,
        model: '',
        models: [],
      });
      console.log('Models:', models);
    } catch (error) {
      console.error('Failed to get models:', error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleTestConnection = async () => {
    if (!newConfig.apiKey || !newConfig.model || !newConfig.apiUrl) return;
    
    setIsTesting(true);
    setTestResult(null);
    try {
      const success = await testConnection({
        provider: newConfig.provider || 'openai',
        apiUrl: newConfig.apiUrl,
        apiKey: newConfig.apiKey,
        model: newConfig.model,
        models: [],
      });
      setTestResult(success ? 'success' : 'error');
    } catch (error) {
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddConfig = () => {
    if (!newConfig.name || !newConfig.apiKey || !newConfig.model || !newConfig.apiUrl) {
      alert('请填写完整的配置信息');
      return;
    }

    const config: ModelConfig = {
      id: Date.now().toString(),
      name: newConfig.name,
      provider: newConfig.provider || 'openai',
      apiUrl: newConfig.apiUrl,
      apiKey: newConfig.apiKey,
      model: newConfig.model,
      presetId: newConfig.presetId || 'preset-none',
      temperature: newConfig.temperature || 1,
      topP: newConfig.topP || 1,
      frequencyPenalty: newConfig.frequencyPenalty || 0,
      presencePenalty: newConfig.presencePenalty || 0,
      maxTokens: newConfig.maxTokens || 4096,
      minTokens: newConfig.minTokens || 0,
      maxContextTokens: newConfig.maxContextTokens || 32000,
      isActive: modelConfigs.length === 0,
    };

    addModelConfig(config);
    if (modelConfigs.length === 0) {
      setActiveModelConfig(config.id);
    }
    setShowAddConfigModal(false);
    resetNewConfig();
    saveToStorage();
  };

  const handleEditConfig = () => {
    if (!configToEdit || !newConfig.name || !newConfig.apiKey || !newConfig.model || !newConfig.apiUrl) {
      alert('请填写完整的配置信息');
      return;
    }

    updateModelConfig(configToEdit.id, {
      name: newConfig.name,
      provider: newConfig.provider || 'openai',
      apiUrl: newConfig.apiUrl,
      apiKey: newConfig.apiKey,
      model: newConfig.model,
      presetId: newConfig.presetId || 'preset-none',
      temperature: newConfig.temperature || 1,
      topP: newConfig.topP || 1,
      frequencyPenalty: newConfig.frequencyPenalty || 0,
      presencePenalty: newConfig.presencePenalty || 0,
      maxTokens: newConfig.maxTokens || 4096,
      minTokens: newConfig.minTokens || 0,
      maxContextTokens: newConfig.maxContextTokens || 32000,
    });

    setShowEditConfigModal(false);
    setConfigToEdit(null);
    resetNewConfig();
    saveToStorage();
  };

  const resetNewConfig = () => {
    setNewConfig({
      name: '',
      provider: 'openai',
      apiUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: '',
      presetId: 'preset-none',
      temperature: 1,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      maxTokens: 4096,
      minTokens: 0,
      maxContextTokens: 32000,
    });
  };

  const handleDeleteConfig = (id: string) => {
    if (confirm('确定要删除这个配置吗？')) {
      deleteModelConfig(id);
      saveToStorage();
    }
  };

  const handleSelectConfig = (id: string) => {
    setActiveModelConfig(id);
    saveToStorage();
  };

  const handleOpenEditModal = (config: ModelConfig) => {
    setConfigToEdit(config);
    setNewConfig({
      name: config.name,
      provider: config.provider,
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
      model: config.model,
      presetId: config.presetId,
      temperature: config.temperature,
      topP: config.topP,
      frequencyPenalty: config.frequencyPenalty,
      presencePenalty: config.presencePenalty,
      maxTokens: config.maxTokens,
      minTokens: config.minTokens,
      maxContextTokens: config.maxContextTokens,
    });
    setShowEditConfigModal(true);
  };

  const handleParamChange = (key: keyof ModelConfig, value: number) => {
    if (currentConfig) {
      updateModelConfig(currentConfig.id, { [key]: value });
      saveToStorage();
    }
  };

  const handleResetParams = () => {
    if (currentConfig) {
      updateModelConfig(currentConfig.id, {
        temperature: 1,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
        maxTokens: 4096,
        minTokens: 0,
        maxContextTokens: 32000,
      });
      saveToStorage();
    }
  };

  return (
    <div className="h-full bg-paper-50 border-l border-ink-200 flex flex-col">
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-ink-200">
        <h2 className="text-sm md:text-lg font-display font-semibold text-ink-900 flex items-center gap-2">
          <Settings size={18} md:size={20} />
          AI配置中心
        </h2>
        <button
          onClick={() => setRightSidebarOpen(false)}
          className="p-2 hover:bg-ink-100 rounded-lg transition-colors"
        >
          <X size={18} md:size={20} className="text-ink-600" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-ink-200">
        <button
          onClick={() => setActiveTab('model')}
          className={`flex-1 py-2 md:py-3 text-xs md:text-sm font-medium transition-colors ${
            activeTab === 'model'
              ? 'bg-minghuang-50 text-minghuang-700 border-b-2 border-minghuang-500'
              : 'text-ink-600 hover:bg-ink-50'
          }`}
        >
          模型
        </button>
        <button
          onClick={() => setActiveTab('params')}
          className={`flex-1 py-2 md:py-3 text-xs md:text-sm font-medium transition-colors ${
            activeTab === 'params'
              ? 'bg-minghuang-50 text-minghuang-700 border-b-2 border-minghuang-500'
              : 'text-ink-600 hover:bg-ink-50'
          }`}
        >
          参数
        </button>
        <button
          onClick={() => setActiveTab('preset')}
          className={`flex-1 py-2 md:py-3 text-xs md:text-sm font-medium transition-colors ${
            activeTab === 'preset'
              ? 'bg-minghuang-50 text-minghuang-700 border-b-2 border-minghuang-500'
              : 'text-ink-600 hover:bg-ink-50'
          }`}
        >
          预设
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        {activeTab === 'model' && (
          <div className="space-y-3 md:space-y-4">
            {modelConfigs.length === 0 ? (
              <div className="text-center py-6 md:py-8 text-ink-500">
                <Settings size={40} md:size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">还没有模型配置</p>
                <button
                  onClick={() => setShowAddConfigModal(true)}
                  className="mt-3 btn-minghuang text-sm"
                >
                  添加配置
                </button>
              </div>
            ) : (
              <>
                {modelConfigs.map(config => (
                  <div
                    key={config.id}
                    className={`p-3 md:p-4 rounded-xl border-2 transition-all ${
                      settings.activeModelConfigId === config.id
                        ? 'border-minghuang-400 bg-minghuang-50'
                        : 'border-ink-200 bg-white hover:border-ink-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {settings.activeModelConfigId === config.id && (
                            <Check size={14} md:size={16} className="text-minghuang-600" />
                          )}
                          <span className="font-medium text-ink-900 truncate">{config.name}</span>
                        </div>
                        <p className="text-xs md:text-sm text-ink-600 mt-1">
                          {PROVIDERS.find(p => p.value === config.provider)?.label} · {config.model}
                        </p>
                        <p className="text-xs text-ink-500">
                          预设: {presets.find(p => p.id === config.presetId)?.name || '无'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2">
                        <button
                          onClick={() => handleSelectConfig(config.id)}
                          disabled={settings.activeModelConfigId === config.id}
                          className="text-xs md:text-sm px-2 md:px-3 py-1 md:py-1.5 bg-ink-100 text-ink-700 rounded-lg hover:bg-ink-200 transition-colors disabled:opacity-50"
                        >
                          {settings.activeModelConfigId === config.id ? '当前' : '使用'}
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(config)}
                          className="p-1.5 md:p-2 hover:bg-ink-100 rounded-lg transition-colors"
                        >
                          <Settings size={14} md:size={16} className="text-ink-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteConfig(config.id)}
                          className="p-1.5 md:p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} md:size={16} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setShowAddConfigModal(true)}
                  className="w-full py-2 md:py-3 border-2 border-dashed border-ink-300 rounded-xl text-ink-600 hover:border-minghuang-400 hover:text-minghuang-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} md:size={18} />
                  添加新配置
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === 'params' && (
          <div className="space-y-4 md:space-y-6">
            {!currentConfig ? (
              <div className="text-center py-6 md:py-8 text-ink-500">
                <Settings size={40} md:size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">请先选择一个模型配置</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm font-medium text-ink-700">当前: {currentConfig.name}</span>
                  <button
                    onClick={handleResetParams}
                    className="flex items-center gap-1 text-xs md:text-sm text-ink-600 hover:text-ink-800"
                  >
                    <RotateCcw size={12} md:size={14} />
                    重置
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs md:text-sm text-ink-600">温度 (Temperature)</label>
                      <span className="text-xs md:text-sm text-ink-500">{currentConfig.temperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={currentConfig.temperature}
                      onChange={(e) => handleParamChange('temperature', parseFloat(e.target.value))}
                      className="w-full h-2 bg-ink-200 rounded-lg appearance-none cursor-pointer accent-minghuang-500"
                    />
                    <p className="text-xs text-ink-500 mt-1">越高越有创意/随机，越低越保守稳定。推荐创作: 0.8-1.2</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs md:text-sm text-ink-600">Top P (核采样)</label>
                      <span className="text-xs md:text-sm text-ink-500">{currentConfig.topP}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={currentConfig.topP}
                      onChange={(e) => handleParamChange('topP', parseFloat(e.target.value))}
                      className="w-full h-2 bg-ink-200 rounded-lg appearance-none cursor-pointer accent-minghuang-500"
                    />
                    <p className="text-xs text-ink-500 mt-1">限制候选词范围。推荐与温度二选一调节，默认1.0</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs md:text-sm text-ink-600">频率惩罚 (Frequency Penalty)</label>
                      <span className="text-xs md:text-sm text-ink-500">{currentConfig.frequencyPenalty}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={currentConfig.frequencyPenalty}
                      onChange={(e) => handleParamChange('frequencyPenalty', parseFloat(e.target.value))}
                      className="w-full h-2 bg-ink-200 rounded-lg appearance-none cursor-pointer accent-minghuang-500"
                    />
                    <p className="text-xs text-ink-500 mt-1">正值降低词汇重复频率。推荐小说创作: 0.3-1.0</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs md:text-sm text-ink-600">存在惩罚 (Presence Penalty)</label>
                      <span className="text-xs md:text-sm text-ink-500">{currentConfig.presencePenalty}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={currentConfig.presencePenalty}
                      onChange={(e) => handleParamChange('presencePenalty', parseFloat(e.target.value))}
                      className="w-full h-2 bg-ink-200 rounded-lg appearance-none cursor-pointer accent-minghuang-500"
                    />
                    <p className="text-xs text-ink-500 mt-1">正值鼓励引入新话题。推荐: 0-0.5</p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-ink-200">
                  <div>
                    <label className="block text-xs md:text-sm text-ink-600 mb-1.5">单次最大输出 Token</label>
                    <input
                      type="number"
                      value={currentConfig.maxTokens}
                      onChange={(e) => handleParamChange('maxTokens', parseInt(e.target.value) || 0)}
                      className="w-full input-field text-sm"
                    />
                    <p className="text-xs text-ink-500 mt-1">控制每次AI回复的最长长度</p>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm text-ink-600 mb-1.5">单次最小输出 Token</label>
                    <input
                      type="number"
                      value={currentConfig.minTokens}
                      onChange={(e) => handleParamChange('minTokens', parseInt(e.target.value) || 0)}
                      className="w-full input-field text-sm"
                    />
                    <p className="text-xs text-ink-500 mt-1">强制AI至少输出这么多Token (0=不限制)</p>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm text-ink-600 mb-1.5">上下文最大 Token</label>
                    <input
                      type="number"
                      value={currentConfig.maxContextTokens}
                      onChange={(e) => handleParamChange('maxContextTokens', parseInt(e.target.value) || 0)}
                      className="w-full input-field"
                    />
                    <p className="text-xs text-wood-500 mt-1">超出后历史消息将被截断</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'preset' && (
          <div className="space-y-4">
            <p className="text-sm text-wood-600">预设是注入AI的系统提示词，用于规定写作风格和行为准则。在「模型配置」中为每个配置单独选择预设。</p>
            
            <div className="space-y-3">
              {presets.map(preset => (
                <div
                  key={preset.id}
                  className="p-4 bg-white rounded-xl border border-wood-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-wood-900">{preset.name}</span>
                        {preset.isBuiltIn && (
                          <span className="text-xs px-2 py-0.5 bg-wood-100 text-wood-600 rounded-full">内置</span>
                        )}
                      </div>
                      <p className="text-sm text-wood-600 mt-1">{preset.description}</p>
                    </div>
                  </div>
                </div>
              ))}
              <button className="w-full py-3 border-2 border-dashed border-wood-300 rounded-xl text-wood-600 hover:border-amber-400 hover:text-amber-600 transition-colors flex items-center justify-center gap-2">
                <Plus size={18} />
                新建自定义预设
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="p-3 border-t border-wood-200 bg-white/50">
        {currentConfig && (
          <div className="text-xs text-wood-600">
            当前模型: {currentConfig.model} @ {PROVIDERS.find(p => p.value === currentConfig.provider)?.label}
          </div>
        )}
      </div>

      {/* Add Config Modal */}
      {showAddConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-paper-50 rounded-2xl shadow-warm max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-display font-semibold text-wood-900 mb-4">添加新配置</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-wood-600 mb-2">配置名称</label>
                <input
                  type="text"
                  value={newConfig.name}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="如：我的GPT-4"
                  className="w-full input-field"
                />
              </div>

              <div>
                <label className="block text-sm text-wood-600 mb-2">供应商/平台</label>
                <select
                  value={newConfig.provider}
                  onChange={(e) => handleProviderChange(e.target.value as ApiProvider)}
                  className="w-full input-field"
                >
                  {PROVIDERS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-wood-600 mb-2">API 基础地址</label>
                <input
                  type="text"
                  value={newConfig.apiUrl}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                  placeholder="https://api.example.com/v1"
                  className="w-full input-field"
                />
              </div>

              <div>
                <label className="block text-sm text-wood-600 mb-2">API 密钥</label>
                <input
                  type="password"
                  value={newConfig.apiKey}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="sk-..."
                  className="w-full input-field"
                />
              </div>

              <div>
                <label className="block text-sm text-wood-600 mb-2">模型名称</label>
                <input
                  type="text"
                  value={newConfig.model}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="gpt-4"
                  className="w-full input-field"
                />
              </div>

              <div>
                <label className="block text-sm text-wood-600 mb-2">预设</label>
                <select
                  value={newConfig.presetId}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, presetId: e.target.value }))}
                  className="w-full input-field"
                >
                  {presets.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAddConfigModal(false); resetNewConfig(); }}
                  className="flex-1 btn-ghost"
                >
                  取消
                </button>
                <button
                  onClick={handleAddConfig}
                  className="flex-1 btn-amber"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Config Modal */}
      {showEditConfigModal && configToEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-paper-50 rounded-2xl shadow-warm max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-display font-semibold text-wood-900 mb-4">编辑配置</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-wood-600 mb-2">配置名称</label>
                <input
                  type="text"
                  value={newConfig.name}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full input-field"
                />
              </div>

              <div>
                <label className="block text-sm text-wood-600 mb-2">供应商/平台</label>
                <select
                  value={newConfig.provider}
                  onChange={(e) => handleProviderChange(e.target.value as ApiProvider)}
                  className="w-full input-field"
                >
                  {PROVIDERS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-wood-600 mb-2">API 基础地址</label>
                <input
                  type="text"
                  value={newConfig.apiUrl}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                  className="w-full input-field"
                />
              </div>

              <div>
                <label className="block text-sm text-wood-600 mb-2">API 密钥</label>
                <input
                  type="password"
                  value={newConfig.apiKey}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="w-full input-field"
                />
              </div>

              <div>
                <label className="block text-sm text-wood-600 mb-2">模型名称</label>
                <input
                  type="text"
                  value={newConfig.model}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full input-field"
                />
              </div>

              <div>
                <label className="block text-sm text-wood-600 mb-2">预设</label>
                <select
                  value={newConfig.presetId}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, presetId: e.target.value }))}
                  className="w-full input-field"
                >
                  {presets.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowEditConfigModal(false); setConfigToEdit(null); resetNewConfig(); }}
                  className="flex-1 btn-ghost"
                >
                  取消
                </button>
                <button
                  onClick={handleEditConfig}
                  className="flex-1 btn-amber"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
