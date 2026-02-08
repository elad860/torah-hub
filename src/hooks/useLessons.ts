import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Lesson {
  id: string;
  title: string;
  youtube_url: string;
  category: string;
  series: string | null;
  created_at: string;
  playlist_id: string | null;
  playlist_name: string | null;
  published_at: string | null;
}

export function useLessons(category?: string, page = 0, pageSize = 50) {
  return useQuery({
    queryKey: ["lessons", category, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from("lessons")
        .select("*", { count: "exact" })
        .order("published_at", { ascending: false, nullsFirst: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { lessons: data as Lesson[], total: count || 0 };
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
      // Fetch one lesson per category by querying with each known category
      // Use a small limit per page and collect all unique categories
      const allCategories = new Set<string>();
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("lessons")
          .select("category")
          .range(from, from + batchSize - 1);
        if (error) throw error;
        data.forEach((item) => allCategories.add(item.category));
        hasMore = data.length === batchSize;
        from += batchSize;
      }

      return [...allCategories];
    },
  });
}

export function usePlaylists() {
  return useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const map = new Map<string, string>();
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("lessons")
          .select("playlist_id, playlist_name")
          .range(from, from + batchSize - 1);
        if (error) throw error;
        for (const item of data) {
          if (item.playlist_id && item.playlist_name) {
            map.set(item.playlist_id, item.playlist_name);
          }
        }
        hasMore = data.length === batchSize;
        from += batchSize;
      }

      return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    },
  });
}

interface FilteredLessonsParams {
  category?: string | null;
  playlistId?: string | null;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export function useFilteredLessons(params: FilteredLessonsParams) {
  const { category, playlistId, search, dateFrom, dateTo, page = 0, pageSize = 48 } = params;

  return useQuery({
    queryKey: ["filtered-lessons", category, playlistId, search, dateFrom, dateTo, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from("lessons")
        .select("*", { count: "exact" })
        .order("published_at", { ascending: false, nullsFirst: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (category) query = query.eq("category", category);
      if (playlistId) query = query.eq("playlist_id", playlistId);
      if (search) query = query.ilike("title", `%${search}%`);
      if (dateFrom) query = query.gte("published_at", dateFrom);
      if (dateTo) query = query.lte("published_at", dateTo);

      const { data, error, count } = await query;
      if (error) throw error;
      return { lessons: data as Lesson[], total: count || 0 };
    },
  });
}
