//New code:
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export const useCampaigns = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const apiBase = (import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");

  const campaignsQuery = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

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
          // ignore parse errors, we'll fall back to status text
        }

        try {
          await supabase
            .from("campaigns")
            .update({ status: "failed" })
            .eq("id", campaign.id);
        } catch (error) {
          // ignore update errors, original failure reason is more important
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

  return {
    campaigns: campaignsQuery.data ?? [],
    isLoading: campaignsQuery.isLoading,
    error: campaignsQuery.error,
    refetch: campaignsQuery.refetch,
    createCampaign: createCampaignMutation.mutateAsync,
    isCreating: createCampaignMutation.isPending,
  };
};


//Old code:
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { useToast } from "./use-toast";

// export const useCampaigns = () => {
//   const queryClient = useQueryClient();
//   const { toast } = useToast();

//   const campaignsQuery = useQuery({
//     queryKey: ["campaigns"],
//     queryFn: async () => {
//       const {
//         data: { user },
//         error: userError,
//       } = await supabase.auth.getUser();

//       if (userError) {
//         throw userError;
//       }

//       if (!user) {
//         return [];
//       }

//       const { data, error } = await supabase
//         .from("campaigns")
//         .select(
//           "id, title, status, selected_agents, created_at, orchestrator_prompt, additional_notes, audio_transcript, audio_context_request, artifacts_path"
//         )
//         .eq("user_id", user.id)
//         .order("created_at", { ascending: false });

//       if (error) {
//         throw error;
//       }

//       return data ?? [];
//     },
//   });

//   const createCampaignMutation = useMutation({
//     mutationFn: async (payload) => {
//       const {
//         data: { user },
//         error: userError,
//       } = await supabase.auth.getUser();

//       if (userError) {
//         throw userError;
//       }

//       if (!user) {
//         throw new Error("Пользователь не авторизован");
//       }

//       const { data, error } = await supabase
//         .from("campaigns")
//         .insert({
//           ...payload,
//           user_id: user.id,
//         })
//         .select()
//         .single();

//       if (error) {
//         throw error;
//       }

//       return data;
//     },
//     onSuccess: (newCampaign) => {
//       queryClient.setQueryData(["campaigns"], (existing = []) => [
//         newCampaign,
//         ...existing,
//       ]);
//       queryClient.invalidateQueries({ queryKey: ["campaigns"] });
//       toast({
//         title: "Кампания создана",
//         description: "Новая кампания успешно добавлена",
//       });
//     },
//     onError: (error) => {
//       toast({
//         title: "Ошибка",
//         description:
//           error?.message || "Не удалось создать кампанию, попробуйте позже",
//         variant: "destructive",
//       });
//     },
//   });

//   return {
//     campaigns: campaignsQuery.data ?? [],
//     isLoading: campaignsQuery.isLoading,
//     error: campaignsQuery.error,
//     refetch: campaignsQuery.refetch,
//     createCampaign: createCampaignMutation.mutateAsync,
//     isCreating: createCampaignMutation.isPending,
//   };
// };
