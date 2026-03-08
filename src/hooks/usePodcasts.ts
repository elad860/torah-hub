import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Podcast {
  id: string;
  title: string;
  description: string | null;
  spotify_url: string;
  audio_url: string | null;
  hebrew_year: string | null;
  created_at: string;
}

export const usePodcasts = () => {
  return useQuery({
    queryKey: ["podcasts"],
    queryFn: async (): Promise<Podcast[]> => {
      // Fetch all podcasts (default limit is 1000, we need more)
      let all: Podcast[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error: err } = await supabase
          .from("podcasts")
          .select("*")
          .order("created_at", { ascending: false })
          .range(from, from + pageSize - 1);
        if (err) throw err;
        if (!data || data.length === 0) break;
        all = all.concat(data as Podcast[]);
        if (data.length < pageSize) break;
        from += pageSize;
      }

      return all;
    },
  });
};
