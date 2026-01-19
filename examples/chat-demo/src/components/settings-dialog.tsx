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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSettings, type Settings } from '@/lib/settings';
import { SettingsIcon } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = useState<Settings>(settings);

  useEffect(() => {
    if (open) {
      setFormData(settings);
    }
  }, [open, settings]);

  const handleSave = () => {
    updateSettings(formData);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setFormData(settings);
    onOpenChange(false);
  };

  const isValid =
    !!formData.anthropicApiKey && !!formData.pageindexApiUrl && !!formData.pageindexApiKey;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Configure your API keys to use this chat demo.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="anthropic-api-key" className="text-sm font-medium">
              Anthropic API Key
            </label>
            <Input
              id="anthropic-api-key"
              type="password"
              placeholder="sk-ant-..."
              value={formData.anthropicApiKey}
              onChange={(e) => setFormData({ ...formData, anthropicApiKey: e.target.value })}
            />
          </div>

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
      className="shrink-0 rounded-full border border-border p-1 hover:bg-muted"
      aria-label="Settings"
    >
      <SettingsIcon className="size-4" />
    </button>
  );
}
