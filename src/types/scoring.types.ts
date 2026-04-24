import type { RedditPost } from "./reddit.types";

export type RiskLevel = "safe" | "review" | "high_risk";

export interface ScoredPost {
  id: string;
  productId: string;
  post: RedditPost;
  intentScore: number;
  reason: string;
  riskLevel: RiskLevel;
  dismissed: boolean;
  createdAt: string;
  // Joined metadata from the feed endpoint (not persisted on scored_posts):
  ruleBadge?: "green" | "yellow" | "red" | null;
  rulesSummary?: string | null;
  sent?: boolean;
}

export interface ApproachGuide {
  scoredPostId: string;
  whyLead: string;
  authorContext: string;
  suggestedSteps: string[];
}

export type LeadStatus =
  | "new"
  | "engaged"
  | "active_pipeline"
  | "converted"
  | "dismissed";

export type InteractionKind =
  | "ai_suggestion"
  | "comment"
  | "note"
  | "status_change";

export interface LeadInteraction {
  id: string;
  leadId: string;
  kind: InteractionKind;
  content: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  productId: string;
  scoredPostId: string | null;
  redditUsername: string;
  source: string;
  intentLabel: string;
  status: LeadStatus;
  lastSeenAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetric {
  label: string;
  value: number;
  deltaPct?: number;
  trend?: "up" | "down" | "steady";
}

export interface LeadVelocityPoint {
  date: string;
  count: number;
}

export interface IntelligenceFeedItem {
  id: string;
  priority: "high" | "opportunity" | "routine";
  title: string;
  body: string;
  cta?: string;
  contextUrl?: string;
  createdAt: string;
}

export interface CampaignHealth {
  label: string;
  percent: number;
  note: string;
}
