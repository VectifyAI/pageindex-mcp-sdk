'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useSettings, type Settings, type Provider } from '@/lib/settings';
import { SettingsIcon } from 'lucide-react';

const ANTHROPIC_MODELS = [
  { id: 'claude-sonnet-4-5-20250929', name: 'Sonnet 4.5', recommended: true },
  { id: 'claude-haiku-4-5-20251001', name: 'Haiku 4.5' },
  { id: 'claude-opus-4-5-20251101', name: 'Opus 4.5' },
  { id: 'claude-sonnet-4-20250514', name: 'Sonnet 4' },
];

const OPENROUTER_MODELS = [
  { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5', recommended: true },
  { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5' },
  { id: 'openai/gpt-5.2', name: 'GPT-5.2' },
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash' },
  { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2' },
  { id: 'x-ai/grok-4.1-fast', name: 'Grok 4.1 Fast' },
  { id: 'custom', name: 'Custom...' },
];

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = useState<Settings>(settings);
  const [customModel, setCustomModel] = useState('');
  const [isCustomModel, setIsCustomModel] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData(settings);
      const isCustom =
        settings.provider === 'openrouter' &&
        !OPENROUTER_MODELS.some((m) => m.id === settings.openrouterModel && m.id !== 'custom');
      setIsCustomModel(isCustom);
      if (isCustom) {
        setCustomModel(settings.openrouterModel);
      }
    }
  }, [open, settings]);

  const handleSave = () => {
    const finalData = { ...formData };
    if (formData.provider === 'openrouter' && isCustomModel && customModel) {
      finalData.openrouterModel = customModel;
    }
    updateSettings(finalData);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setFormData(settings);
    onOpenChange(false);
  };

  const handleProviderChange = (provider: Provider) => {
    setFormData({ ...formData, provider });
    setIsCustomModel(false);
    setCustomModel('');
  };

  const handleOpenRouterModelChange = (modelId: string) => {
    if (modelId === 'custom') {
      setIsCustomModel(true);
      setCustomModel('');
    } else {
      setIsCustomModel(false);
      setFormData({ ...formData, openrouterModel: modelId });
    }
  };

  const isProviderConfigured =
    formData.provider === 'anthropic'
      ? !!formData.anthropicApiKey
      : !!formData.openrouterApiKey && (isCustomModel ? !!customModel : true);

  const isValid = isProviderConfigured && !!formData.pageindexApiUrl && !!formData.pageindexApiKey;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Configure your API keys to use this chat demo.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="provider" className="text-sm font-medium">
              Provider
            </label>
            <Select value={formData.provider} onValueChange={handleProviderChange}>
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="openrouter">OpenRouter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="api-key" className="text-sm font-medium">
              {formData.provider === 'anthropic' ? 'Anthropic' : 'OpenRouter'} API Key
            </label>
            <Input
              id="api-key"
              type="password"
              placeholder={formData.provider === 'anthropic' ? 'sk-ant-...' : 'sk-or-...'}
              value={
                formData.provider === 'anthropic'
                  ? formData.anthropicApiKey
                  : formData.openrouterApiKey
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  [formData.provider === 'anthropic' ? 'anthropicApiKey' : 'openrouterApiKey']:
                    e.target.value,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="model" className="text-sm font-medium">
              Model
            </label>
            {formData.provider === 'anthropic' ? (
              <Select
                value={formData.anthropicModel}
                onValueChange={(value) => setFormData({ ...formData, anthropicModel: value })}
              >
                <SelectTrigger id="model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANTHROPIC_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                      {model.recommended && ' (Recommended)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={isCustomModel ? 'custom' : formData.openrouterModel}
                onValueChange={handleOpenRouterModelChange}
              >
                <SelectTrigger id="model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPENROUTER_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                      {model.recommended && ' (Recommended)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {formData.provider === 'openrouter' && isCustomModel && (
            <div className="space-y-2">
              <label htmlFor="custom-model" className="text-sm font-medium">
                Custom Model ID
              </label>
              <Input
                id="custom-model"
                type="text"
                placeholder="provider/model-name"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
              />
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <label htmlFor="pageindex-api-url" className="text-sm font-medium">
              PageIndex API URL
            </label>
            <Input
              id="pageindex-api-url"
              type="url"
              placeholder="https://chat.pageindex.ai"
              value={formData.pageindexApiUrl}
              onChange={(e) => setFormData({ ...formData, pageindexApiUrl: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="pageindex-api-key" className="text-sm font-medium">
              PageIndex API Key
            </label>
            <Input
              id="pageindex-api-key"
              type="password"
              value={formData.pageindexApiKey}
              onChange={(e) => setFormData({ ...formData, pageindexApiKey: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SettingsButtonProps {
  onClick: () => void;
}

export function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-full border border-border p-1.5 hover:bg-muted"
      aria-label="Settings"
    >
      <SettingsIcon className="size-4" />
    </button>
  );
}
