import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export const useCampaigns = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const campaignsQuery = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from("campaigns")
        .select(
          "id, title, status, selected_agents, created_at, orchestrator_prompt, additional_notes, audio_transcript, audio_context_request, artifacts_path"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (payload) => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("Пользователь не авторизован");
      }

      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          ...payload,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (newCampaign) => {
      queryClient.setQueryData(["campaigns"], (existing = []) => [
        newCampaign,
        ...existing,
      ]);
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({
        title: "Кампания создана",
        description: "Новая кампания успешно добавлена",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description:
          error?.message || "Не удалось создать кампанию, попробуйте позже",
        variant: "destructive",
      });
    },
  });

  return {
    campaigns: campaignsQuery.data ?? [],
    isLoading: campaignsQuery.isLoading,
    error: campaignsQuery.error,
    refetch: campaignsQuery.refetch,
    createCampaign: createCampaignMutation.mutateAsync,
    isCreating: createCampaignMutation.isPending,
  };
};
