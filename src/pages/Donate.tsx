import { Heart, Building2, Users, BookOpen, Sparkles } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";

const DONATION_URL = "https://www.matara.pro/nedarimplus/online/?mosad=7005270";

const features = [
  {
    icon: BookOpen,
    title: "שיעורי תורה יומיים",
    description: "שיעורים בגמרא, הלכה ומוסר לקהילת הלומדים",
  },
  {
    icon: Users,
    title: "כולל אברכים",
    description: "תמיכה באברכים הלומדים תורה בהתמדה",
  },
  {
    icon: Building2,
    title: "בית כנסת",
    description: "מקום תפילה ולימוד לקהילה הרחבה",
  },
  {
    icon: Sparkles,
    title: "הפצת תורה",
    description: "הפקת שיעורים והפצתם ברחבי העולם",
  },
];

const DonatePage = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-hero text-primary-foreground py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold animate-fade-up">
              <Heart className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              עמותת <span className="text-gold">יגדיל תורה</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
              מרכז תורני לחיזוק והפצת לימוד התורה
              <br />
              בבאר שבע והנגב
            </p>
            <a href={DONATION_URL} target="_blank" rel="noopener noreferrer" className="inline-block animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <Button variant="hero" size="xl">
                <Heart className="w-5 h-5" />
                לתרומה מאובטחת בנדרים פלוס
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                על הפעילות שלנו
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
                עמותת "יגדיל תורה" פועלת כבר שנים רבות בבאר שבע והנגב, 
                ומפעילה מרכז תורני הכולל בית כנסת, כולל אברכים ושיעורי תורה לקהל הרחב.
                בראש העמותה עומד הרב אורן נזרית שליט"א.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-card p-6 rounded-xl shadow-card hover-lift"
                >
                  <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Donation Info Section */}
      <section className="py-16 md:py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-card rounded-2xl p-8 md:p-12 shadow-elevated text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                כל שקל עושה הבדל
              </h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                תרומתכם מאפשרת להמשיך את הפעילות התורנית היומיומית,
                לתמוך באברכי הכולל, ולהפיץ את שיעורי התורה לאלפי צופים.
                <br /><br />
                התרומה מוכרת לצורכי מס לפי סעיף 46.
              </p>
              
              <a href={DONATION_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="gold" size="xl" className="mb-4">
                  <Heart className="w-5 h-5" />
                  לתרומה דרך נדרים פלוס
                </Button>
              </a>
              
              <p className="text-sm text-muted-foreground">
                מספר עמותה: 7005270
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              יצירת קשר
            </h2>
            <p className="text-muted-foreground mb-8">
              לפרטים נוספים על פעילות העמותה או לתיאום תרומות מיוחדות
            </p>
            <div className="bg-card rounded-xl p-6 shadow-card">
              <p className="font-semibold text-foreground mb-2">
                עמותת "יגדיל תורה"
              </p>
              <p className="text-muted-foreground">
                בית הכנסת וכולל "יגדיל תורה"
                <br />
                באר שבע
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default DonatePage;
