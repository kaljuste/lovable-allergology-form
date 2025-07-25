
import { cn } from "@/lib/utils";

const TypingIndicator = () => {
  return (
    <div className="flex justify-start w-full mb-4">
      <div className="bg-muted text-muted-foreground rounded-lg px-4 py-3 mr-12 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="text-sm">AI is typing</span>
          <div className="flex gap-1 ml-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 bg-current rounded-full animate-pulse",
                  `animation-delay-${i * 200}ms`
                )}
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
