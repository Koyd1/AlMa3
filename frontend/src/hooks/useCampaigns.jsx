import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export const useCampaigns = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const apiBase = (import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");

  // ==========================
  // Получение списка кампаний
  // ==========================
  const campaignsQuery = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("pinned", { ascending: false })
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      const campaigns = Array.isArray(data) ? data : [];

      return campaigns.sort((a, b) => {
        const aPinned = Boolean(a?.pinned);
        const bPinned = Boolean(b?.pinned);
        if (aPinned !== bPinned) {
          return aPinned ? -1 : 1;
        }

        const parseDate = (value) => {
          if (!value) return 0;
          const timestamp = new Date(value).getTime();
          return Number.isFinite(timestamp) ? timestamp : 0;
        };

        const aTime = parseDate(a?.updated_at) || parseDate(a?.created_at);
        const bTime = parseDate(b?.updated_at) || parseDate(b?.created_at);

        return bTime - aTime;
      });
    },
  });

  // ==========================
  // Создание кампании
  // ==========================
  const createCampaignMutation = useMutation({
    mutationFn: async (payload) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Пользователь не авторизован");

      const {
        audio_file,
        selected_agents: rawSelectedAgents = [],
        ...restPayload
      } = payload ?? {};

      const selected_agents = Array.isArray(rawSelectedAgents)
        ? rawSelectedAgents
        : [];

      const { data: campaign, error } = await supabase
        .from("campaigns")
        .insert({
          ...restPayload,
          selected_agents,
          user_id: user.id,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Подготовка данных для FastAPI
      const formData = new FormData();
      formData.append("campaign_id", campaign.id);
      formData.append("title", campaign.title ?? restPayload.title ?? "");
      formData.append(
        "orchestrator_prompt",
        restPayload.orchestrator_prompt ?? campaign.orchestrator_prompt ?? ""
      );
      formData.append(
        "additional_notes",
        restPayload.additional_notes ?? campaign.additional_notes ?? ""
      );
      formData.append("selected_agents", JSON.stringify(selected_agents));
      if (audio_file) {
        formData.append("audio", audio_file);
      }

      // Вызов FastAPI оркестратора
      const response = await fetch(`${apiBase}/orchestrator/run`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let detail = "";
        try {
          const data = await response.json();
          detail = data?.detail || data?.message || "";
        } catch (error) {
          //Реагируем на ошибку
          detail = "";
          console.error("Ошибка при вызове FastAPI:", error);
        }

        try {
          await supabase
            .from("campaigns")
            .update({ status: "failed" })
            .eq("id", campaign.id);
        } catch (error) {
          console.error("Ошибка при обновлении статуса кампании:", error);
        }

        throw new Error(
          detail || `Не удалось запустить оркестратор (${response.status})`
        );
      }

      return campaign;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({
        title: "Кампания запущена",
        description: "Оркестратор начал обработку",
      });
    },

    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error?.message || "Не удалось запустить кампанию",
        variant: "destructive",
      });
    },
  });

  // ==========================
  // Обновление кампании
  // ==========================
  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      if (!id) throw new Error("Не указан ID кампании");

      const updateData = {};

      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.additional_notes !== undefined)
        updateData.additional_notes = updates.additional_notes;
      if (updates.selected_agents !== undefined)
        updateData.selected_agents = updates.selected_agents;
      if (updates.pinned !== undefined) updateData.pinned = updates.pinned; // ✅ Добавлено сюда

      const { error } = await supabase
        .from("campaigns")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({
        title: "Кампания обновлена",
        description: "Изменения сохранены успешно",
      });
    },

    onError: (error) => {
      toast({
        title: "Ошибка обновления",
        description: error?.message || "Не удалось обновить кампанию",
        variant: "destructive",
      });
    },
  });

  // ==========================
  // Удаление кампании
  // ==========================
  const deleteCampaignMutation = useMutation({
    mutationFn: async (id) => {
      if (!id) throw new Error("Не указан ID кампании для удаления");

      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({
        title: "Кампания удалена",
        description: "Все связанные данные были удалены",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка удаления",
        description: error?.message || "Не удалось удалить кампанию",
        variant: "destructive",
      });
    },
  });

  // ==========================
  // Перегенерация кампании
  // ==========================
  const regenerateCampaignMutation = useMutation({
    mutationFn: async ({ id, orchestrator_prompt, additional_notes }) => {
      if (!id) throw new Error("Не указан ID кампании для перегенерации");

      const { data: existing, error: fetchError } = await supabase
        .from("campaigns")
        .select(
          "title, version, selected_agents, additional_notes, orchestrator_prompt"
        )
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;
      if (!existing) throw new Error("Кампания не найдена");

      const nextVersion = (existing.version ?? 1) + 1;
      const selectedAgents = Array.isArray(existing.selected_agents)
        ? existing.selected_agents
        : [];

      const newPrompt =
        orchestrator_prompt ??
        existing.orchestrator_prompt ??
        existing.additional_notes ??
        "";

      const mergedNotes =
        additional_notes ?? existing.additional_notes ?? "";

      const { data: updatedCampaign, error: updateError } = await supabase
        .from("campaigns")
        .update({
          orchestrator_prompt: newPrompt,
          additional_notes: mergedNotes,
          version: nextVersion,
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      const formData = new FormData();
      formData.append("campaign_id", id);
      formData.append("title", updatedCampaign?.title ?? existing.title ?? "");
      formData.append("orchestrator_prompt", newPrompt);
      formData.append("additional_notes", mergedNotes);
      formData.append("selected_agents", JSON.stringify(selectedAgents));

      const response = await fetch(`${apiBase}/orchestrator/run`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let detail = "";
        try {
          const payload = await response.json();
          detail = payload?.detail || payload?.message || "";
        } catch {
          detail = "";
        }

        throw new Error(
          detail || `Не удалось запустить перегенерацию (${response.status})`
        );
      }

      return updatedCampaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({
        title: "Перегенерация запущена",
        description: "Оркестратор начал пересборку кампании",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка перегенерации",
        description: error?.message || "Не удалось перезапустить кампанию",
        variant: "destructive",
      });
    },
  });

  // ==========================
  // Возвращаем хук
  // ==========================
  return {
    campaigns: campaignsQuery.data ?? [],
    isLoading: campaignsQuery.isLoading,
    error: campaignsQuery.error,
    refetch: campaignsQuery.refetch,
    createCampaign: createCampaignMutation.mutateAsync,
    isCreating: createCampaignMutation.isPending,
    updateCampaign: updateCampaignMutation.mutateAsync,
    isUpdating: updateCampaignMutation.isPending,
    deleteCampaign: deleteCampaignMutation.mutateAsync,
    isDeleting: deleteCampaignMutation.isPending,
    regenerateCampaign: regenerateCampaignMutation.mutateAsync,
    isRegenerating: regenerateCampaignMutation.isPending,
  };
};
