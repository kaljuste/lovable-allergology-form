
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatSettingsProps {
  bearerToken: string;
  onBearerTokenChange: (token: string) => void;
  webhookUrl: string;
  onWebhookUrlChange: (url: string) => void;
  transcriptionUrl: string;
  onTranscriptionUrlChange: (url: string) => void;
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
}

const ChatSettings = ({ 
  bearerToken, 
  onBearerTokenChange,
  webhookUrl,
  onWebhookUrlChange,
  transcriptionUrl,
  onTranscriptionUrlChange,
  systemPrompt,
  onSystemPromptChange
}: ChatSettingsProps) => {
  const [localBearerToken, setLocalBearerToken] = useState(bearerToken);
  const [localWebhookUrl, setLocalWebhookUrl] = useState(webhookUrl);
  const [localTranscriptionUrl, setLocalTranscriptionUrl] = useState(transcriptionUrl);
  const [localSystemPrompt, setLocalSystemPrompt] = useState(systemPrompt);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    onBearerTokenChange(localBearerToken);
    onWebhookUrlChange(localWebhookUrl);
    onTranscriptionUrlChange(localTranscriptionUrl);
    onSystemPromptChange(localSystemPrompt);
    setIsOpen(false);
    toast({
      title: "Settings saved",
      description: "Your configuration has been updated.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chat Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="bearer-token">Bearer Token</Label>
            <Input
              id="bearer-token"
              type="password"
              value={localBearerToken}
              onChange={(e) => setLocalBearerToken(e.target.value)}
              placeholder="Enter your authentication token"
            />
            <p className="text-xs text-muted-foreground">
              This token will be used for authentication with webhooks.
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="webhook-url">Chat Webhook URL</Label>
            <Input
              id="webhook-url"
              type="url"
              value={localWebhookUrl}
              onChange={(e) => setLocalWebhookUrl(e.target.value)}
              placeholder="Enter chat webhook URL"
            />
            <p className="text-xs text-muted-foreground">
              The endpoint where chat messages will be sent for AI processing.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="transcription-url">Voice Transcription Webhook URL</Label>
            <Input
              id="transcription-url"
              type="url"
              value={localTranscriptionUrl}
              onChange={(e) => setLocalTranscriptionUrl(e.target.value)}
              placeholder="Enter transcription webhook URL"
            />
            <p className="text-xs text-muted-foreground">
              The endpoint where audio files will be sent for speech-to-text conversion.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="system-prompt">System Prompt</Label>
            <Textarea
              id="system-prompt"
              value={localSystemPrompt}
              onChange={(e) => setLocalSystemPrompt(e.target.value)}
              placeholder="Enter system prompt instructions..."
              className="min-h-[200px] resize-y"
            />
            <p className="text-xs text-muted-foreground">
              Define the AI's behavior and instructions. This will be sent with every message.
            </p>
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatSettings;
