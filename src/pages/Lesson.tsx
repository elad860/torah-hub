import { useParams, Link } from "react-router-dom";
import { ArrowRight, Calendar, Tag, Share2, Heart } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { useLesson } from "@/hooks/useLessons";
import { getWhatsAppShareUrl } from "@/lib/youtube";

const DONATION_URL = "https://www.matara.pro/nedarimplus/online/?mosad=7005270";

const LessonPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: lesson, isLoading, error } = useLesson(id || "");

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const whatsappUrl = lesson ? getWhatsAppShareUrl(lesson.title, shareUrl) : "";

  const formattedDate = lesson
    ? new Date(lesson.created_at).toLocaleDateString("he-IL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="aspect-video bg-muted rounded-xl animate-pulse mb-6" />
            <div className="h-8 bg-muted rounded w-3/4 animate-pulse mb-4" />
            <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !lesson) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              השיעור לא נמצא
            </h1>
            <p className="text-muted-foreground mb-6">
              לא הצלחנו למצוא את השיעור המבוקש
            </p>
            <Link to="/lessons">
              <Button variant="gold">
                <ArrowRight className="w-4 h-4" />
                לכל השיעורים
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-hero">
        <div className="container mx-auto px-4 py-6">
          <Link
            to="/lessons"
            className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-gold transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה לספריית השיעורים
          </Link>
        </div>
      </div>

      <section className="py-8 md:py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Video Player */}
            <YouTubeEmbed url={lesson.youtube_url} title={lesson.title} />

            {/* Lesson Info */}
            <div className="mt-6 md:mt-8">
              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 bg-gold/10 text-gold px-3 py-1 rounded-full font-medium">
                  <Tag className="w-3.5 h-3.5" />
                  {lesson.category}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formattedDate}
                </span>
                {lesson.series && (
                  <span className="text-muted-foreground">
                    סדרה: {lesson.series}
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                {lesson.title}
              </h1>

              {lesson.description && (
                <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                  {lesson.description}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    שתפו בוואטסאפ
                  </Button>
                </a>
                <a
                  href={DONATION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="gold" className="gap-2">
                    <Heart className="w-4 h-4" />
                    תמכו בהפצת התורה
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default LessonPage;
