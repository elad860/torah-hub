import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, ArrowRight, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PAYMENT_IFRAME_URL = "https://www.matara.pro/nedarimplus/online/?mosad=7005270";

const BookCheckout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const bookTitle = searchParams.get("title") || "";
  const bookPrice = Number(searchParams.get("price")) || 0;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  if (!bookTitle || !bookPrice) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-white/70 text-lg mb-6">לא נמצא ספר לתשלום</p>
          <Button variant="gold" onClick={() => navigate("/shop")}>
            <ArrowRight className="w-4 h-4" />
            חזרה לחנות
          </Button>
        </div>
      </Layout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      book_title: bookTitle,
      book_price: bookPrice,
    });

    setIsSubmitting(false);

    if (error) {
      toast({ title: "שגיאה", description: "אירעה שגיאה, נסה שנית", variant: "destructive" });
      return;
    }

    toast({ title: "הפרטים נשמרו בהצלחה!", description: "כעת ניתן להשלים את התשלום" });
    setShowPayment(true);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 md:py-16">
        <button
          onClick={() => navigate("/shop")}
          className="flex items-center gap-2 text-gold hover:text-gold/80 mb-8 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה לחנות
        </button>

        {/* Book summary */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">השלמת רכישה</h1>
          <p className="text-white/60">
            {bookTitle} — <span className="text-gold font-bold">₪{bookPrice}</span>
          </p>
        </div>

        {!showPayment ? (
          /* Step 1: Data capture form */
          <div className="max-w-lg mx-auto">
            <div className="bg-black/40 backdrop-blur-sm border border-gold/20 rounded-xl p-6 md:p-8">
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gold/20 flex items-center justify-center">
                  <CreditCard className="w-7 h-7 text-gold" />
                </div>
                <p className="text-white/70 text-sm">מלאו את הפרטים כדי להמשיך לתשלום</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
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
              </form>
            </div>
          </div>
        ) : (
          /* Step 2: Embedded payment iframe */
          <div className="max-w-3xl mx-auto">
            <div className="bg-black/40 backdrop-blur-sm border border-gold/20 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-gold/20 bg-gold/10">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white/80 text-sm">הפרטים נשמרו — השלימו את התשלום בטופס למטה</span>
              </div>
              <iframe
                src={PAYMENT_IFRAME_URL}
                title="תשלום מאובטח בנדרים פלוס"
                className="w-full border-0"
                style={{ minHeight: "700px" }}
                allow="payment"
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BookCheckout;
