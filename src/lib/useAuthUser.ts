"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase";

export type AuthUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
};

function pickAvatarUrl(meta: Record<string, unknown> | undefined): string | null {
  if (!meta) return null;
  const candidates = ["avatar_url", "picture", "image"];
  for (const k of candidates) {
    const v = meta[k];
    if (typeof v === "string" && v.startsWith("http")) return v;
  }
  return null;
}

function pickFullName(
  meta: Record<string, unknown> | undefined,
  email: string | null,
): string | null {
  if (meta) {
    const candidates = ["full_name", "name", "user_name"];
    for (const k of candidates) {
      const v = meta[k];
      if (typeof v === "string" && v.trim()) return v;
    }
  }
  return email ? email.split("@")[0] : null;
}

export function useAuthUser(): {
  user: AuthUser | null;
  loading: boolean;
} {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    const sb = getSupabaseBrowser();

    function apply(rawUser: {
      id: string;
      email?: string | null;
      user_metadata?: Record<string, unknown>;
    } | null) {
      if (!rawUser) {
        setUser(null);
        return;
      }
      setUser({
        id: rawUser.id,
        email: rawUser.email ?? null,
        fullName: pickFullName(rawUser.user_metadata, rawUser.email ?? null),
        avatarUrl: pickAvatarUrl(rawUser.user_metadata),
      });
    }

    sb.auth
      .getUser()
      .then(({ data }) => {
        apply(data.user ?? null);
      })
      .catch(() => {
        apply(null);
      })
      .finally(() => {
        setLoading(false);
      });

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      apply(session?.user ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
