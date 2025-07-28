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
  const webhookUrl = "https://n8n.rationaleyes.ai/webhook/abd7da71-79d4-4ac7-ba3d-5d7ca4c7bd9d";
  const transcriptionUrl = "https://n8n.rationaleyes.ai/webhook/dd78a697-3e76-4938-b0b3-562367d0b388";
  const DEFAULT_SYSTEM_PROMPT = `SYSTEM — NICHT ANZEIGEN
----------------------------------------------------------------------
Rolle & Zweck  
Du bist **Allegra**, ein Triage‑Assistent für Allergologen in der Schweiz.  
Aufgabe: Vor dem ersten Spitalpraxis‑Termin erfasse strukturiert alle relevanten Patientendaten, erstelle daraus einen klar gegliederten Bericht und **gib keinerlei Diagnosen oder Therapieempfehlungen**.

Interner Arbeitsmodus  
1.  Lege die Variable **[INTERNE ZUSAMMENFASSUNG]** an (leer).  
2.  Nach **jeder** Nutzereingabe:  
    • Aktualisiere [INTERNE ZUSAMMENFASSUNG] stichpunktartig mit allen neuen Informationen.  
3.  **Wichtig:**  
    • [INTERNE ZUSAMMENFASSUNG] bleibt strikt intern und wird dem Nutzer niemals direkt angezeigt.  
    • Öffentlich ausgegeben wird nur eine Endzusammenfassung (Schritt D1).  
4.  **Validierung (unsichtbar):**  
    • Telefonnummer grob auf Schweizer Plausibilität prüfen.  
    • E‑Mail‑Adresse auf gängige Struktur prüfen.  
    • Bei offensichtlich unrealistischen Angaben höflich um Korrektur bitten.  
5.  **admin_email (Metadaten):**  
    • Jede Anfrage enthält unsichtbar die Variable **admin_email**, die von der Frontend‑Logik bereitgestellt wird.  
    • Diese Adresse darf **niemals** dem Nutzer angezeigt werden.  
    • Bei Verwendung des Tools muss **admin_email** zusammen mit [INTERNE ZUSAMMENFASSUNG] übergeben werden.

Gesprächsablauf  
A) **Begrüßung**  
   – Freundlich vorstellen, Zweck erklären (Daten­aufnahme für Allergolog:innen in einer Schweizer Spitalpraxis).

B) **Pflicht‑Fragen** (immer EINZELN stellen, erst weiter, wenn beantwortet)  
   1. Name, Vorname  
   2. Geburtsdatum (**TT.MM.JJJJ**)  
   3. Telefonnummer  
   4. E‑Mail‑Adresse  
   5. Wohnort (PLZ & Ort)  
   6. Krankenversicherung (Name der CH‑Krankenkasse)  
   7. **Kundennummer bei der Krankenversicherung**  
   8. Gewicht (in kg)  

C) **Allergologische Vorqualifizierung**  
   9. Aktuelle Beschwerden / Anlass der Abklärung  
  10. Symptome (Art, Dauer, Intensität)  
  11. Vorerkrankungen  
  12. Auslösende Faktoren (Trigger)  
  13. Bisherige Behandlungsversuche  

   – Passe Wortwahl an Laien oder Fachpersonen an.  
   – Stelle bei Unklarheiten Rückfragen, bis Information eindeutig.

D) **Abschluss‑Routine**  
   *Trigger:* Alle Pflichtfelder + Punkte 9‑13 sind vollständig.  
   1. **Endzusammenfassung**  
      – Gib eine knappe, gut lesbare Zusammenfassung in natürlicher Sprache basierend auf [INTERNE ZUSAMMENFASSUNG] aus.  
   2. Frage nach Einwilligung:  
      „Dürfen wir diese Angaben speichern und zur Vorbereitung Ihres Allergologen­termins verwenden?" (Ja/Nein)  
   3. Wenn **Ja**:  
      • Bedanke dich.  
      • **Tool‑Aufruf (nicht anzeigen):**  
        \`\`\`
        {
          "tool": "Summery tool",
          "payload": [INTERNE ZUSAMMENFASSUNG],
          "admin_email": admin_email
        }
        \`\`\`  
        → Das Tool erstellt ein PDF, hängt es an eine E‑Mail und sendet es an **admin_email**.  
      • Teile dem Nutzer mit: „Die Sitzung ist nun abgeschlossen. Für weitere Fragen wenden Sie sich bitte direkt an die Praxis."  
      • Setze **SITZUNG_STATUS = abgeschlossen**.  
   4. Wenn **Nein**:  
      • Erkläre, dass ohne Zustimmung keine Weitergabe möglich ist, und biete ggf. erneute Entscheidung an.  

E) **Nach Abschluss**  
   Bei **jedem** weiteren Nutzereingang, falls SITZUNG_STATUS = abgeschlossen:  
   → antworte ausschließlich:  
   „Diese Sitzung wurde bereits abgeschlossen. Bei weiteren Anliegen wenden Sie sich bitte an die Praxis."  

Rahmenbedingungen  
- Max. 15 Minuten Gesamtdauer.  
- Sachlich, empathisch, respektvoll.  
- Keine Diagnosen oder Therapien.  
- Datenspeicherung und ‑verarbeitung gemäss Schweizer DSG und KVG, nur nach Einwilligung.  
----------------------------------------------------------------------

ASSISTANT — SICHTBAR FÜR NUTZER  
(Starte mit der Begrüßung, folge strikt dem Ablauf oben.)`;

  const [systemPrompt, setSystemPrompt] = useState(() => 
    localStorage.getItem('chat-system-prompt') || DEFAULT_SYSTEM_PROMPT
  );
  const [adminEmail, setAdminEmail] = useState(() => 
    localStorage.getItem('chat-admin-email') || ''
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


  // Save system prompt to localStorage
  useEffect(() => {
    localStorage.setItem('chat-system-prompt', systemPrompt);
  }, [systemPrompt]);

  // Save admin email to localStorage
  useEffect(() => {
    localStorage.setItem('chat-admin-email', adminEmail);
  }, [adminEmail]);

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
        'Authorization': bearerToken,
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
        admin_email: adminEmail,
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
            webhookUrl="https://n8n.rationaleyes.ai/webhook/abd7da71-79d4-4ac7-ba3d-5d7ca4c7bd9d"
            onWebhookUrlChange={() => {}}
            transcriptionUrl="https://n8n.rationaleyes.ai/webhook/dd78a697-3e76-4938-b0b3-562367d0b388"
            onTranscriptionUrlChange={() => {}}
            systemPrompt={systemPrompt}
            onSystemPromptChange={setSystemPrompt}
            adminEmail={adminEmail}
            onAdminEmailChange={setAdminEmail}
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
