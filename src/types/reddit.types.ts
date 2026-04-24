export interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  body: string;
  author: string;
  url: string;
  createdAt: string;
  score: number;
  authorKarma?: number;
}

export interface SubredditRule {
  subreddit: string;
  title: string;
  description: string;
}
