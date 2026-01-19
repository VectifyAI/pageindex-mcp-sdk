'use client';

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputHeader,
  PromptInputBody,
  PromptInputFooter,
  PromptInputTools,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { SettingsDialog, SettingsButton } from '@/components/settings-dialog';
import { DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettingsProvider, useSettings } from '@/lib/settings';
import { cn } from '@/lib/utils';
import { useChat } from '@ai-sdk/react';
import type { FileUIPart, ToolUIPart } from 'ai';
import {
  CheckCircle2Icon,
  FileIcon,
  FolderIcon,
  Loader2Icon,
  PaperclipIcon,
  UploadIcon,
  XCircleIcon,
  XIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface RecentDocument {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  pageNum?: number;
}

interface Folder {
  id: string;
  name: string;
}

function DocumentStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'ready':
      return <CheckCircle2Icon className="size-4 text-green-500" />;
    case 'processing':
      return <Loader2Icon className="size-4 animate-spin text-yellow-500" />;
    case 'failed':
      return <XCircleIcon className="size-4 text-red-500" />;
    default:
      return <FileIcon className="size-4 text-muted-foreground" />;
  }
}

function isToolPart(part: unknown): part is ToolUIPart {
  return (
    !!part &&
    typeof part === 'object' &&
    'type' in part &&
    typeof (part as { type: unknown }).type === 'string' &&
    (part as { type: string }).type.startsWith('tool-')
  );
}

function ChatContent() {
  const { isConfigured, isLoaded, getHeaders, settings, updateSettings } = useSettings();
  const [input, setInput] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, status } = useChat();

  const [documents, setDocuments] = useState<RecentDocument[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<RecentDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);

  // Auto-open settings dialog when not configured
  useEffect(() => {
    if (isLoaded && !isConfigured) {
      setSettingsOpen(true);
    }
  }, [isLoaded, isConfigured]);

  const fetchDocuments = useCallback(async () => {
    setIsLoadingDocs(true);
    try {
      const res = await fetch('/api/documents', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.docs || []);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  }, [getHeaders]);

  const fetchFolders = useCallback(async () => {
    setIsLoadingFolders(true);
    try {
      const res = await fetch('/api/folders', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    } finally {
      setIsLoadingFolders(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    if (dropdownOpen && isConfigured) {
      fetchDocuments();
    }
  }, [dropdownOpen, fetchDocuments, isConfigured]);

  // Refresh documents when folderScope changes
  useEffect(() => {
    if (!isConfigured) return;

    const fetchDocs = async () => {
      setIsLoadingDocs(true);
      try {
        const res = await fetch('/api/documents', { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          setDocuments(data.docs || []);
        }
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      } finally {
        setIsLoadingDocs(false);
      }
    };

    fetchDocs();
  }, [settings.folderScope, isConfigured, getHeaders]);

  useEffect(() => {
    if (isConfigured && folders.length === 0) {
      fetchFolders();
    }
  }, [isConfigured, folders.length, fetchFolders]);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to upload document');
      }

      await fetchDocuments();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    e.target.value = '';
  };

  const toggleDocSelection = useCallback((doc: RecentDocument) => {
    setSelectedDocs((prev) => {
      const isSelected = prev.some((d) => d.id === doc.id);
      if (isSelected) {
        return prev.filter((d) => d.id !== doc.id);
      }
      return [...prev, doc];
    });
  }, []);

  const removeSelectedDoc = useCallback((docId: string) => {
    setSelectedDocs((prev) => prev.filter((d) => d.id !== docId));
  }, []);

  const handleFolderScopeChange = useCallback(
    (value: string) => {
      const folderScope = value === 'all' ? undefined : value;
      updateSettings({ ...settings, folderScope });
      setDocuments([]);
    },
    [settings, updateSettings],
  );

  const getFolderScopeLabel = useCallback(() => {
    if (!settings.folderScope) return 'All Folders';
    if (settings.folderScope === 'root') return 'Root Only';
    const folderId = settings.folderScope.replace('folder:', '');
    const folder = folders.find((f) => f.id === folderId);
    return folder?.name || 'Folder';
  }, [settings.folderScope, folders]);

  const handleSubmit = async (message: PromptInputMessage) => {
    const userText = message.text?.trim();
    if (!userText) return;

    const headers = getHeaders();

    if (selectedDocs.length === 0) {
      sendMessage({ text: userText }, { headers });
      setInput('');
      return;
    }

    setIsSending(true);
    try {
      const docNames = selectedDocs.map((d) => d.name);
      const res = await fetch('/api/documents/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ docNames }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch document details');
      }

      const data = await res.json();
      const docDetails = data.documents || [];

      const fileParts = docDetails.map((doc: Record<string, unknown>) => {
        const jsonContent = JSON.stringify(doc, null, 2);
        const base64Content = btoa(unescape(encodeURIComponent(jsonContent)));
        return {
          type: 'file' as const,
          mediaType: 'application/json',
          filename: `${doc.name || 'document'}.json`,
          url: `data:application/json;base64,${base64Content}`,
        };
      });

      sendMessage({ text: userText, files: fileParts }, { headers });
      setInput('');
      setSelectedDocs([]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      <main className="relative flex-1 overflow-hidden">
        <Conversation className="absolute inset-0">
          <ConversationContent className="mx-auto max-w-4xl">
            {messages.length === 0 && (
              <ConversationEmptyState
                title="Hello there!"
                description="How can I help you today?"
              />
            )}

            {messages.map((message) => {
              const fileParts = message.parts.filter(
                (part): part is FileUIPart => part.type === 'file',
              );
              const parsedDocs = fileParts.map((part) => {
                try {
                  if (part.url?.startsWith('data:application/json;base64,')) {
                    const base64 = part.url.replace('data:application/json;base64,', '');
                    const json = decodeURIComponent(escape(atob(base64)));
                    return JSON.parse(json) as { name?: string; description?: string };
                  }
                } catch {
                  // ignore parse errors
                }
                return { name: part.filename, description: '' };
              });
              return (
                <Message key={message.id} from={message.role}>
                  {message.role === 'user' && parsedDocs.length > 0 && (
                    <div className="ml-auto flex flex-wrap gap-2">
                      {parsedDocs.map((doc, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 rounded-md border border-border bg-muted/50 p-2 text-sm"
                        >
                          <FileIcon className="size-8 shrink-0 text-muted-foreground/50" />
                          <div className="flex flex-col gap-0.5">
                            <span className="max-w-48 truncate font-medium">{doc.name}</span>
                            {doc.description && (
                              <span className="max-w-48 line-clamp-2 text-xs text-muted-foreground">
                                {doc.description}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <MessageContent>
                    {message.parts.map((part, i) => {
                      if (part.type === 'text') {
                        return message.role === 'user' ? (
                          <span key={i}>{part.text}</span>
                        ) : (
                          <MessageResponse key={i}>{part.text}</MessageResponse>
                        );
                      }
                      if (isToolPart(part)) {
                        return (
                          <Tool key={i} defaultOpen={false}>
                            <ToolHeader type={part.type} state={part.state} />
                            <ToolContent>
                              <ToolInput input={part.input} />
                              {(part.output || part.errorText) && (
                                <ToolOutput output={part.output} errorText={part.errorText} />
                              )}
                            </ToolContent>
                          </Tool>
                        );
                      }
                      return null;
                    })}
                  </MessageContent>
                </Message>
              );
            })}

            {status === 'submitted' && (
              <Message from="assistant">
                <MessageContent>
                  <Shimmer className="text-muted-foreground text-sm">Thinking...</Shimmer>
                </MessageContent>
              </Message>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </main>

      <div className="sticky bottom-0 mx-auto w-full max-w-4xl bg-background pb-4">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.md"
          onChange={handleFileSelect}
        />

        <PromptInput onSubmit={handleSubmit}>
          {selectedDocs.length > 0 && (
            <PromptInputHeader className="flex-wrap gap-2 px-3 pt-2 pb-1">
              {selectedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1 text-sm"
                >
                  <FileIcon className="size-3.5 text-muted-foreground" />
                  <span className="max-w-32 truncate">{doc.name}</span>
                  <button
                    type="button"
                    onClick={() => removeSelectedDoc(doc.id)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                  >
                    <XIcon className="size-3" />
                  </button>
                </div>
              ))}
            </PromptInputHeader>
          )}

          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isConfigured ? 'Ask anything...' : 'Configure settings to start...'}
              disabled={!isConfigured}
              className="min-h-16 resize-none text-sm sm:text-base"
            />
          </PromptInputBody>

          <PromptInputFooter className="px-1 sm:px-2">
            <PromptInputTools>
              <PromptInputActionMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <PromptInputActionMenuTrigger
                  disabled={isUploading || !isConfigured}
                  className="ml-0.5 sm:ml-1 shrink-0 gap-1 rounded-full border border-border p-1 hover:bg-muted"
                >
                  {isUploading ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <PaperclipIcon className="size-4" />
                  )}
                </PromptInputActionMenuTrigger>
                <PromptInputActionMenuContent className="w-64">
                  <PromptInputActionMenuItem
                    onSelect={() => {
                      fileInputRef.current?.click();
                      setDropdownOpen(false);
                    }}
                  >
                    <UploadIcon className="mr-2 size-4" />
                    Upload new file...
                  </PromptInputActionMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Recent Documents</span>
                    {isLoadingDocs && <Loader2Icon className="size-3 animate-spin" />}
                  </DropdownMenuLabel>

                  {documents.length === 0 && !isLoadingDocs && (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      No documents yet
                    </div>
                  )}

                  {documents.map((doc) => {
                    const isSelected = selectedDocs.some((d) => d.id === doc.id);
                    return (
                      <PromptInputActionMenuItem
                        key={doc.id}
                        className="flex items-center justify-between"
                        onSelect={() => {
                          toggleDocSelection(doc);
                          setDropdownOpen(false);
                        }}
                      >
                        <span className={cn('truncate flex-1 mr-2', isSelected && 'font-medium')}>
                          {doc.name}
                        </span>
                        <div className="flex items-center gap-1">
                          {isSelected && <CheckCircle2Icon className="size-4 text-primary" />}
                          <DocumentStatusIcon status={doc.status} />
                        </div>
                      </PromptInputActionMenuItem>
                    );
                  })}
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>

              <Select
                value={settings.folderScope || 'all'}
                onValueChange={handleFolderScopeChange}
                disabled={!isConfigured || isLoadingFolders}
              >
                <SelectTrigger
                  size="sm"
                  className="h-7 w-auto gap-1 rounded-full border-border px-2"
                >
                  <FolderIcon className="size-3.5" />
                  <SelectValue>
                    <span className="max-w-24 truncate text-xs">{getFolderScopeLabel()}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="all">All Folders</SelectItem>
                  <SelectItem value="root">Root Only</SelectItem>
                  {folders.length > 0 && <SelectSeparator />}
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={`folder:${folder.id}`}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PromptInputTools>

            <div className="flex items-center gap-1">
              <SettingsButton onClick={() => setSettingsOpen(true)} />
              <PromptInputSubmit
                status={status === 'streaming' ? 'streaming' : 'ready'}
                disabled={!input.trim() || isSending || !isConfigured}
                className="m-1.5 sm:m-2 h-7 w-7 sm:h-8 sm:w-8 rounded-full"
              />
            </div>
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <SettingsProvider>
      <ChatContent />
    </SettingsProvider>
  );
}
