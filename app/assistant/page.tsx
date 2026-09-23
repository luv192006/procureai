'use client';

import { useState, useRef, useEffect } from 'react';
import { Brain, Send, Sparkles, User, TrendingUp, ShieldAlert, DollarSign, Package, FileText } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { answerAssistantQuestion } from '@/lib/ai';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const suggestedQuestions = [
  { icon: ShieldAlert, text: 'Which suppliers are high risk?', color: 'text-destructive' },
  { icon: FileText, text: 'Which RFQ has the best quotation?', color: 'text-primary' },
  { icon: DollarSign, text: 'Where can we reduce procurement costs?', color: 'text-success' },
  { icon: TrendingUp, text: 'Should we buy steel now?', color: 'text-warning' },
  { icon: Package, text: 'What is our inventory status?', color: 'text-chart-2' },
  { icon: Sparkles, text: 'What are your top recommendations?', color: 'text-chart-4' },
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your AI procurement assistant. I can analyze your procurement data and answer questions about suppliers, RFQs, quotations, spend, inventory, price forecasts, and risk.\n\nTry one of the suggested questions below, or ask me anything about your procurement operations.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = answerAssistantQuestion(text);
      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('• ') || line.match(/^\d+\.\s/)) {
        return (
          <p key={i} className="ml-2 text-sm leading-relaxed">
            {line.split('**').map((part, j) =>
              j % 2 === 1 ? <strong key={j} className="font-semibold text-foreground">{part}</strong> : part
            )}
          </p>
        );
      }
      if (line.trim() === '') return <div key={i} className="h-2" />;
      return (
        <p key={i} className="text-sm leading-relaxed">
          {line.split('**').map((part, j) =>
            j % 2 === 1 ? <strong key={j} className="font-semibold text-foreground">{part}</strong> : part
          )}
        </p>
      );
    });
  };

  return (
    <AppShell title="AI Assistant">
      <div className="mx-auto max-w-4xl">
        {/* Chat Container */}
        <Card className="flex h-[calc(100vh-12rem)] flex-col border-border bg-card/40 backdrop-blur-sm animate-fade-up overflow-hidden">
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 lg:p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex gap-3 animate-fade-up', msg.role === 'user' && 'flex-row-reverse')}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    msg.role === 'assistant'
                      ? 'bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/20'
                      : 'bg-secondary/50'
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <Brain className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl border px-4 py-3',
                    msg.role === 'assistant'
                      ? 'border-border bg-card/60 backdrop-blur-sm'
                      : 'border-primary/30 bg-primary/10'
                  )}
                >
                  <div className="space-y-1">{formatMessage(msg.content)}</div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3 animate-fade-in">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/20">
                  <Brain className="h-4 w-4 animate-pulse text-primary-foreground" />
                </div>
                <div className="rounded-2xl border border-border bg-card/60 px-4 py-3 backdrop-blur-sm">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <div className="border-t border-border p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Suggested Questions</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {suggestedQuestions.map((q) => {
                  const Icon = q.icon;
                  return (
                    <button
                      key={q.text}
                      onClick={() => sendMessage(q.text)}
                      className="flex items-center gap-3 rounded-xl border border-border bg-secondary/20 p-3 text-left text-sm transition-all hover:border-primary/30 hover:bg-primary/5"
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', q.color)} />
                      <span className="text-foreground">{q.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about suppliers, spend, inventory, risk..."
                className="flex-1 rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <Button type="submit" disabled={!input.trim() || isTyping} className="rounded-xl px-4">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
