
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import VoiceInput from "./VoiceInput";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  transcriptionUrl: string;
  bearerToken: string;
  sessionID: string;
}

const ChatInput = ({ 
  onSendMessage, 
  disabled, 
  isLoading, 
  transcriptionUrl, 
  bearerToken, 
  sessionID 
}: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTranscription = (transcribedText: string) => {
    setMessage(transcribedText);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t bg-background">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
        disabled={disabled}
        className="min-h-[60px] max-h-[120px] resize-none"
      />
      <div className="flex flex-col gap-2">
        <VoiceInput
          onTranscription={handleTranscription}
          transcriptionUrl={transcriptionUrl}
          bearerToken={bearerToken}
          sessionID={sessionID}
          disabled={disabled}
        />
        <Button 
          type="submit" 
          disabled={!message.trim() || disabled || isLoading}
          size="lg"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

export default ChatInput;
