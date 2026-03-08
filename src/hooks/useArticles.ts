import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url: string | null;
  download_url: string | null;
  hebrew_year: string | null;
  created_at: string;
}

export const useArticles = () => {
  return useQuery({
    queryKey: ["articles"],
    queryFn: async (): Promise<Article[]> => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching articles:", error);
        throw error;
      }

      return data || [];
    },
  });
};

export const useArticle = (id: string) => {
  return useQuery({
    queryKey: ["article", id],
    queryFn: async (): Promise<Article | null> => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching article:", error);
        throw error;
      }

      return data;
    },
    enabled: !!id,
  });
};
