import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Podcast {
  id: string;
  title: string;
  description: string | null;
  spotify_url: string;
  created_at: string;
}

export const usePodcasts = () => {
  return useQuery({
    queryKey: ["podcasts"],
    queryFn: async (): Promise<Podcast[]> => {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching podcasts:", error);
        throw error;
      }

      return data || [];
    },
  });
};
