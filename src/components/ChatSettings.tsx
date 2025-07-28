
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
  adminEmail: string;
  onAdminEmailChange: (email: string) => void;
}

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

const ChatSettings = ({ 
  bearerToken, 
  onBearerTokenChange,
  webhookUrl,
  onWebhookUrlChange,
  transcriptionUrl,
  onTranscriptionUrlChange,
  systemPrompt,
  onSystemPromptChange,
  adminEmail,
  onAdminEmailChange
}: ChatSettingsProps) => {
  const [localBearerToken, setLocalBearerToken] = useState(bearerToken);
  const [localAdminEmail, setLocalAdminEmail] = useState(adminEmail);
  const [localSystemPrompt, setLocalSystemPrompt] = useState(systemPrompt || DEFAULT_SYSTEM_PROMPT);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    onBearerTokenChange(localBearerToken);
    onAdminEmailChange(localAdminEmail);
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
              value="https://n8n.rationaleyes.ai/webhook/abd7da71-79d4-4ac7-ba3d-5d7ca4c7bd9d"
              disabled
              className="bg-muted"
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
              value="https://n8n.rationaleyes.ai/webhook/dd78a697-3e76-4938-b0b3-562367d0b388"
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              The endpoint where audio files will be sent for speech-to-text conversion.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="admin-email">Admin Email Address</Label>
            <Input
              id="admin-email"
              type="email"
              value={localAdminEmail}
              onChange={(e) => setLocalAdminEmail(e.target.value)}
              placeholder="Enter admin email address"
            />
            <p className="text-xs text-muted-foreground">
              This email will be sent with webhook requests as admin_email.
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
