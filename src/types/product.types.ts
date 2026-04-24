export type SurveyGoal = "customers" | "competitors" | "content" | "community";
export type SurveyAudience = "b2b" | "b2c" | "both";
export type SurveyCurrent = "manual" | "other_tool" | "none";
export type SurveyReach = "1-10" | "10-50" | "50+";
export type SurveyReaction = "try" | "follow" | "contact" | "buy";
export type SurveyIndustry =
  | "saas"
  | "ecommerce"
  | "content"
  | "consulting"
  | "other";

export interface SurveyAnswers {
  goal: SurveyGoal;
  audience: SurveyAudience;
  current: SurveyCurrent;
  reach: SurveyReach;
  reaction: SurveyReaction;
  industry: SurveyIndustry;
}

export interface Product {
  id: string;
  websiteUrl: string;
  name: string | null;
  niche: string | null;
  summary: string | null;
  keywords: string[];
  subreddits: string[];
  surveyAnswers: SurveyAnswers | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductAnalysis {
  websiteUrl: string;
  name: string;
  niche: string;
  summary: string;
  keywords: string[];
  subreddits: string[];
}

export interface Campaign {
  id: string;
  productId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export type SubredditPriority = "high" | "standard";

export type SubredditRuleBadge = "green" | "yellow" | "red";

export interface SubredditTarget {
  id: string;
  productId: string;
  name: string;
  priority: SubredditPriority;
  ruleBadge: SubredditRuleBadge | null;
  rulesSummary: string | null;
  rulesCache: string | null;
  rulesUpdatedAt: string | null;
  createdAt: string;
}

export interface WorkspaceSettings {
  productId: string;
  strictProfanityFilter: boolean;
  requireCompetitorMention: boolean;
  minAuthorKarma: number;
  maxPostAgeHours: number;
  updatedAt: string;
}
