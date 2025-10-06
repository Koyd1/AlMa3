//New code:
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Sparkles, ArrowLeft, Play } from "lucide-react";
import AudioUploader from "@/components/AudioUploader";
import AgentSelector from "@/components/AgentSelector";
import { useAuth } from "@/hooks/useAuth";
import { useCampaigns } from "@/hooks/useCampaigns.jsx";

const DEFAULT_AGENT_IDS = [
  "analyst_icp",
  "ideator_concepts",
  "finance_assessment",
  "technician_blueprint",
  "copywriter_texts",
];

const CampaignWorkspace = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { createCampaign, isCreating } = useCampaigns();

  const [title, setTitle] = useState("");
  const [orchestratorPrompt, setOrchestratorPrompt] = useState("");
  const [notes, setNotes] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [audioTranscript, setAudioTranscript] = useState("");
  const [audioContext, setAudioContext] = useState("");
  const [selectedAgents, setSelectedAgents] = useState(() => [...DEFAULT_AGENT_IDS]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleLaunch = async () => {
    if (!title.trim()) return;

    try {
      const result = await createCampaign({
        title: title.trim(),
        orchestrator_prompt: orchestratorPrompt || null,
        additional_notes: notes || null,
        audio_transcript: audioTranscript || null,
        audio_context_request: audioContext || null,
        selected_agents: selectedAgents,
        audio_file: audioFile ?? null,
      });
      console.log("✅ Campaign launched:", result);
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Ошибка запуска кампании:", err);
      alert("Ошибка при запуске кампании. Проверьте консоль.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI Orchestrator
            </span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
            Новая кампания
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Настройте параметры и запустите AI-агентов для работы над проектом
          </p>
        </div>

        <div className="space-y-6 md:space-y-8">
          {/* 1. Название */}
          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <Label htmlFor="title" className="text-base md:text-lg font-semibold mb-2 block">
              1. Название проекта
            </Label>
            <Input
              id="title"
              placeholder="Введите название кампании..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* 2. Промпт */}
          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <Label
              htmlFor="orchestrator-prompt"
              className="text-base md:text-lg font-semibold mb-2 block"
            >
              2. Промпт для оркестратора
            </Label>
            <Textarea
              id="orchestrator-prompt"
              placeholder="Опишите цели и задачи кампании..."
              value={orchestratorPrompt}
              onChange={(e) => setOrchestratorPrompt(e.target.value)}
              className="mt-2 min-h-[100px] md:min-h-[120px]"
            />
          </div>

          {/* 3. Заметки */}
          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <Label
              htmlFor="notes"
              className="text-base md:text-lg font-semibold mb-2 block"
            >
              3. Дополнительные заметки
            </Label>
            <Textarea
              id="notes"
              placeholder="Добавьте любые дополнительные детали..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 min-h-[80px] md:min-h-[100px]"
            />
          </div>

          {/* 4. Аудио */}
          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <Label className="text-base md:text-lg font-semibold mb-2 block">
              4. Загрузить аудио
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              Загрузите аудиофайл для транскрипции и анализа встречи
            </p>
            <AudioUploader
              onFileChange={setAudioFile}
              onTranscriptChange={setAudioTranscript}
              onContextChange={setAudioContext}
            />
          </div>

          {/* 5. Контекст из аудио */}
          {audioTranscript && (
            <div className="bg-card border border-border rounded-lg p-4 md:p-6">
              <Label
                htmlFor="audio-context"
                className="text-base md:text-lg font-semibold mb-2 block"
              >
                5. Что взять из аудио
              </Label>
              <Textarea
                id="audio-context"
                placeholder="Укажите, какие части аудио использовать..."
                value={audioContext}
                onChange={(e) => setAudioContext(e.target.value)}
                className="mt-2 min-h-[80px]"
              />
              <div className="mt-3 p-3 bg-muted/50 rounded text-sm">
                <p className="font-medium mb-1">Транскрипция:</p>
                <p className="text-muted-foreground line-clamp-3">
                  {audioTranscript}
                </p>
              </div>
            </div>
          )}

          {/* 6. Агенты */}
          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <Label className="text-base md:text-lg font-semibold mb-2 block">
              {audioTranscript ? "6" : "5"}. Выбор AI-агентов
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              Выберите агентов, которые будут работать над проектом
            </p>
            <AgentSelector
              selectedAgents={selectedAgents}
              onSelectionChange={setSelectedAgents}
            />
          </div>

          {/* 7. Кнопки */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/dashboard")}
              className="border-border hover:bg-muted w-full sm:w-auto"
            >
              Отменить
            </Button>
            <Button
              size="lg"
              onClick={handleLaunch}
              disabled={isCreating || !title.trim()}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 w-full sm:w-auto"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full mr-2" />
                  Запуск...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Запустить кампанию
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignWorkspace;


//Old code:
// import { useState, useEffect } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { Button } from "@/components/ui/button.jsx";
// import { Input } from "@/components/ui/input.jsx";
// import { Label } from "@/components/ui/label.jsx";
// import { Textarea } from "@/components/ui/textarea.jsx";
// import { Sparkles, ArrowLeft, Play } from "lucide-react";
// import AudioUploader from "@/components/AudioUploader";
// import AgentSelector from "@/components/AgentSelector";
// import { useAuth } from "@/hooks/useAuth";
// import { useCampaigns } from "@/hooks/useCampaigns.jsx";

// const CampaignWorkspace = () => {
//   const navigate = useNavigate();
//   const { user, loading: authLoading } = useAuth();
//   const { createCampaign, isCreating } = useCampaigns();

//   const [title, setTitle] = useState("");
//   const [orchestratorPrompt, setOrchestratorPrompt] = useState("");
//   const [notes, setNotes] = useState("");
//   const [audioTranscript, setAudioTranscript] = useState("");
//   const [audioContext, setAudioContext] = useState("");
//   const [selectedAgents, setSelectedAgents] = useState([]);

//   useEffect(() => {
//     if (!authLoading && !user) {
//       navigate("/auth");
//     }
//   }, [user, authLoading, navigate]);

//   const handleLaunch = () => {
//     if (!title.trim()) {
//       return;
//     }

//     createCampaign({
//       title,
//       orchestrator_prompt: orchestratorPrompt || null,
//       additional_notes: notes || null,
//       audio_transcript: audioTranscript || null,
//       audio_context_request: audioContext || null,
//       selected_agents: selectedAgents,
//       status: "draft",
//     });

//     navigate("/dashboard");
//   };

//   return (
//       <div className="min-h-screen bg-background">
//         {/* Header */}
//         <header className="border-b border-border backdrop-blur-sm sticky top-0 z-50 bg-background/80">
//           <div className="container mx-auto px-4 py-4 flex justify-between items-center">
//             <Link to="/dashboard" className="flex items-center gap-2">
//               <ArrowLeft className="h-5 w-5" />
//               <Sparkles className="h-6 w-6 text-primary" />
//               <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
//               AI Orchestrator
//             </span>
//             </Link>
//           </div>
//         </header>

//         <div className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
//           <div className="mb-6 md:mb-8">
//             <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
//               Новая кампания
//             </h1>
//             <p className="text-muted-foreground text-sm md:text-base">
//               Настройте параметры и запустите AI-агентов для работы над проектом
//             </p>
//           </div>

//           <div className="space-y-6 md:space-y-8">
//             {/* Название проекта */}
//             <div className="bg-card border border-border rounded-lg p-4 md:p-6">
//               <Label
//                   htmlFor="title"
//                   className="text-base md:text-lg font-semibold mb-2 block"
//               >
//                 1. Название проекта
//               </Label>
//               <Input
//                   id="title"
//                   placeholder="Введите название кампании..."
//                   value={title}
//                   onChange={(e) => setTitle(e.target.value)}
//                   className="mt-2"
//               />
//             </div>

//             {/* Промпт для оркестратора */}
//             <div className="bg-card border border-border rounded-lg p-4 md:p-6">
//               <Label
//                   htmlFor="orchestrator-prompt"
//                   className="text-base md:text-lg font-semibold mb-2 block"
//               >
//                 2. Промпт для оркестратора
//               </Label>
//               <Textarea
//                   id="orchestrator-prompt"
//                   placeholder="Опишите цели и задачи кампании..."
//                   value={orchestratorPrompt}
//                   onChange={(e) => setOrchestratorPrompt(e.target.value)}
//                   className="mt-2 min-h-[100px] md:min-h-[120px]"
//               />
//             </div>

//             {/* Дополнительные заметки */}
//             <div className="bg-card border border-border rounded-lg p-4 md:p-6">
//               <Label
//                   htmlFor="notes"
//                   className="text-base md:text-lg font-semibold mb-2 block"
//               >
//                 3. Дополнительные заметки
//               </Label>
//               <Textarea
//                   id="notes"
//                   placeholder="Добавьте любые дополнительные детали..."
//                   value={notes}
//                   onChange={(e) => setNotes(e.target.value)}
//                   className="mt-2 min-h-[80px] md:min-h-[100px]"
//               />
//             </div>

//             {/* Загрузка аудио */}
//             <div className="bg-card border border-border rounded-lg p-4 md:p-6">
//               <Label className="text-base md:text-lg font-semibold mb-2 block">
//                 4. Загрузить аудио
//               </Label>
//               <p className="text-sm text-muted-foreground mb-4">
//                 Загрузите аудиофайл для транскрипции и извлечения контекста
//               </p>
//               <AudioUploader
//                   onTranscriptChange={setAudioTranscript}
//                   onContextChange={setAudioContext}
//               />
//             </div>

//             {/* Что взять из аудио */}
//             {audioTranscript && (
//                 <div className="bg-card border border-border rounded-lg p-4 md:p-6">
//                   <Label
//                       htmlFor="audio-context"
//                       className="text-base md:text-lg font-semibold mb-2 block"
//                   >
//                     5. Что взять из аудио
//                   </Label>
//                   <Textarea
//                       id="audio-context"
//                       placeholder="Укажите, какие части аудио использовать..."
//                       value={audioContext}
//                       onChange={(e) => setAudioContext(e.target.value)}
//                       className="mt-2 min-h-[80px]"
//                   />
//                   <div className="mt-3 p-3 bg-muted/50 rounded text-sm">
//                     <p className="font-medium mb-1">Транскрипция:</p>
//                     <p className="text-muted-foreground line-clamp-3">
//                       {audioTranscript}
//                     </p>
//                   </div>
//                 </div>
//             )}

//             {/* Выбор AI-агентов */}
//             <div className="bg-card border border-border rounded-lg p-4 md:p-6">
//               <Label className="text-base md:text-lg font-semibold mb-2 block">
//                 {audioTranscript ? "6" : "5"}. Выбор AI-агентов
//               </Label>
//               <p className="text-sm text-muted-foreground mb-4">
//                 Выберите агентов, которые будут работать над проектом
//               </p>
//               <AgentSelector
//                   selectedAgents={selectedAgents}
//                   onSelectionChange={setSelectedAgents}
//               />
//             </div>

//             {/* Кнопка запуска */}
//             <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4">
//               <Button
//                   variant="outline"
//                   size="lg"
//                   onClick={() => navigate("/dashboard")}
//                   className="border-border hover:bg-muted w-full sm:w-auto"
//               >
//                 Отменить
//               </Button>
//               <Button
//                   size="lg"
//                   onClick={handleLaunch}
//                   disabled={isCreating || !title.trim()}
//                   className="bg-gradient-to-r from-primary to-accent hover:opacity-90 w-full sm:w-auto"
//               >
//                 {isCreating ? (
//                     <>
//                       <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full mr-2" />
//                       Запуск...
//                     </>
//                 ) : (
//                     <>
//                       <Play className="h-4 w-4 mr-2" />
//                       Запустить кампанию
//                     </>
//                 )}
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>
//   );
// };

// export default CampaignWorkspace;
