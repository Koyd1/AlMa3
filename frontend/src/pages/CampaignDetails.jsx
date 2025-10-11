import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit,
  Save,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useToast } from "@/hooks/use-toast";

const CampaignDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { campaigns, isLoading, updateCampaign } = useCampaigns();
  const { toast } = useToast();

  const [campaign, setCampaign] = useState(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (campaigns && id) {
      const found = campaigns.find((c) => c.id === id);
      if (found) {
        setCampaign(found);
        setNotes(found.additional_notes || "");
      } else {
        toast({
          title: "Ошибка",
          description: "Кампания не найдена",
          variant: "destructive",
        });
        navigate("/dashboard");
      }
    }
  }, [campaigns, id, navigate, toast]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "processing":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "Завершена";
      case "processing":
        return "В процессе";
      case "failed":
        return "Ошибка";
      default:
        return "Черновик";
    }
  };

  const handleSaveNotes = () => {
    if (campaign) {
      updateCampaign({
        id: campaign.id,
        updates: { additional_notes: notes },
      });
      setIsEditingNotes(false);
    }
  };

  if (authLoading || isLoading || !campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI Orchestrator
            </span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="border-primary/50 hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            К списку кампаний
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Campaign Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {getStatusIcon(campaign.status)}
            <h1 className="text-3xl md:text-4xl font-bold">{campaign.title}</h1>
            <Badge
              variant={
                campaign.status === "completed" ? "default" : "secondary"
              }
            >
              {getStatusText(campaign.status)}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>
              Создана:{" "}
              {new Date(campaign.created_at).toLocaleString("ru-RU")}
            </span>
            <span>
              Обновлена:{" "}
              {new Date(campaign.updated_at).toLocaleString("ru-RU")}
            </span>
            {campaign.selected_agents &&
              campaign.selected_agents.length > 0 && (
                <span>Агентов: {campaign.selected_agents.length}</span>
              )}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Orchestrator Prompt */}
          {campaign.orchestrator_prompt && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-3">
                Промпт оркестратора
              </h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {campaign.orchestrator_prompt}
              </p>
            </div>
          )}

          {/* Audio Transcript */}
          {campaign.audio_transcript && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-3">Транскрипт аудио</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {campaign.audio_transcript}
              </p>
            </div>
          )}

          {/* Audio Context Request */}
          {campaign.audio_context_request && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-3">
                Контекстный запрос из аудио
              </h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {campaign.audio_context_request}
              </p>
            </div>
          )}

          {/* Additional Notes */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Дополнительные заметки</h2>
              {!isEditingNotes ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingNotes(true)}
                  className="border-primary/50 hover:bg-primary/10"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Редактировать
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveNotes}
                  className="bg-gradient-to-r from-primary to-accent"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Сохранить
                </Button>
              )}
            </div>
            {isEditingNotes ? (
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Добавьте заметки или дополнительный контекст..."
                className="min-h-[150px]"
              />
            ) : (
              <p className="text-muted-foreground whitespace-pre-wrap">
                {campaign.additional_notes || "Заметок пока нет"}
              </p>
            )}
          </div>

          {/* Selected Agents */}
          {campaign.selected_agents && campaign.selected_agents.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-3">Выбранные агенты</h2>
              <div className="flex flex-wrap gap-2">
                {campaign.selected_agents.map((agent, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {agent}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Artifacts Path */}
          {campaign.artifacts_path && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-3">Артефакты</h2>
              <p className="text-muted-foreground mb-4">
                Путь к артефактам:{" "}
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {campaign.artifacts_path}
                </code>
              </p>
              <Button
                variant="outline"
                className="border-primary/50 hover:bg-primary/10"
              >
                Скачать артефакты
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              disabled={campaign.status === "processing"}
            >
              Перегенерировать
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary/50 hover:bg-primary/10"
              onClick={() => navigate("/dashboard")}
            >
              Назад к списку
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;
