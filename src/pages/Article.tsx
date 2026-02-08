import { Layout } from "@/components/Layout";
import { useParams, Link } from "react-router-dom";
import { useArticle } from "@/hooks/useArticles";
import { ArrowRight, FileText, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const Article = () => {
  const { id } = useParams<{ id: string }>();
  const { data: article, isLoading } = useArticle(id || "");

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-6 w-1/4 mb-8" />
          <Skeleton className="h-4 w-full mb-3" />
          <Skeleton className="h-4 w-full mb-3" />
          <Skeleton className="h-4 w-full mb-3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <FileText className="w-16 h-16 text-gold mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-foreground mb-4">המאמר לא נמצא</h1>
          <Link to="/articles">
            <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 gap-2">
              <ArrowRight className="w-4 h-4" />
              חזרה למאמרים
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="container mx-auto px-4 py-16 max-w-3xl" dir="rtl">
        {/* Back link */}
        <Link to="/articles" className="inline-flex items-center gap-2 text-gold hover:text-gold/80 transition-colors mb-8">
          <ArrowRight className="w-4 h-4" />
          חזרה למאמרים
        </Link>

        {/* Article Header */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-gold/20 p-6 md:p-10">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className="border-gold/40 text-gold">
              {article.category}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(article.created_at).toLocaleDateString("he-IL")}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-8 leading-tight">
            {article.title}
          </h1>

          {article.image_url && (
            <div className="w-full rounded-lg overflow-hidden mb-8">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-lg max-w-none text-foreground leading-loose text-lg md:text-xl whitespace-pre-wrap">
            {article.content}
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default Article;
