import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  className?: string;
}

export function CategoryCard({ title, description, icon: Icon, href, className }: CategoryCardProps) {
  return (
    <Link
      to={href}
      className={cn(
        "group block bg-card p-4 md:p-5 rounded-xl shadow-card hover-lift text-center",
        className
      )}
    >
      <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
      </div>
      <h3 className="font-bold text-sm md:text-base text-foreground mb-1 group-hover:text-gold transition-colors">
        {title}
      </h3>
      <p className="text-muted-foreground text-xs hidden md:block">
        {description}
      </p>
    </Link>
  );
}
