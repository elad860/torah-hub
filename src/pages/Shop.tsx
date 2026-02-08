import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag, CreditCard, ArrowRight, BookOpen, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PAYMENT_URL = "https://www.matara.pro/nedarimplus/online/?mosad=7005270";

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  description: string;
  longDescription: string;
  icon: typeof BookOpen;
}

const books: Book[] = [
  {
    id: "oren-shel-hachamim",
    title: "אורן של חכמים",
    author: "הרב אורן נזרית שליט״א",
    price: 60,
    description: "ליקוטי תורה ומוסר מפי הרב",
    longDescription:
      "ספר מקיף הכולל ליקוטים נבחרים משיעורי הרב אורן נזרית שליט״א בתורה, מוסר ומחשבה. הספר מלווה את הלומד בדרך העבודה הרוחנית, עם פנינים מאירות עיניים מגדולי ישראל לדורותיהם. מתאים ללימוד עצמי ולשיעורים בחברותא.",
    icon: BookOpen,
  },
  {
    id: "mishnat-hamusar",
    title: "משנת המוסר",
    author: "הרב אורן נזרית שליט״א",
    price: 55,
    description: "יסודות המוסר והמידות",
    longDescription:
      "ספר יסודי בעולם המוסר, המציג את שיטת המוסר של גדולי ישראל בשפה ברורה ונגישה. הספר עוסק בתיקון המידות, עבודת ה' בשמחה, ודרכי ההתעלות הרוחנית. כולל מעשיות ומשלים להמחשה.",
    icon: Star,
  },
  {
    id: "halacha-lemaase",
    title: "הלכה למעשה",
    author: "הרב אורן נזרית שליט״א",
    price: 65,
    description: "פסקי הלכה מעשיים ליום יום",
    longDescription:
      "מדריך הלכתי מקיף לחיי היום-יום, הכולל פסקי הלכה ברורים בנושאי שבת, כשרות, תפילה ועוד. הספר נכתב בשפה פשוטה ומובנת, עם טבלאות סיכום ואיורים להבנה מירבית. חובה בכל בית יהודי.",
    icon: BookOpen,
  },
];

type View = "gallery" | "details" | "checkout";

const Shop = () => {
  const [view, setView] = useState<View>("gallery");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleViewDetails = (book: Book) => {
    setSelectedBook(book);
    setView("details");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBuyNow = () => {
    setView("checkout");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    if (view === "checkout") {
      setView("details");
    } else {
      setView("gallery");
      setSelectedBook(null);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBook) return;

    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedPhone || !trimmedEmail) {
      toast({ title: "שגיאה", description: "יש למלא את כל השדות", variant: "destructive" });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast({ title: "שגיאה", description: "כתובת אימייל לא תקינה", variant: "destructive" });
      return;
    }

    if (trimmedPhone.length < 9 || trimmedPhone.length > 15) {
      toast({ title: "שגיאה", description: "מספר טלפון לא תקין", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("orders").insert({
      full_name: trimmedName,
      phone: trimmedPhone,
      email: trimmedEmail,
      book_title: selectedBook.title,
      book_price: selectedBook.price,
    });

    setIsSubmitting(false);

    if (error) {
      toast({ title: "שגיאה", description: "אירעה שגיאה, נסה שנית", variant: "destructive" });
      return;
    }

    // Redirect to payment
    window.open(PAYMENT_URL, "_blank");
    toast({ title: "ההזמנה נשמרה!", description: "מעביר אותך לדף התשלום..." });

    // Reset
    setView("gallery");
    setSelectedBook(null);
    setFullName("");
    setPhone("");
    setEmail("");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* Back button */}
        {view !== "gallery" && (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gold hover:text-gold/80 mb-8 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה
          </button>
        )}

        {/* Gallery View */}
        {view === "gallery" && (
          <>
            <div className="text-center mb-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold/20 flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-gold" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">חנות הספרים</h1>
              <p className="text-white/70 text-lg">ספרי הרב אורן נזרית שליט״א</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="bg-black/40 backdrop-blur-sm border border-gold/20 rounded-xl overflow-hidden hover-lift group cursor-pointer"
                  onClick={() => handleViewDetails(book)}
                >
                  {/* Book cover placeholder */}
                  <div className="aspect-[3/4] bg-gradient-to-br from-primary/80 to-navy-dark flex flex-col items-center justify-center p-6 border-b border-gold/20">
                    <book.icon className="w-16 h-16 text-gold mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold text-gold text-center">{book.title}</h3>
                    <p className="text-white/60 text-sm mt-2">{book.author}</p>
                  </div>
                  <div className="p-5">
                    <p className="text-white/70 text-sm mb-4">{book.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gold">₪{book.price}</span>
                      <Button variant="gold" size="sm">
                        פרטים נוספים
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Details View */}
        {view === "details" && selectedBook && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-black/40 backdrop-blur-sm border border-gold/20 rounded-xl overflow-hidden">
              <div className="md:flex">
                {/* Book cover */}
                <div className="md:w-1/3 aspect-[3/4] md:aspect-auto bg-gradient-to-br from-primary/80 to-navy-dark flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-l border-gold/20">
                  <selectedBook.icon className="w-20 h-20 text-gold mb-4" />
                  <h2 className="text-2xl font-bold text-gold text-center">{selectedBook.title}</h2>
                  <p className="text-white/60 text-sm mt-2">{selectedBook.author}</p>
                </div>

                {/* Details */}
                <div className="md:w-2/3 p-6 md:p-8">
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedBook.title}</h2>
                  <p className="text-gold text-sm mb-6">{selectedBook.author}</p>
                  <p className="text-white/80 leading-relaxed mb-8">{selectedBook.longDescription}</p>

                  <div className="flex items-center justify-between border-t border-gold/20 pt-6">
                    <span className="text-3xl font-bold text-gold">₪{selectedBook.price}</span>
                    <Button variant="gold" size="lg" onClick={handleBuyNow} className="gap-2">
                      <ShoppingBag className="w-5 h-5" />
                      קנה עכשיו
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Checkout View */}
        {view === "checkout" && selectedBook && (
          <div className="max-w-lg mx-auto">
            <div className="bg-black/40 backdrop-blur-sm border border-gold/20 rounded-xl p-6 md:p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-gold" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">השלמת הזמנה</h2>
                <p className="text-white/60">
                  {selectedBook.title} — <span className="text-gold font-bold">₪{selectedBook.price}</span>
                </p>
              </div>

              <form onSubmit={handleSubmitOrder} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-white/80">שם מלא</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="ישראל ישראלי"
                    className="bg-white/10 border-gold/30 text-white placeholder:text-white/40"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white/80">מספר טלפון</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="050-1234567"
                    className="bg-white/10 border-gold/30 text-white placeholder:text-white/40"
                    maxLength={15}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80">אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="bg-white/10 border-gold/30 text-white placeholder:text-white/40 text-left"
                    dir="ltr"
                    maxLength={255}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="gold"
                  size="xl"
                  className="w-full gap-2 mt-4"
                  disabled={isSubmitting}
                >
                  <CreditCard className="w-5 h-5" />
                  {isSubmitting ? "שומר..." : "המשך לתשלום"}
                </Button>

                <p className="text-white/40 text-xs text-center mt-3">
                  לאחר לחיצה תועבר לדף תשלום מאובטח בנדרים פלוס
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Shop;
