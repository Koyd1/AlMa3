import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCampaignResults = (campaignId) => {
  const resultsQuery = useQuery({
    queryKey: ["campaignResults", campaignId],
    enabled: Boolean(campaignId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orchestrator_results")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("version", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });

  const groupedResults = useMemo(() => {
    const groups = new Map();

    for (const entry of resultsQuery.data ?? []) {
      const version = entry?.version ?? 1;
      if (!groups.has(version)) {
        groups.set(version, []);
      }
      groups.get(version).push(entry);
    }

    for (const [, entries] of groups.entries()) {
      entries.sort((a, b) => {
        const getOrderKey = (value) => {
          if (!value) return 0;
          const timestamp = new Date(value).getTime();
          return Number.isFinite(timestamp) ? timestamp : 0;
        };
        const diff = getOrderKey(a?.created_at) - getOrderKey(b?.created_at);
        if (diff !== 0) {
          return diff;
        }
        return (a?.step || "").localeCompare(b?.step || "");
      });
    }

    return Object.fromEntries(
      Array.from(groups.entries()).sort((a, b) => b[0] - a[0])
    );
  }, [resultsQuery.data]);

  const availableVersions = useMemo(
    () => Object.keys(groupedResults).map((value) => Number(value)),
    [groupedResults]
  );

  const latestVersion =
    availableVersions.length > 0
      ? Math.max(...availableVersions)
      : undefined;

  return {
    results: resultsQuery.data ?? [],
    isLoading: resultsQuery.isLoading,
    error: resultsQuery.error,
    groupedResults,
    availableVersions,
    latestVersion,
    refetch: resultsQuery.refetch,
  };
};

