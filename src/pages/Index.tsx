import { Link } from "react-router-dom";
import { Play, BookOpen, Scale, Heart as HeartIcon, Sparkles, ArrowLeft } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { CategoryCard } from "@/components/CategoryCard";
import { useLatestLesson } from "@/hooks/useLessons";

const DONATION_URL = "https://www.matara.pro/nedarimplus/online/?mosad=7005270";

const categories = [
  {
    title: "פרשת שבוע",
    description: "שיעורים מעמיקים על פרשת השבוע",
    icon: BookOpen,
    href: "/lessons?category=פרשת שבוע",
  },
  {
    title: "הלכה",
    description: "הלכות מעשיות ליום יום",
    icon: Scale,
    href: "/lessons?category=הלכה",
  },
  {
    title: "מוסר",
    description: "דברי מוסר והתחזקות",
    icon: Sparkles,
    href: "/lessons?category=מוסר",
  },
];

const Index = () => {
  const { data: latestLesson, isLoading } = useLatestLesson();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-hero text-primary-foreground py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-10 md:mb-14">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-up">
              שיעורי תורה עם{" "}
              <span className="text-gold">הרב אורן נזרית</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              מאות שיעורי וידאו בפרשת השבוע, הלכה ומוסר.
              <br className="hidden sm:block" />
              הצטרפו לאלפי הלומדים ברחבי הארץ והעולם.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <Link to="/lessons">
                <Button variant="hero" className="w-full sm:w-auto">
                  <Play className="w-5 h-5" />
                  לכל השיעורים
                </Button>
              </Link>
              <a href={DONATION_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="goldOutline" size="lg" className="w-full sm:w-auto border-gold/50 text-gold hover:bg-gold/10">
                  <HeartIcon className="w-5 h-5" />
                  תמכו בהפצת התורה
                </Button>
              </a>
            </div>
          </div>

          {/* Latest Lesson Video */}
          {latestLesson && (
            <div className="max-w-4xl mx-auto animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-gold font-semibold">השיעור האחרון</h2>
                <Link to={`/lesson/${latestLesson.id}`} className="text-sm text-primary-foreground/70 hover:text-gold transition-colors inline-flex items-center gap-1">
                  לעמוד השיעור
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
              <YouTubeEmbed url={latestLesson.youtube_url} title={latestLesson.title} />
              <div className="mt-4 text-center">
                <h3 className="text-xl font-bold">{latestLesson.title}</h3>
                <p className="text-primary-foreground/70 text-sm mt-1">{latestLesson.category}</p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="max-w-4xl mx-auto">
              <div className="aspect-video bg-navy-light/50 rounded-xl animate-pulse" />
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              קטגוריות שיעורים
            </h2>
            <p className="text-muted-foreground">
              בחרו את הנושא שמעניין אתכם
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {categories.map((category) => (
              <CategoryCard key={category.title} {...category} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold">
              <HeartIcon className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              תמכו בהפצת התורה
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              עמותת "יגדיל תורה" פועלת להפצת תורה בבאר שבע והנגב.
              <br />
              תרומתכם מאפשרת להמשיך ולייצר תוכן תורני איכותי.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={DONATION_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="gold" size="xl" className="w-full sm:w-auto">
                  <HeartIcon className="w-5 h-5" />
                  לתרומה בנדרים פלוס
                </Button>
              </a>
              <Link to="/donate">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  למידע נוסף על העמותה
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
