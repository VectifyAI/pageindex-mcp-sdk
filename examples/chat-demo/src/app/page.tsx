'use client';

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
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
import { DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useChat } from '@ai-sdk/react';
import type { FileUIPart } from 'ai';
import {
  CheckCircle2Icon,
  FileIcon,
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

export default function ChatPage() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<RecentDocument[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<RecentDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setIsLoadingDocs(true);
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.docs || []);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    if (dropdownOpen) {
      fetchDocuments();
    }
  }, [dropdownOpen, fetchDocuments]);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const uploadUrlRes = await fetch(
        `/api/upload?fileName=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(file.type)}`,
      );
      if (!uploadUrlRes.ok) {
        throw new Error('Failed to get upload URL');
      }
      const { uploadUrl, fileName } = await uploadUrlRes.json();

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadRes.ok) {
        throw new Error('Failed to upload file');
      }

      const submitRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }),
      });
      if (!submitRes.ok) {
        throw new Error('Failed to submit document');
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

  const handleSubmit = async (message: PromptInputMessage) => {
    const userText = message.text?.trim();
    if (!userText) return;

    if (selectedDocs.length === 0) {
      sendMessage({ text: userText });
      setInput('');
      return;
    }

    setIsSending(true);
    try {
      const docNames = selectedDocs.map((d) => d.name);
      const res = await fetch('/api/documents/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      sendMessage({
        text: userText,
        files: fileParts,
      });
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
              placeholder="Ask anything..."
              className="min-h-16 resize-none text-sm sm:text-base"
            />
          </PromptInputBody>

          <PromptInputFooter className="px-1 sm:px-2">
            <PromptInputTools>
              <PromptInputActionMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <PromptInputActionMenuTrigger
                  disabled={isUploading}
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
                    onSelect={(e) => {
                      e.preventDefault();
                      fileInputRef.current?.click();
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
                        onSelect={(e) => {
                          e.preventDefault();
                          toggleDocSelection(doc);
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
            </PromptInputTools>
            <PromptInputSubmit
              status={status === 'streaming' ? 'streaming' : 'ready'}
              disabled={!input.trim() || isSending}
              className="m-1.5 sm:m-2 h-7 w-7 sm:h-8 sm:w-8 rounded-full"
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
