import { Link } from "react-router-dom";
import { Heart, Mail, Phone, MapPin } from "lucide-react";

const DONATION_URL = "https://www.matara.pro/nedarimplus/online/?mosad=7005270";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center">
                <span className="text-primary font-bold">ת</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">הרב אורן נזרית</h3>
                <p className="text-gold text-sm">שיעורי תורה והלכה</p>
              </div>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              מאות שיעורי וידאו בפרשת השבוע, הלכה, מוסר ומחשבה. 
              הצטרפו לאלפי הלומדים והעשירו את חיי הרוח שלכם.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4 text-gold">קישורים מהירים</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/lessons" className="text-primary-foreground/70 hover:text-gold transition-colors">
                ספריית השיעורים
              </Link>
              <Link to="/about" className="text-primary-foreground/70 hover:text-gold transition-colors">
                אודות
              </Link>
              <Link to="/donate" className="text-primary-foreground/70 hover:text-gold transition-colors">
                תרומות
              </Link>
              <a 
                href={DONATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/70 hover:text-gold transition-colors inline-flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                תרומה דרך נדרים פלוס
              </a>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4 text-gold">יצירת קשר</h4>
            <div className="flex flex-col gap-3 text-primary-foreground/70 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" />
                <span>בית הכנסת וכולל "יגדיל תורה", באר שבע</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold" />
                <span>info@example.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gold/20 mt-8 pt-8 text-center text-primary-foreground/50 text-sm">
          <p>© {new Date().getFullYear()} הרב אורן נזרית - כל הזכויות שמורות</p>
        </div>
      </div>
    </footer>
  );
}
