import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import {
  Sparkles,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit,
  Save,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useToast } from "@/hooks/use-toast";
import { useCampaignResults } from "@/hooks/useCampaignResults";

const STEP_ORDER = [
  "manager_plan",
  "analyst_icp",
  "ideator_concepts",
  "finance_assessment",
  "technician_blueprint",
  "copywriter_texts",
  "manager_summary",
];

const CampaignDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { user, loading: authLoading } = useAuth();
  const {
    campaigns,
    isLoading: campaignsLoading,
    updateCampaign,
    regenerateCampaign,
    isRegenerating,
    refetch,
  } = useCampaigns();
  const { toast } = useToast();

  const {
    groupedResults,
    availableVersions,
    latestVersion,
    isLoading: resultsLoading,
    error: resultsError,
    refetch: refetchResults,
  } = useCampaignResults(id);

  const [campaign, setCampaign] = useState(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedVersion, setSelectedVersion] = useState(undefined);
  const [regenerationPrompt, setRegenerationPrompt] = useState("");

  const promptRef = useRef(null);
  const promptAnchorRef = useRef(null);
  const promptDirtyRef = useRef(false);
  const resultsErrorNotifiedRef = useRef(false);

  const wantsRegenerateFocus = searchParams.get("mode") === "regenerate";

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (resultsError && !resultsErrorNotifiedRef.current) {
      toast({
        title: "Ошибка загрузки результатов",
        description:
          resultsError.message || "Не удалось получить данные по версиям",
        variant: "destructive",
      });
      resultsErrorNotifiedRef.current = true;
    }
    if (!resultsError) {
      resultsErrorNotifiedRef.current = false;
    }
  }, [resultsError, toast]);

  useEffect(() => {
    if (authLoading || campaignsLoading || !id) return;

    const list = Array.isArray(campaigns) ? campaigns : [];
    const found = list.find((c) => c.id === id);
    if (found) {
      setCampaign(found);
      setNotes(found.additional_notes || "");

      setSelectedVersion((prev) =>
        prev === undefined ? found.version ?? 1 : prev
      );

      setRegenerationPrompt((prev) => {
        if (
          !prev ||
          promptAnchorRef.current === null ||
          (found.version ?? 1) > (promptAnchorRef.current ?? 0)
        ) {
          promptAnchorRef.current = found.version ?? 1;
          promptDirtyRef.current = false;
          return found.orchestrator_prompt || "";
        }
        return prev;
      });
    } else {
      toast({
        title: "Ошибка",
        description: "Кампания не найдена",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [authLoading, campaigns, campaignsLoading, id, navigate, toast]);

  useEffect(() => {
    if (!campaign) return;
    const latest = latestVersion ?? campaign.version ?? 1;
    setSelectedVersion((prev) => {
      if (prev === undefined) return latest;
      if (latest > prev) return latest;
      return prev;
    });
  }, [campaign, latestVersion]);

  useEffect(() => {
    if (!campaign || !selectedVersion) return;
    if (promptDirtyRef.current) return;

    const versionEntries = groupedResults[selectedVersion] ?? [];
    const settingsEntry = versionEntries.find(
      (entry) => entry?.step === "campaign_settings"
    );

    if (settingsEntry) {
      try {
        const parsed = JSON.parse(settingsEntry.results || "{}");
        const versionPrompt =
          typeof parsed.orchestrator_prompt === "string"
            ? parsed.orchestrator_prompt
            : campaign.orchestrator_prompt || "";
        promptAnchorRef.current = selectedVersion;
        setRegenerationPrompt(versionPrompt);
      } catch {
        if (!regenerationPrompt) {
          promptAnchorRef.current = selectedVersion;
          setRegenerationPrompt(campaign.orchestrator_prompt || "");
        }
      }
    } else if (!regenerationPrompt) {
      promptAnchorRef.current = selectedVersion;
      setRegenerationPrompt(campaign.orchestrator_prompt || "");
    }
  }, [campaign, groupedResults, selectedVersion, regenerationPrompt]);

  useEffect(() => {
    if (wantsRegenerateFocus && promptRef.current) {
      promptRef.current.focus();
      promptRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [wantsRegenerateFocus, selectedVersion]);

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

  const currentResults = useMemo(() => {
    if (!selectedVersion) return [];
    return groupedResults[selectedVersion] ?? [];
  }, [groupedResults, selectedVersion]);

  const versionSettings = useMemo(() => {
    const entry = currentResults.find(
      (item) => item?.step === "campaign_settings"
    );
    if (!entry) return null;
    try {
      const parsed = JSON.parse(entry.results || "{}");
      return {
        prompt:
          typeof parsed.orchestrator_prompt === "string"
            ? parsed.orchestrator_prompt
            : undefined,
        notes:
          typeof parsed.additional_notes === "string"
            ? parsed.additional_notes
            : undefined,
        agents: Array.isArray(parsed.selected_agents)
          ? parsed.selected_agents.filter((agent) => typeof agent === "string")
          : undefined,
      };
    } catch {
      return null;
    }
  }, [currentResults]);

  const versionAgents =
    versionSettings?.agents ??
    (Array.isArray(campaign?.selected_agents)
      ? campaign.selected_agents
      : []);

  const versionNotes =
    versionSettings?.notes ?? campaign?.additional_notes ?? "";

  const versionTimestamp = useMemo(() => {
    const fallback = campaign?.updated_at || campaign?.created_at;
    const timestamp =
      currentResults.find((entry) => entry?.created_at)?.created_at || fallback;
    if (!timestamp) return null;
    const parsed = new Date(timestamp);
    if (!Number.isFinite(parsed.getTime())) return null;
    return parsed.toLocaleString("ru-RU");
  }, [campaign, currentResults]);

  const orderedResults = useMemo(() => {
    const orderMap = new Map(STEP_ORDER.map((step, index) => [step, index]));
    return currentResults
      .filter((entry) => entry?.step !== "campaign_settings")
      .slice()
      .sort((a, b) => {
        const orderA = orderMap.get(a?.step) ?? STEP_ORDER.length + 1;
        const orderB = orderMap.get(b?.step) ?? STEP_ORDER.length + 1;
        if (orderA !== orderB) return orderA - orderB;

        const timeA = new Date(a?.created_at || 0).getTime();
        const timeB = new Date(b?.created_at || 0).getTime();
        return timeA - timeB;
      });
  }, [currentResults]);

  const handleSaveNotes = async () => {
    if (!campaign) return;
    try {
      await updateCampaign({
        id: campaign.id,
        updates: { additional_notes: notes },
      });
      setCampaign((prev) =>
        prev ? { ...prev, additional_notes: notes } : prev
      );
      setIsEditingNotes(false);
    } catch (error) {
      console.error("Не удалось обновить заметки:", error);
    }
  };

  const handleRegenerateSubmit = async () => {
    if (!campaign || isRegenerating) return;

    try {
      const updatedCampaign = await regenerateCampaign({
        id: campaign.id,
        orchestrator_prompt: regenerationPrompt,
        additional_notes: campaign.additional_notes ?? "",
      });

      if (updatedCampaign) {
        setCampaign(updatedCampaign);
        setNotes(updatedCampaign.additional_notes || "");
        promptDirtyRef.current = false;
        promptAnchorRef.current = null;
        setSelectedVersion(updatedCampaign.version ?? selectedVersion);
      }

      await Promise.all([refetch(), refetchResults()]);

      if (wantsRegenerateFocus) {
        navigate(`/campaign/${campaign.id}`, { replace: true });
      }
    } catch (error) {
      console.error("Не удалось запустить перегенерацию:", error);
    }
  };

  if (
    authLoading ||
    campaignsLoading ||
    !campaign ||
    selectedVersion === undefined
  ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const sortedVersions = [...availableVersions].sort((a, b) => b - a);
  const showVersionSwitcher = sortedVersions.length > 1;

  return (
    <div className="min-h-screen bg-background">
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
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {getStatusIcon(campaign.status)}
            <h1 className="text-3xl md:text-4xl font-bold">{campaign.title}</h1>
            <Badge
              variant={
                campaign.status === "completed" ? "default" : "secondary"
              }
            >
              {getStatusText(campaign.status)}
            </Badge>
            <Badge variant="outline">Версия {selectedVersion}</Badge>
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

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Работа с версиями</h2>
                {versionTimestamp && (
                  <p className="text-sm text-muted-foreground">
                    Обновлено: {versionTimestamp}
                  </p>
                )}
              </div>
              {showVersionSwitcher && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Переключить версию:
                  </span>
                  <Select
                    value={String(selectedVersion)}
                    onValueChange={(value) => {
                      promptDirtyRef.current = false;
                      promptAnchorRef.current = null;
                      setSelectedVersion(Number(value));
                    }}
                  >
                    <SelectTrigger className="w-[160px] sm:w-[200px]">
                      <SelectValue placeholder="Выберите версию" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedVersions.map((version) => (
                        <SelectItem key={version} value={String(version)}>
                          Версия {version}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label
                htmlFor="regeneration-prompt"
                className="text-sm font-medium text-muted-foreground"
              >
                Основной промпт для перегенерации
              </label>
              <Textarea
                id="regeneration-prompt"
                ref={promptRef}
                value={regenerationPrompt}
                onChange={(event) => {
                  promptDirtyRef.current = true;
                  setRegenerationPrompt(event.target.value);
                }}
                placeholder="Добавьте или скорректируйте промпт, затем запустите перегенерацию"
                className="min-h-[160px]"
              />
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  size="lg"
                  onClick={handleRegenerateSubmit}
                  disabled={isRegenerating || campaign.status === "processing"}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
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

            {versionAgents.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {versionAgents.map((agentId) => (
                  <Badge key={agentId} variant="outline" className="text-xs">
                    {agentId}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Результаты версии</h2>
              {campaign.status === "processing" && (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Перегенерация в процессе
                </span>
              )}
            </div>

            {resultsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : orderedResults.length > 0 ? (
              <div className="space-y-4">
                {versionNotes && (
                  <div className="border border-border/60 rounded-lg p-4 bg-muted/30 whitespace-pre-wrap text-sm text-muted-foreground">
                    {versionNotes}
                  </div>
                )}
                {orderedResults.map((entry) => (
                  <div
                    key={`${entry.step}-${entry.created_at}`}
                    className="border border-border/60 rounded-lg p-4 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-lg font-semibold">
                        {entry.agent_name || entry.step}
                      </h3>
                      <Badge
                        variant={
                          entry.status === "failed" ? "destructive" : "secondary"
                        }
                      >
                        {entry.status === "failed" ? "Ошибка" : "Готово"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {entry.results || "Нет данных"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Для выбранной версии пока нет сохранённых результатов.
              </div>
            )}
          </div>

          {campaign.audio_transcript && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-3">Транскрипт аудио</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {campaign.audio_transcript}
              </p>
            </div>
          )}

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
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Добавьте заметки или дополнительный контекст..."
                className="min-h-[150px]"
              />
            ) : (
              <p className="text-muted-foreground whitespace-pre-wrap">
                {campaign.additional_notes || "Заметок пока нет"}
              </p>
            )}
          </div>

          {campaign.artifacts_path && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-3">Артефакты</h2>
              <p className="text-muted-foreground mb-4 break-words">
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
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;
