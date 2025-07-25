
import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user';
  
  // Simple markdown-like formatting
  const formatContent = (content: string) => {
    // Split content by lines to preserve line breaks
    const lines = content.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Process bold text (**text**)
      let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Process italic text (*text*)
      processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      return (
        <span key={lineIndex}>
          <span dangerouslySetInnerHTML={{ __html: processedLine }} />
          {lineIndex < lines.length - 1 && <br />}
        </span>
      );
    });
  };
  
  return (
    <div className={cn(
      "flex w-full mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] rounded-lg px-4 py-3 shadow-sm",
        isUser 
          ? "bg-primary text-primary-foreground ml-12" 
          : "bg-muted text-muted-foreground mr-12"
      )}>
        <div className="whitespace-pre-wrap break-words">
          {formatContent(message.content)}
        </div>
        {message.model && !isUser && (
          <div className="text-xs opacity-60 mt-1">
            via {message.model}
          </div>
        )}
        <div className="text-xs opacity-60 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
