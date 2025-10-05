// This file is a simplified JS version of the Supabase schema.
// It provides enum constants and documentation, but no TypeScript types.

export const Constants = {
  public: {
    Enums: {
      agent_type: ["research", "content", "design", "analytics", "strategy"],
      campaign_status: ["draft", "processing", "completed", "failed"],
      subscription_plan: ["free", "plus", "pro"],
    },
  },
};

/*
  Database schema reference (for documentation only):

  Tables:
  - audio_files
  - campaigns
  - profiles

  Relationships:
  - audio_files.campaign_id → campaigns.id
  - campaigns.user_id → profiles.id

  Enums:
  - agent_type: research | content | design | analytics | strategy
  - campaign_status: draft | processing | completed | failed
  - subscription_plan: free | plus | pro
*/
