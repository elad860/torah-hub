import { Layout } from "@/components/Layout";
import { Calendar } from "lucide-react";

const Schedule = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold">
            <Calendar className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            לוח שיעורים
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            זמני השיעורים בבית הכנסת ובזום
          </p>
          <div className="bg-card rounded-xl p-8 shadow-card">
            <p className="text-foreground">
              הדף בבנייה - בקרוב יעלה כאן לוח זמנים מפורט של כל השיעורים.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Schedule;
