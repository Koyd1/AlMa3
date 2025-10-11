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
        .order("created_at", { ascending: false })
        .order("pinned", { ascending: false });

      if (error) throw error;
      return data ?? [];
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
  };
};
