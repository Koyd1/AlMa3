import { useState, useRef } from "react";
import { Button } from "@/components/ui/button.jsx";
import { Upload, Mic, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const AudioUploader = ({ onTranscriptChange, onContextChange, onFileChange }) => {
  const [audioFile, setAudioFile] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите аудиофайл",
        variant: "destructive",
      });
      return;
    }

    setAudioFile(file);
    if (typeof onFileChange === "function") {
      onFileChange(file);
    }
    await transcribeAudio(file);
  };

  const transcribeAudio = async (file) => {
    setIsTranscribing(true);

    try {
      // TODO: Интеграция с реальным API транскрипции
      // Сейчас симулируем транскрипцию
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockTranscript = `Это тестовая транскрипция аудиофайла "${file.name}". В реальной системе здесь будет распознанный текст из аудио.`;

      onTranscriptChange(mockTranscript);
      onContextChange("Основные идеи из аудио");

      toast({
        title: "Транскрипция завершена",
        description: "Текст успешно извлечён из аудио",
      });
    } catch (error) {
      toast({
        title: "Ошибка транскрипции",
        description: "Не удалось обработать аудиофайл",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleRecord = () => {
    // TODO: Реализовать запись аудио через микрофон
    toast({
      title: "В разработке",
      description:
          "Функция записи с микрофона будет доступна в следующей версии",
    });
  };

  const removeFile = () => {
    setAudioFile(null);
    onTranscriptChange("");
    onContextChange("");
    if (typeof onFileChange === "function") {
      onFileChange(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
      <div className="space-y-4">
        <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
        />

        {!audioFile ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTranscribing}
                  className="h-auto py-6 flex-col gap-2 border-dashed border-2 hover:border-primary hover:bg-primary/5"
              >
                <Upload className="h-6 w-6 text-primary" />
                <span className="text-sm">Загрузить файл</span>
              </Button>

              <Button
                  variant="outline"
                  onClick={handleRecord}
                  disabled={isRecording || isTranscribing}
                  className="h-auto py-6 flex-col gap-2 border-dashed border-2 hover:border-primary hover:bg-primary/5"
              >
                <Mic className="h-6 w-6 text-accent" />
                <span className="text-sm">Записать аудио</span>
              </Button>
            </div>
        ) : (
            <div
                className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border",
                    isTranscribing ? "border-primary bg-primary/5" : "border-border bg-card"
                )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-primary flex-shrink-0" />
                  <p className="text-sm font-medium truncate">{audioFile.name}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(audioFile.size / 1024 / 1024).toFixed(2)} МБ
                </p>
              </div>

              {isTranscribing ? (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Транскрипция...</span>
                  </div>
              ) : (
                  <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
              )}
            </div>
        )}

        <p className="text-xs text-muted-foreground">
          Поддерживаемые форматы: MP3, WAV, M4A, OGG (макс. 25 МБ)
        </p>
      </div>
  );
};

export default AudioUploader;
