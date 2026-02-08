import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Lesson {
  id: string;
  title: string;
  youtube_url: string;
  description: string | null;
  category: string;
  series: string | null;
  created_at: string;
  playlist_id: string | null;
  playlist_name: string | null;
  published_at: string | null;
}

export function useLessons(category?: string) {
  return useQuery({
    queryKey: ["lessons", category],
    queryFn: async () => {
      let query = supabase
        .from("lessons")
        .select("*")
        .order("published_at", { ascending: false, nullsFirst: false });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Lesson[];
    },
  });
}

export function useLesson(id: string) {
  return useQuery({
    queryKey: ["lesson", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Lesson | null;
    },
    enabled: !!id,
  });
}

export function useLatestLesson() {
  return useQuery({
    queryKey: ["latest-lesson"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Lesson | null;
    },
  });
}

export function useLatestParshaLesson() {
  return useQuery({
    queryKey: ["latest-parsha-lesson"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .or("title.ilike.%פרשת%,title.ilike.%פרשה%")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Lesson | null;
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons").select("category");
      if (error) throw error;
      const categories = [...new Set(data.map((item) => item.category))];
      return categories;
    },
  });
}

export function usePlaylists() {
  return useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("playlist_id, playlist_name");
      if (error) throw error;

      const map = new Map<string, string>();
      for (const item of data) {
        if (item.playlist_id && item.playlist_name) {
          map.set(item.playlist_id, item.playlist_name);
        }
      }
      return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    },
  });
}
