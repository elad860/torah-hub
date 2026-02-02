import { Link } from "react-router-dom";
import { Play, BookOpen, Scale, Heart as HeartIcon, Sparkles, ArrowLeft, Star, Calendar, Phone } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { CategoryCard } from "@/components/CategoryCard";
import { VideoCard } from "@/components/VideoCard";
import { useLatestLesson, useLessons } from "@/hooks/useLessons";
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
  const { data: recentLessons } = useLessons();

  return (
    <Layout>
      {/* Hero Section - Full Width Banner Style */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center overflow-hidden">
        {/* Background Image with blur effect */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ 
            backgroundImage: `url(${rabbiBanner})`,
            filter: 'blur(2px)'
          }}
        />
        {/* Gradient Overlay - pink/purple to navy like the reference */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-[#4a2c5a]/70 to-[#c17a8a]/60" />
        
        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Text Content - Right side (RTL) */}
            <div className="flex-1 text-center md:text-right order-2 md:order-1">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gold mb-4 animate-fade-up drop-shadow-lg">
                הרב אורן נזרית
              </h1>
              <p className="text-2xl md:text-3xl text-white/90 mb-2 animate-fade-up" style={{ animationDelay: "0.1s" }}>
                Rabbi Oren Nazrit
              </p>
              <p className="text-lg md:text-xl text-white/80 mb-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
                שיעורי תורה, הלכה ומוסר
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start animate-fade-up" style={{ animationDelay: "0.3s" }}>
                <Link to="/lessons">
                  <Button variant="hero" size="xl" className="w-full sm:w-auto">
                    <Play className="w-5 h-5" />
                    לכל השיעורים
                  </Button>
                </Link>
                <a href={DONATION_URL} target="_blank" rel="noopener noreferrer">
                  <Button variant="goldOutline" size="xl" className="w-full sm:w-auto border-gold text-gold hover:bg-gold/20">
                    <HeartIcon className="w-5 h-5" />
                    תרומות
                  </Button>
                </a>
              </div>
            </div>
            
            {/* Rabbi Photo in Circle - Left side */}
            <div className="flex-shrink-0 order-1 md:order-2 animate-fade-up">
              <div className="relative">
                {/* Decorative ring */}
                <div className="absolute inset-0 rounded-full border-4 border-gold/50 animate-pulse" style={{ transform: 'scale(1.1)' }} />
                {/* Photo circle */}
                <div className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-full overflow-hidden border-4 border-gold shadow-2xl">
                  <img 
                    src={rabbiBanner} 
                    alt="הרב אורן נזרית שליט״א" 
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                {/* Gold glow effect */}
                <div className="absolute inset-0 rounded-full bg-gold/20 blur-xl -z-10" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Latest Lesson Section */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                <span className="text-gold">🎬</span> השיעור האחרון
              </h2>
              {latestLesson && (
                <Link 
                  to={`/lesson/${latestLesson.id}`} 
                  className="text-sm text-muted-foreground hover:text-gold transition-colors inline-flex items-center gap-1"
                >
                  לעמוד השיעור
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              )}
            </div>
            
            {latestLesson && (
              <div className="bg-card rounded-2xl overflow-hidden shadow-elevated">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="aspect-video md:aspect-auto">
                    <YouTubeEmbed url={latestLesson.youtube_url} title={latestLesson.title} className="h-full rounded-none" />
                  </div>
                  <div className="p-6 md:p-8 flex flex-col justify-center">
                    <span className="inline-block bg-gold/20 text-gold text-sm font-medium px-3 py-1 rounded-full w-fit mb-4">
                      {latestLesson.category}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                      {latestLesson.title}
                    </h3>
                    {latestLesson.description && (
                      <p className="text-muted-foreground mb-4 line-clamp-3">
                        {latestLesson.description}
                      </p>
                    )}
                    <Link to={`/lesson/${latestLesson.id}`}>
                      <Button variant="gold" className="w-full sm:w-auto">
                        <Play className="w-4 h-4" />
                        צפה בשיעור
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="bg-card rounded-2xl overflow-hidden shadow-elevated">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="aspect-video bg-muted animate-pulse" />
                  <div className="p-8 space-y-4">
                    <div className="h-6 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-full bg-muted rounded animate-pulse" />
                    <div className="h-10 w-32 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              קטגוריות שיעורים
            </h2>
            <p className="text-muted-foreground">
              בחרו את הנושא שמעניין אתכם
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
            {categories.map((category) => (
              <CategoryCard key={category.title} {...category} />
            ))}
          </div>
        </div>
      </section>

      {/* Recent Lessons Grid */}
      {recentLessons && recentLessons.length > 1 && (
        <section className="py-12 md:py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                שיעורים אחרונים
              </h2>
              <Link to="/lessons" className="text-gold hover:text-gold/80 transition-colors inline-flex items-center gap-1">
                לכל השיעורים
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentLessons.slice(1, 5).map((lesson) => (
                <VideoCard
                  key={lesson.id}
                  id={lesson.id}
                  title={lesson.title}
                  youtubeUrl={lesson.youtube_url}
                  category={lesson.category}
                  description={lesson.description || undefined}
                  createdAt={lesson.created_at}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Listen by Phone Section */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center">
                <Phone className="w-8 h-8 text-gold" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">האזנה טלפונית</h3>
                <p className="text-primary-foreground/70">ניתן להאזין לשיעורים מכל טלפון</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-gold direction-ltr">
                0799165000
              </p>
              <p className="text-primary-foreground/70 mt-1">שלוחה 59</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-muted to-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-4 border-gold shadow-gold">
              <img 
                src={rabbiBanner} 
                alt="הרב אורן נזרית" 
                className="w-full h-full object-cover object-top"
              />
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
