import { Link } from "react-router-dom";
import { Play, BookOpen, Scale, Heart as HeartIcon, Sparkles, ArrowLeft, Star, Calendar, Phone, MessageCircle, FileText, Building2, ShoppingBag, Info, Newspaper, Headphones } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { CategoryCard } from "@/components/CategoryCard";
import { VideoCard } from "@/components/VideoCard";
import { useLatestLesson, useLessons, useLatestParshaLesson } from "@/hooks/useLessons";
import rabbiBanner from "@/assets/rabbi-banner.png";
import rabbiHero from "@/assets/rabbi-hero.png";

const DONATION_URL = "https://www.matara.pro/nedarimplus/online/?mosad=7005270";
const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/F2c4sJxtBqB1wHmxcrHNXx";

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

const communityActivities = [
  {
    title: "חנות",
    description: "רכישת ספרי הרב ומוצרי קדושה",
    icon: ShoppingBag,
    href: "/shop",
  },
  {
    title: "מאמרים",
    description: "מאמרי הגות ופרשת שבוע",
    icon: FileText,
    href: "/articles",
  },
  {
    title: "פודקאסט",
    description: "האזנה בספוטיפיי",
    icon: Headphones,
    href: "/podcasts",
  },
  {
    title: "תרומות",
    description: "תמיכה בפעילות העמותה",
    icon: HeartIcon,
    href: "/donate",
  },
  {
    title: "אודות",
    description: "הכרת העמותה והרב",
    icon: Info,
    href: "/about",
  },
  {
    title: "עלונים",
    description: "ארכיון העלונים השבועיים",
    icon: Newspaper,
    href: "/newsletters",
  },
  {
    title: "לוח שיעורים",
    description: "זמני השיעורים בבית הכנסת",
    icon: Calendar,
    href: "/schedule",
  },
  {
    title: "צור קשר",
    description: "פנייה לרב ולצוות",
    icon: MessageCircle,
    href: "/contact",
  },
];

const Index = () => {
  const { data: latestLesson, isLoading } = useLatestLesson();
  const { data: recentLessons } = useLessons();
  const { data: parshaLesson } = useLatestParshaLesson();

  return (
    <Layout>
      {/* Hero Section - Full Width Banner Style */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center overflow-hidden">
        {/* Background Image with blur effect */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${rabbiHero})`
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
              
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center md:justify-start animate-fade-up" style={{ animationDelay: "0.3s" }}>
                <Link to="/lessons">
                  <Button variant="hero" size="xl" className="w-full sm:w-auto">
                    <Play className="w-5 h-5" />
                    לכל השיעורים
                  </Button>
                </Link>
                <Link to="/articles?category=פרשת השבוע">
                  <Button variant="hero" size="xl" className="w-full sm:w-auto bg-white/20 hover:bg-white/30">
                    <FileText className="w-5 h-5" />
                    דברי תורה לפרשת השבוע
                  </Button>
                </Link>
                <a href={DONATION_URL} target="_blank" rel="noopener noreferrer">
                  <Button variant="goldOutline" size="xl" className="w-full sm:w-auto border-gold text-gold hover:bg-gold/20">
                    <HeartIcon className="w-5 h-5" />
                    תרומות
                  </Button>
                </a>
              </div>

              {/* Latest Parsha Video */}
              {parshaLesson && (
                <div className="mt-6 animate-fade-up max-w-md" style={{ animationDelay: "0.4s" }}>
                  <div className="rounded-xl overflow-hidden border border-gold/30 bg-[#0a1628]/80 backdrop-blur-md shadow-lg">
                    <div className="bg-gradient-to-r from-[#0a1628] to-[#162a50] px-3 py-2 flex items-center gap-2 border-b border-gold/20">
                      <Play className="w-4 h-4 text-gold" />
                      <h3 className="text-gold font-bold text-sm truncate">שיעור פרשת השבוע האחרון</h3>
                    </div>
                    <div className="p-2">
                      <YouTubeEmbed url={parshaLesson.youtube_url} title={parshaLesson.title} />
                      <p className="text-white/80 text-xs mt-2 px-1 font-medium truncate">{parshaLesson.title}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Rabbi Photo in Circle - Left side */}
            <div className="flex-shrink-0 order-1 md:order-2 animate-fade-up">
              <div className="relative">
                {/* Decorative ring */}
                <div className="absolute inset-0 rounded-full border-4 border-gold/50" style={{ transform: 'scale(1.1)' }} />
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
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
      </section>


      {/* Recent Lessons Grid */}
      {recentLessons && recentLessons.lessons.length > 1 && (
        <section className="py-12 md:py-16 bg-black/30 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                שיעורים אחרונים
              </h2>
              <Link to="/lessons" className="text-gold hover:text-gold/80 transition-colors inline-flex items-center gap-1 text-sm whitespace-nowrap">
                לכל השיעורים
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentLessons.lessons.slice(1, 5).map((lesson) => (
                <VideoCard
                  key={lesson.id}
                  id={lesson.id}
                  title={lesson.title}
                  youtubeUrl={lesson.youtube_url}
                  category={lesson.category}
                  
                  createdAt={lesson.created_at}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Community Activities Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              הפעילות שלנו
            </h2>
            <p className="text-white/70">
              מרכז קהילתי לתורה ולקהילה
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {communityActivities.map((activity) => (
              <CategoryCard key={activity.title} {...activity} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 md:py-16 bg-black/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              קטגוריות שיעורים
            </h2>
            <p className="text-white/70">
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

      {/* Building Campaign Section */}
      <section className="py-12 md:py-16 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-gold" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                שותפות בבניית קריית התורה - יגדיל תורה
              </h2>
              <p className="text-white/80 text-lg max-w-2xl mx-auto">
                אנו בעיצומו של קמפיין לבניית בית כנסת, בית מדרש ומקוואות טהרה לגברים ונשים בבאר שבע.
                <br />
                <span className="text-gold font-semibold">השטח כבר גודר והחפירות החלו!</span>
              </p>
            </div>

            {/* Construction Images Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="aspect-square bg-white/10 rounded-lg flex items-center justify-center border-2 border-dashed border-gold/30">
                <span className="text-white/60 text-sm text-center px-2">תמונת גידור השטח</span>
              </div>
              <div className="aspect-square bg-white/10 rounded-lg flex items-center justify-center border-2 border-dashed border-gold/30">
                <span className="text-white/60 text-sm text-center px-2">תמונת החפירות</span>
              </div>
              <div className="aspect-square bg-white/10 rounded-lg flex items-center justify-center border-2 border-dashed border-gold/30">
                <span className="text-white/60 text-sm text-center px-2">הדמיית הפרויקט</span>
              </div>
              <div className="aspect-square bg-white/10 rounded-lg flex items-center justify-center border-2 border-dashed border-gold/30">
                <span className="text-white/60 text-sm text-center px-2">תמונה נוספת</span>
              </div>
            </div>

            <div className="text-center">
              <Link to="/donate">
                <Button variant="gold" size="xl" className="gap-2">
                  <HeartIcon className="w-5 h-5" />
                  להקדשות ושותפות בבנייה
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Listen by Phone Section */}
      <section className="py-12 bg-black/40 backdrop-blur-sm text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center">
                  <Phone className="w-8 h-8 text-gold" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">האזנה טלפונית</h3>
                  <p className="text-white/70">ניתן להאזין לשיעורים מכל טלפון</p>
                </div>
              </div>
              <div className="text-center">
                <a href="tel:0799165000" className="text-3xl md:text-4xl font-bold text-gold direction-ltr hover:underline">
                  0799165000
                </a>
                <p className="text-white/70 mt-1">שלוחה 59</p>
              </div>
            </div>
            
            {/* Contact Details */}
            <div className="border-t border-gold/20 pt-6">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center">
                <div>
                  <p className="text-white/80 mb-2">להזמנת שיעורים ברחבי הארץ:</p>
                  <a href="tel:0527134251" className="text-lg font-semibold text-gold hover:underline">
                    052-7134251
                  </a>
                </div>
                <div className="hidden md:block w-px h-8 bg-gold/30" />
                <div>
                  <p className="text-white/80 mb-2">הודעות וואטסאפ:</p>
                  <a 
                    href="https://wa.me/972504669926" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-gold hover:underline inline-flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    050-4669926
                  </a>
                </div>
                <div className="hidden md:block w-px h-8 bg-gold/30" />
                <div>
                  <p className="text-white/80 mb-2">קבוצת וואטסאפ:</p>
                  <a 
                    href={WHATSAPP_GROUP_URL}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-gold hover:underline inline-flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    הצטרפו לקבוצה
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-4 border-gold shadow-gold">
              <img 
                src={rabbiBanner} 
                alt="הרב אורן נזרית" 
                className="w-full h-full object-cover object-top"
              />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              תמכו בהפצת התורה
            </h2>
            <p className="text-white/80 mb-8 text-lg">
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
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
