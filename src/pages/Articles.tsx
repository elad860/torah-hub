import { Layout } from "@/components/Layout";
import { FileText, Download, ExternalLink } from "lucide-react";
import { useArticles } from "@/hooks/useArticles";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const Articles = () => {
  const { data: articles, isLoading } = useArticles();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold">
            <FileText className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            מאמרים
          </h1>
          <p className="text-muted-foreground text-lg">
            מאמרי הגות ופרשת שבוע לקריאה
          </p>
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card/80 backdrop-blur-sm border-gold/20">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/4 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : articles && articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Card
                key={article.id}
                className="bg-card/80 backdrop-blur-sm border-gold/20 hover:border-gold/40 transition-all duration-300 flex flex-col"
              >
                {article.image_url && (
                  <div className="w-full h-48 overflow-hidden rounded-t-lg">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="border-gold/40 text-gold text-xs">
                      {article.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(article.created_at).toLocaleDateString("he-IL")}
                    </span>
                  </div>
                  <CardTitle className="text-lg leading-tight text-foreground">
                    {article.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-4" dir="rtl">
                    {article.content.substring(0, 150)}...
                  </p>
                  <div className="flex gap-2">
                    <Link to={`/articles/${article.id}`} className="flex-1">
                      <Button variant="outline" className="w-full border-gold/30 text-gold hover:bg-gold/10">
                        קרא עוד
                      </Button>
                    </Link>
                    {article.download_url ? (
                      <a href={article.download_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button variant="outline" className="w-full border-gold/30 text-gold hover:bg-gold/10 gap-2">
                          <Download className="w-4 h-4" />
                          הורד PDF
                        </Button>
                      </a>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 shadow-card border border-gold/20 max-w-md mx-auto">
              <FileText className="w-12 h-12 text-gold mx-auto mb-4" />
              <p className="text-foreground text-lg">
                בקרוב יעלו כאן מאמרי הגות ופרשת שבוע של הרב.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Articles;
