import { Link } from "react-router-dom";
import { Play, BookOpen, Scale, Heart as HeartIcon, Sparkles, ArrowLeft, Star, Calendar } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { CategoryCard } from "@/components/CategoryCard";
import { useLatestLesson } from "@/hooks/useLessons";
import rabbiBanner from "@/assets/rabbi-banner.png";

const DONATION_URL = "https://www.matara.pro/nedarimplus/online/?mosad=7005270";

const categories = [
  {
    title: "פרשת השבוע",
    description: "שיעורים מעמיקים על פרשת השבוע",
    icon: BookOpen,
    href: "/lessons?category=פרשת השבוע",
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
  {
    title: "חגים",
    description: "שיעורים לחגי ישראל",
    icon: Calendar,
    href: "/lessons?category=חגים",
  },
  {
    title: "זוהר וקבלה",
    description: "לימודי פנימיות התורה",
    icon: Star,
    href: "/lessons?category=זוהר וקבלה",
  },
  {
    title: "הילולות צדיקים",
    description: "סיפורי ודברי צדיקים",
    icon: HeartIcon,
    href: "/lessons?category=הילולות צדיקים",
  },
];

const Index = () => {
  const { data: latestLesson, isLoading } = useLatestLesson();

  return (
    <Layout>
      {/* Hero Section with Rabbi Banner */}
      <section className="relative text-primary-foreground py-16 md:py-24 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${rabbiBanner})` }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-l from-primary/95 via-primary/85 to-primary/70" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-10 md:mb-14">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-up">
              שיעורי תורה עם{" "}
              <span className="text-gold">הרב אורן נזרית</span>
              <span className="text-gold text-2xl md:text-3xl mr-2">שליט"א</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
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

          {!latestLesson && !isLoading && (
            <div className="max-w-4xl mx-auto text-center py-12 bg-primary/50 rounded-xl backdrop-blur">
              <p className="text-primary-foreground/80 text-lg">
                השיעורים יופיעו כאן בקרוב...
              </p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {categories.map((category) => (
              <CategoryCard key={category.title} {...category} />
            ))}
          </div>
        </div>
      </section>

      {/* Listen by Phone Section */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center bg-card rounded-xl p-8 shadow-card">
            <h3 className="text-xl font-bold text-foreground mb-4">📞 האזנה טלפונית</h3>
            <p className="text-muted-foreground mb-4">
              ניתן להאזין לשיעורים מכל טלפון במספר:
            </p>
            <p className="text-2xl font-bold text-gold direction-ltr">
              0799165000
            </p>
            <p className="text-muted-foreground mt-2">שלוחה 59</p>
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
