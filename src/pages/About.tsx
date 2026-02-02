import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, Heart } from "lucide-react";

const DONATION_URL = "https://www.matara.pro/nedarimplus/online/?mosad=7005270";

const AboutPage = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-hero text-primary-foreground py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold animate-fade-up">
              <span className="text-primary font-bold text-3xl">ת</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              הרב <span className="text-gold">אורן נזרית</span> שליט"א
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 animate-fade-up" style={{ animationDelay: "0.2s" }}>
              רב בית הכנסת וראש כולל "יגדיל תורה" בבאר שבע
            </p>
          </div>
        </div>
      </section>

      {/* Bio Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="prose prose-lg max-w-none text-foreground">
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                הרב אורן נזרית שליט"א הוא רב בית הכנסת וראש כולל "יגדיל תורה" בעיר באר שבע.
                הרב מוסר שיעורים בגמרא, הלכה, פרשת השבוע ומוסר, ופועל להפצת תורה בנגב ובכל רחבי הארץ.
              </p>
              
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                באתר זה ריכזנו את מאות שיעורי הוידאו של הרב, כדי לאפשר לכל אחד ללמוד 
                ולהתעלות מכל מקום ובכל זמן. השיעורים מחולקים לקטגוריות לנוחיותכם.
              </p>

              <p className="text-lg text-muted-foreground leading-relaxed">
                הרב עומד בראש עמותת "יגדיל תורה" הפועלת להפצת תורה, תמיכה באברכים 
                וחיזוק חיי הרוח בבאר שבע והנגב.
              </p>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/lessons">
                <Button variant="navy" size="lg" className="w-full sm:w-auto gap-2">
                  <BookOpen className="w-5 h-5" />
                  לספריית השיעורים
                </Button>
              </Link>
              <a href={DONATION_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="gold" size="lg" className="w-full sm:w-auto gap-2">
                  <Heart className="w-5 h-5" />
                  לתרומה
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AboutPage;
