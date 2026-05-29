
import React, { useState } from 'react';
import { X, Settings, RotateCcw, Plus, Trash2, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
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
  const [showApiKey, setShowApiKey] = useState(false);

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
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('model')}
          className={`flex-1 py-4 text-sm font-medium transition-all relative ${
            activeTab === 'model'
              ? 'text-cyan-400'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          模型
          {activeTab === 'model' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-violet-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('params')}
          className={`flex-1 py-4 text-sm font-medium transition-all relative ${
            activeTab === 'params'
              ? 'text-violet-400'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          参数
          {activeTab === 'params' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-orange-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('preset')}
          className={`flex-1 py-4 text-sm font-medium transition-all relative ${
            activeTab === 'preset'
              ? 'text-orange-400'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          预设
          {activeTab === 'preset' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-cyan-500" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        {activeTab === 'model' && (
          <div className="space-y-4">
            {modelConfigs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center">
                  <Settings size={40} className="text-cyan-400" />
                </div>
                <p className="text-slate-400 mb-2">还没有模型配置</p>
                <p className="text-sm text-slate-500 mb-6">添加一个 AI 模型配置开始创作</p>
                <button
                  onClick={() => setShowAddConfigModal(true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-medium hover:shadow-neon transition-all"
                >
                  添加配置
                </button>
              </div>
            ) : (
              <>
                {modelConfigs.map(config => (
                  <div
                    key={config.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      settings.activeModelConfigId === config.id
                        ? 'border-cyan-500/50 bg-gradient-to-br from-cyan-500/10 to-violet-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {settings.activeModelConfigId === config.id && (
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                          )}
                          <span className="font-semibold text-slate-200">{config.name}</span>
                        </div>
                        <p className="text-sm text-slate-400 mb-1">
                          {PROVIDERS.find(p => p.value === config.provider)?.label} · {config.model}
                        </p>
                        <p className="text-xs text-slate-500">
                          预设: {presets.find(p => p.id === config.presetId)?.name || '无'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSelectConfig(config.id)}
                          disabled={settings.activeModelConfigId === config.id}
                          className="px-4 py-2 text-sm rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-all disabled:opacity-50"
                        >
                          {settings.activeModelConfigId === config.id ? '当前' : '使用'}
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(config)}
                          className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                        >
                          <Settings size={16} className="text-slate-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteConfig(config.id)}
                          className="p-2 rounded-xl hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setShowAddConfigModal(true)}
                  className="w-full py-4 border-2 border-dashed border-white/20 rounded-2xl text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  添加新配置
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === 'params' && (
          <div className="space-y-8">
            {!currentConfig ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center">
                  <Settings size={40} className="text-cyan-400" />
                </div>
                <p className="text-slate-400">请先选择一个模型配置</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <span className="text-sm font-medium text-slate-300">当前: {currentConfig.name}</span>
                  </div>
                  <button
                    onClick={handleResetParams}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-xl transition-all"
                  >
                    <RotateCcw size={16} />
                    重置
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-slate-300">温度 (Temperature)</label>
                      <span className="text-sm text-cyan-400 font-mono">{currentConfig.temperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={currentConfig.temperature}
                      onChange={(e) => handleParamChange('temperature', parseFloat(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-500"
                    />
                    <p className="text-xs text-slate-500 mt-2">越高越有创意/随机，越低越保守稳定。推荐创作: 0.8-1.2</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-slate-300">Top P (核采样)</label>
                      <span className="text-sm text-violet-400 font-mono">{currentConfig.topP}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={currentConfig.topP}
                      onChange={(e) => handleParamChange('topP', parseFloat(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-violet-500"
                    />
                    <p className="text-xs text-slate-500 mt-2">限制候选词范围。推荐与温度二选一调节，默认1.0</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-slate-300">频率惩罚 (Frequency Penalty)</label>
                      <span className="text-sm text-orange-400 font-mono">{currentConfig.frequencyPenalty}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={currentConfig.frequencyPenalty}
                      onChange={(e) => handleParamChange('frequencyPenalty', parseFloat(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-orange-500"
                    />
                    <p className="text-xs text-slate-500 mt-2">正值降低词汇重复频率。推荐小说创作: 0.3-1.0</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-slate-300">存在惩罚 (Presence Penalty)</label>
                      <span className="text-sm text-slate-400 font-mono">{currentConfig.presencePenalty}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={currentConfig.presencePenalty}
                      onChange={(e) => handleParamChange('presencePenalty', parseFloat(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-slate-500"
                    />
                    <p className="text-xs text-slate-500 mt-2">正值鼓励引入新话题。推荐: 0-0.5</p>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/10">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">单次最大输出 Token</label>
                    <input
                      type="number"
                      value={currentConfig.maxTokens}
                      onChange={(e) => handleParamChange('maxTokens', parseInt(e.target.value) || 0)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-2">控制每次AI回复的最长长度</p>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">单次最小输出 Token</label>
                    <input
                      type="number"
                      value={currentConfig.minTokens}
                      onChange={(e) => handleParamChange('minTokens', parseInt(e.target.value) || 0)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-2">强制AI至少输出这么多Token (0=不限制)</p>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">上下文最大 Token</label>
                    <input
                      type="number"
                      value={currentConfig.maxContextTokens}
                      onChange={(e) => handleParamChange('maxContextTokens', parseInt(e.target.value) || 0)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-2">超出后历史消息将被截断</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'preset' && (
          <div className="space-y-6">
            <p className="text-sm text-slate-400">预设是注入AI的系统提示词，用于规定写作风格和行为准则。在「模型配置」中为每个配置单独选择预设。</p>
            
            <div className="space-y-4">
              {presets.map(preset => (
                <div
                  key={preset.id}
                  className="card-enhanced"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-slate-200">{preset.name}</span>
                        {preset.isBuiltIn && (
                          <span className="text-xs px-3 py-1 bg-white/10 text-slate-400 rounded-full">内置</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">{preset.description}</p>
                    </div>
                  </div>
                </div>
              ))}
              <button className="w-full py-4 border-2 border-dashed border-white/20 rounded-2xl text-slate-400 hover:border-orange-500/50 hover:text-orange-400 transition-all flex items-center justify-center gap-2">
                <Plus size={18} />
                新建自定义预设
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="p-4 border-t border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-900/30">
        {currentConfig && (
          <div className="text-sm text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            当前模型: {currentConfig.model} @ {PROVIDERS.find(p => p.value === currentConfig.provider)?.label}
          </div>
        )}
      </div>

      {/* Add Config Modal */}
      {showAddConfigModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-neon max-w-md w-full p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
            <h3 className="text-xl font-semibold text-slate-100 mb-6">添加新配置</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-slate-400 mb-2">配置名称</label>
                <input
                  type="text"
                  value={newConfig.name}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="如：我的GPT-4"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">供应商/平台</label>
                <select
                  value={newConfig.provider}
                  onChange={(e) => handleProviderChange(e.target.value as ApiProvider)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                >
                  {PROVIDERS.map(p => (
                    <option key={p.value} value={p.value} className="bg-slate-800">{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">API 基础地址</label>
                <input
                  type="text"
                  value={newConfig.apiUrl}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                  placeholder="https://api.example.com/v1"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">API 密钥</label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={newConfig.apiKey}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="sk-..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">模型名称</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newConfig.model}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="gpt-4"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                  />
                  <button
                    onClick={handleGetModels}
                    disabled={isLoadingModels}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:bg-white/10 hover:text-cyan-400 hover:border-cyan-500/30 transition-all disabled:opacity-50"
                  >
                    {isLoadingModels ? '...' : '获取'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">预设</label>
                <select
                  value={newConfig.presetId}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, presetId: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                >
                  {presets.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-800">{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setShowAddConfigModal(false); resetNewConfig(); }}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleAddConfig}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-medium hover:shadow-neon transition-all"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-neon max-w-md w-full p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
            <h3 className="text-xl font-semibold text-slate-100 mb-6">编辑配置</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-slate-400 mb-2">配置名称</label>
                <input
                  type="text"
                  value={newConfig.name}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">供应商/平台</label>
                <select
                  value={newConfig.provider}
                  onChange={(e) => handleProviderChange(e.target.value as ApiProvider)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                >
                  {PROVIDERS.map(p => (
                    <option key={p.value} value={p.value} className="bg-slate-800">{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">API 基础地址</label>
                <input
                  type="text"
                  value={newConfig.apiUrl}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">API 密钥</label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={newConfig.apiKey}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">模型名称</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newConfig.model}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, model: e.target.value }))}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                  />
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:bg-white/10 hover:text-orange-400 hover:border-orange-500/30 transition-all disabled:opacity-50"
                  >
                    {isTesting ? '...' : '测试'}
                  </button>
                </div>
                {testResult && (
                  <p className={`text-xs mt-2 ${testResult === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {testResult === 'success' ? '✓ 连接成功' : '✗ 连接失败'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">预设</label>
                <select
                  value={newConfig.presetId}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, presetId: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all"
                >
                  {presets.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-800">{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setShowEditConfigModal(false); setConfigToEdit(null); resetNewConfig(); }}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleEditConfig}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-medium hover:shadow-neon transition-all"
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
