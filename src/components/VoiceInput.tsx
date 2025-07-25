
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { useToast } from "@/hooks/use-toast";

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  transcriptionUrl: string;
  bearerToken: string;
  sessionID: string;
  disabled?: boolean;
}

const VoiceInput = ({ 
  onTranscription, 
  transcriptionUrl, 
  bearerToken, 
  sessionID, 
  disabled 
}: VoiceInputProps) => {
  const { isRecording, isTranscribing, startRecording, stopRecording, transcribeAudio } = useVoiceRecording();
  const { toast } = useToast();

  const handleVoiceInput = async () => {
    if (!bearerToken) {
      toast({
        title: "Authentication Required",
        description: "Please configure your Bearer token in settings.",
        variant: "destructive",
      });
      return;
    }

    if (!transcriptionUrl) {
      toast({
        title: "Configuration Required",
        description: "Please configure the transcription webhook URL in settings.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isRecording) {
        // Stop recording and transcribe
        const audioBlob = await stopRecording();
        const transcription = await transcribeAudio(audioBlob, transcriptionUrl, bearerToken, sessionID);
        
        if (transcription.trim()) {
          onTranscription(transcription.trim());
        } else {
          toast({
            title: "No Speech Detected",
            description: "Please try recording again with clearer audio.",
            variant: "destructive",
          });
        }
      } else {
        // Start recording
        await startRecording();
      }
    } catch (error) {
      console.error('Voice input error:', error);
      toast({
        title: "Voice Input Failed",
        description: error instanceof Error ? error.message : 'Failed to process voice input',
        variant: "destructive",
      });
    }
  };

  const isProcessing = isRecording || isTranscribing;

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      onClick={handleVoiceInput}
      disabled={disabled || isTranscribing}
      className={`self-end ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : ''}`}
    >
      {isTranscribing ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Transcribing...</span>
        </div>
      ) : isRecording ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
};

export default VoiceInput;
