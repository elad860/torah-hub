import { Link } from "react-router-dom";
import { Heart, Mail, Phone, MapPin, Download, MessageCircle, FileSpreadsheet } from "lucide-react";
import rabbiBanner from "@/assets/rabbi-banner.png";

const DONATION_URL = "https://www.matara.pro/nedarimplus/online/?mosad=7005270";
const ANDROID_APP_URL = "https://onedrive.live.com/?authkey=%21AJGiqKIqVGz5g7Y&id=9C0E89B0FE00F224%2111184&cid=9C0E89B0FE00F224";
const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/F2c4sJxtBqB1wHmxcrHNXx";

export function Footer() {
  return (
    <footer className="bg-black/70 backdrop-blur-md text-white border-t border-gold/20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center overflow-hidden">
                <img src={rabbiBanner} alt="הרב אורן נזרית" className="w-full h-full object-cover object-top" />
              </div>
              <div>
                <h3 className="font-bold text-lg">הרב אורן נזרית</h3>
                <p className="text-gold text-sm">שיעורי תורה והלכה</p>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              מאות שיעורי וידאו בפרשת השבוע, הלכה, מוסר ומחשבה. 
              הצטרפו לאלפי הלומדים והעשירו את חיי הרוח שלכם.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4 text-gold">קישורים מהירים</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/lessons" className="text-white/70 hover:text-gold transition-colors">
                ספריית השיעורים
              </Link>
              <Link to="/shop" className="text-white/70 hover:text-gold transition-colors">
                חנות הספרים
              </Link>
              <Link to="/podcasts" className="text-white/70 hover:text-gold transition-colors">
                פודקאסט
              </Link>
              <Link to="/about" className="text-white/70 hover:text-gold transition-colors">
                אודות
              </Link>
              <Link to="/donate" className="text-white/70 hover:text-gold transition-colors">
                תרומות
              </Link>
              <a 
                href={DONATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-gold transition-colors inline-flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                תרומה דרך נדרים פלוס
              </a>
            </nav>
          </div>

          {/* Downloads */}
          <div>
            <h4 className="font-bold mb-4 text-gold">הורדות</h4>
            <nav className="flex flex-col gap-3">
              <a 
                href={ANDROID_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-gold transition-colors inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                אפליקציית אנדרואיד "יגדיל תורה"
              </a>
              <a 
                href={WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-gold transition-colors inline-flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                קבוצת וואטסאפ
              </a>
              <p className="text-white/50 text-xs mt-2">
                <FileSpreadsheet className="w-3 h-3 inline mr-1" />
                להורדת אפליקציית Google Sheets לצפייה אופטימלית בקבצי השיעורים
              </p>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4 text-gold">יצירת קשר</h4>
            <div className="flex flex-col gap-3 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" />
                <span>בית הכנסת וכולל "יגדיל תורה", באר שבע</span>
              </div>
              <a href="mailto:toraoren@gmail.com" className="flex items-center gap-2 hover:text-gold transition-colors">
                <Mail className="w-4 h-4 text-gold" />
                <span>toraoren@gmail.com</span>
              </a>
              <a href="tel:0527134251" className="flex items-center gap-2 hover:text-gold transition-colors">
                <Phone className="w-4 h-4 text-gold" />
                <span>052-7134251</span>
              </a>
              <a 
                href="https://wa.me/972504669926" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-gold transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-gold" />
                <span>וואטסאפ: 050-4669926</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gold/20 mt-8 pt-8 text-center text-white/50 text-sm">
          <p>© {new Date().getFullYear()} הרב אורן נזרית - כל הזכויות שמורות</p>
        </div>
      </div>
    </footer>
  );
}
