'use client';

import { MessageContent, MessageResponse } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';
import { SparklesIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useChat } from '@ai-sdk/react';
import { ArrowDownIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

function Greeting() {
  return (
    <div className="mx-auto flex size-full max-w-3xl flex-col justify-center px-4 md:mt-16 md:px-8">
      <div className="animate-in fade-in duration-500 fill-mode-forwards font-semibold text-xl md:text-2xl">
        Hello there!
      </div>
      <div className="animate-in fade-in duration-500 delay-100 fill-mode-forwards text-xl text-zinc-500 md:text-2xl">
        How can I help you today?
      </div>
    </div>
  );
}

function ThinkingMessage() {
  return (
    <div className="group/message fade-in w-full animate-in duration-300" data-role="assistant">
      <div className="flex items-start justify-start gap-3">
        <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
          <div className="animate-pulse">
            <SparklesIcon size={14} />
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 md:gap-4">
          <div className="flex items-center gap-1 p-0 text-muted-foreground text-sm">
            <span className="animate-pulse">Thinking</span>
            <span className="inline-flex">
              <span className="animate-bounce [animation-delay:0ms]">.</span>
              <span className="animate-bounce [animation-delay:150ms]">.</span>
              <span className="animate-bounce [animation-delay:300ms]">.</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewMessage({
  message,
}: {
  message: { id: string; role: string; parts: Array<{ type: string; text?: string }> };
  isLoading: boolean;
}) {
  return (
    <div className="group/message fade-in w-full animate-in duration-200" data-role={message.role}>
      <div
        className={cn('flex w-full items-start gap-2 md:gap-3', {
          'justify-end': message.role === 'user',
          'justify-start': message.role === 'assistant',
        })}
      >
        {message.role === 'assistant' && (
          <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
            <SparklesIcon size={14} />
          </div>
        )}

        <div
          className={cn('flex flex-col', {
            'gap-2 md:gap-4': message.parts?.some((p) => p.type === 'text' && p.text?.trim()),
          })}
        >
          {message.parts.map((part, i) => {
            if (part.type === 'text') {
              if (message.role === 'user') {
                return (
                  <div
                    key={`${message.id}-${i}`}
                    className="rounded-xl bg-primary px-4 py-2.5 text-primary-foreground"
                  >
                    {part.text}
                  </div>
                );
              }
              return (
                <MessageContent key={`${message.id}-${i}`} className="px-0 py-0 bg-transparent">
                  <MessageResponse>{part.text}</MessageResponse>
                </MessageContent>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom('instant');
    }
  }, [messages, isAtBottom, scrollToBottom]);

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text?.trim()) return;
    sendMessage({ text: message.text });
    setInput('');
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background px-4 py-3">
        <h1 className="font-semibold text-lg">PageIndex Chat Demo</h1>
      </header>

      <main className="relative flex-1 overflow-hidden">
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="absolute inset-0 touch-pan-y overflow-y-auto"
        >
          <div className="mx-auto flex min-w-0 max-w-4xl flex-col gap-4 px-2 py-4 md:gap-6 md:px-4">
            {messages.length === 0 && <Greeting />}

            {messages.map((message, index) => (
              <PreviewMessage
                key={message.id}
                message={message}
                isLoading={status === 'streaming' && messages.length - 1 === index}
              />
            ))}

            {status === 'submitted' && <ThinkingMessage />}

            <div ref={messagesEndRef} className="min-h-[24px] min-w-[24px] shrink-0" />
          </div>
        </div>

        <button
          type="button"
          aria-label="Scroll to bottom"
          onClick={() => scrollToBottom('smooth')}
          className={cn(
            'absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border bg-background p-2 shadow-lg transition-all hover:bg-muted',
            isAtBottom
              ? 'pointer-events-none scale-0 opacity-0'
              : 'pointer-events-auto scale-100 opacity-100',
          )}
        >
          <ArrowDownIcon className="size-4" />
        </button>
      </main>

      <div className="sticky bottom-0 mx-auto w-full max-w-4xl border-t bg-background p-4">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="min-h-[48px]"
          />
          <PromptInputSubmit
            status={status === 'streaming' ? 'streaming' : 'ready'}
            disabled={!input.trim()}
          />
        </PromptInput>
      </div>
    </div>
  );
}
