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
        "group block bg-card p-6 rounded-xl shadow-card hover-lift text-center",
        className
      )}
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-gold transition-colors">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm">
        {description}
      </p>
    </Link>
  );
}
