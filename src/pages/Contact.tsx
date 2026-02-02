import { Layout } from "@/components/Layout";
import { MessageCircle, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const Contact = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold">
            <MessageCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            צור קשר
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            פנייה ישירה לרב ולצוות העמותה
          </p>
          
          <div className="bg-card rounded-xl p-8 shadow-card space-y-6">
            <div className="flex flex-col gap-4">
              <a 
                href="tel:0527134251" 
                className="flex items-center justify-center gap-3 text-foreground hover:text-secondary transition-colors"
              >
                <Phone className="w-5 h-5 text-secondary" />
                <span>להזמנת שיעורים: 052-7134251</span>
              </a>
              
              <a 
                href="https://wa.me/972504669926" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 text-foreground hover:text-secondary transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-secondary" />
                <span>הודעות וואטסאפ: 050-4669926</span>
              </a>
              
              <a 
                href="mailto:toraoren@gmail.com" 
                className="flex items-center justify-center gap-3 text-foreground hover:text-secondary transition-colors"
              >
                <Mail className="w-5 h-5 text-secondary" />
                <span>toraoren@gmail.com</span>
              </a>
            </div>
            
            <div className="pt-4 border-t border-border">
              <Button variant="gold" asChild className="w-full">
                <a 
                  href="https://chat.whatsapp.com/F2c4sJxtBqB1wHmxcrHNXx" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  הצטרפו לקבוצת הוואטסאפ
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
