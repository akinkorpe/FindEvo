import { getSupabaseServer } from "@/lib/supabase";
import { mapRedditPost } from "./mappers";
import type { RedditPost } from "@/types";

export async function upsertPosts(posts: RedditPost[]): Promise<void> {
  if (posts.length === 0) return;
  const rows = posts.map((p) => ({
    id: p.id,
    subreddit: p.subreddit,
    title: p.title,
    body: p.body,
    author: p.author,
    url: p.url,
    score: p.score,
    author_karma: p.authorKarma ?? null,
    created_utc: p.createdAt,
  }));
  const { error } = await getSupabaseServer()
    .from("reddit_posts")
    .upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

export async function getPostsByIds(ids: string[]): Promise<RedditPost[]> {
  if (ids.length === 0) return [];
  const { data, error } = await getSupabaseServer()
    .from("reddit_posts")
    .select("*")
    .in("id", ids);
  if (error) throw error;
  return (data ?? []).map(mapRedditPost);
}
