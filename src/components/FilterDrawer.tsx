import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface FilterDrawerProps {
  categories?: string[];
  selectedCategory: string | null;
  onCategoryChange: (cat: string | null) => void;
  years?: string[];
  selectedYear: string;
  onYearChange: (year: string) => void;
  activeCount: number;
}

export function FilterDrawer({
  categories,
  selectedCategory,
  onCategoryChange,
  years,
  selectedYear,
  onYearChange,
  activeCount,
}: FilterDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-xs h-9 border-gold/30 md:hidden">
          <Filter className="w-3.5 h-3.5" />
          סינון
          {activeCount > 0 && (
            <span className="bg-gold text-black rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl border-gold/20 bg-background/95 backdrop-blur-xl max-h-[70vh] overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="text-foreground text-right">סינון תוצאות</SheetTitle>
        </SheetHeader>

        <div className="py-4 space-y-5">
          {/* Category filter */}
          {categories && categories.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">נושא</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? "gold" : "outline"}
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => onCategoryChange(null)}
                >
                  הכל
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "gold" : "outline"}
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => onCategoryChange(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Year filter */}
          {years && years.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">שנה עברית</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedYear === "all" ? "gold" : "outline"}
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => onYearChange("all")}
                >
                  הכל
                </Button>
                {years.map((y) => (
                  <Button
                    key={y}
                    variant={selectedYear === y ? "gold" : "outline"}
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => onYearChange(y)}
                  >
                    {y}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-border">
          <Button variant="gold" className="w-full" onClick={() => setOpen(false)}>
            הצג תוצאות
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
