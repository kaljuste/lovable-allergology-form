import { useState, useRef, useEffect } from "react";
import { Message, ChatSession, ModelType, WebhookPayload, WebhookResponse } from "@/types/chat";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import ModelSelector from "./ModelSelector";
import TypingIndicator from "./TypingIndicator";
import ChatSettings from "./ChatSettings";
import { Button } from "@/components/ui/button";
import { Trash2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatMessageContent } from "@/utils/messageFormatter";

const ChatInterface = () => {
  const [currentSession, setCurrentSession] = useState<ChatSession>(() => ({
    id: `session-${Date.now()}`,
    messages: [],
    createdAt: new Date(),
    lastUpdated: new Date(),
  }));
  
  const [selectedModel, setSelectedModel] = useState<ModelType>('openai/gpt-4o');
  const [isLoading, setIsLoading] = useState(false);
  const [bearerToken, setBearerToken] = useState(() => 
    localStorage.getItem('chat-bearer-token') || ''
  );
  const [webhookUrl, setWebhookUrl] = useState(() => 
    localStorage.getItem('chat-webhook-url') || 'https://mbi.tail182f85.ts.net:8443/webhook/3aa86e27-3078-4723-8fa3-c6d73111fb4b'
  );
  const [transcriptionUrl, setTranscriptionUrl] = useState(() => 
    localStorage.getItem('chat-transcription-url') || 'https://mbi.tail182f85.ts.net:8443/webhook/lovablemzpertranscription453'
  );
  const [systemPrompt, setSystemPrompt] = useState(() => 
    localStorage.getItem('chat-system-prompt') || ''
  );
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('current-chat-session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setCurrentSession({
          ...session,
          createdAt: new Date(session.createdAt),
          lastUpdated: new Date(session.lastUpdated),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        });
      } catch (error) {
        console.error('Failed to load session:', error);
      }
    }
  }, []);

  // Save session to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('current-chat-session', JSON.stringify(currentSession));
  }, [currentSession]);

  // Save bearer token to localStorage
  useEffect(() => {
    localStorage.setItem('chat-bearer-token', bearerToken);
  }, [bearerToken]);

  // Save webhook URL to localStorage
  useEffect(() => {
    localStorage.setItem('chat-webhook-url', webhookUrl);
  }, [webhookUrl]);

  // Save transcription URL to localStorage
  useEffect(() => {
    localStorage.setItem('chat-transcription-url', transcriptionUrl);
  }, [transcriptionUrl]);

  // Save system prompt to localStorage
  useEffect(() => {
    localStorage.setItem('chat-system-prompt', systemPrompt);
  }, [systemPrompt]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession.messages, isLoading]);

  const addMessage = (content: string, role: 'user' | 'assistant', model?: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      content,
      role,
      timestamp: new Date(),
      model,
    };

    setCurrentSession(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage],
      lastUpdated: new Date(),
    }));
  };

  const sendWebhookRequest = async (payload: WebhookPayload): Promise<WebhookResponse> => {
    if (!bearerToken) {
      throw new Error('Bearer token not configured');
    }

    console.log('Sending webhook request:', payload);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  };

  const handleSendMessage = async (message: string) => {
    if (!bearerToken) {
      toast({
        title: "Authentication Required",
        description: "Please configure your Bearer token in settings.",
        variant: "destructive",
      });
      return;
    }

    addMessage(message, 'user');
    setIsLoading(true);

    try {
      const payload: WebhookPayload = {
        message,
        model: selectedModel,
        sessionID: currentSession.id,
        prompt: systemPrompt,
      };

      const response = await sendWebhookRequest(payload);
      const formattedContent = formatMessageContent(response.output);
      addMessage(formattedContent, 'assistant', selectedModel);
    } catch (error) {
      console.error('Webhook request failed:', error);
      
      toast({
        title: "Request Failed",
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: "destructive",
      });

      addMessage(
        "Sorry, I'm having trouble connecting to the AI service. Please check your configuration and try again.",
        'assistant'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setCurrentSession({
      id: `session-${Date.now()}`,
      messages: [],
      createdAt: new Date(),
      lastUpdated: new Date(),
    });
  };

  const getModelDisplayName = (model: string) => {
    const modelParts = model.split('/');
    if (modelParts.length === 2) {
      const [provider, modelName] = modelParts;
      return `${provider.toUpperCase()} ${modelName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
    }
    return model;
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">AI Chat</h1>
          <span className="text-sm text-muted-foreground">
            {getModelDisplayName(selectedModel)}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            disabled={isLoading}
          />
          <ChatSettings
            bearerToken={bearerToken}
            onBearerTokenChange={setBearerToken}
            webhookUrl={webhookUrl}
            onWebhookUrlChange={setWebhookUrl}
            transcriptionUrl={transcriptionUrl}
            onTranscriptionUrlChange={setTranscriptionUrl}
            systemPrompt={systemPrompt}
            onSystemPromptChange={setSystemPrompt}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentSession.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start a new conversation</h3>
            <p className="text-muted-foreground">
              Send a message to begin chatting with {getModelDisplayName(selectedModel)}
            </p>
          </div>
        ) : (
          <>
            {currentSession.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        isLoading={isLoading}
        transcriptionUrl={transcriptionUrl}
        bearerToken={bearerToken}
        sessionID={currentSession.id}
      />
    </div>
  );
};

export default ChatInterface;
