import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import rabbiBanner from "@/assets/rabbi-banner.png";

const DONATION_URL = "https://www.matara.pro/nedarimplus/online/?mosad=7005270";

const navLinks = [
  { href: "/", label: "בית" },
  { href: "/lessons", label: "שיעורים" },
  { href: "/about", label: "אודות" },
  { href: "/donate", label: "תרומות" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-md border-b border-gold/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold overflow-hidden">
              <img src={rabbiBanner} alt="הרב אורן נזרית" className="w-full h-full object-cover object-top" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-white font-bold text-lg md:text-xl">הרב אורן נזרית</h1>
              <p className="text-gold text-xs md:text-sm">שיעורי תורה והלכה</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-white/80 hover:text-white transition-colors",
                  isActive(link.href) && "bg-gold/20 text-gold font-medium"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Donate Button - Desktop */}
          <a
            href={DONATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:block"
          >
            <Button variant="gold" className="gap-2">
              <Heart className="w-4 h-4" />
              לתרומה
            </Button>
          </a>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white p-2"
            aria-label="תפריט"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gold/20 animate-fade-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-white/80 hover:bg-gold/10 transition-colors",
                    isActive(link.href) && "bg-gold/20 text-gold font-medium"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href={DONATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Button variant="gold" className="w-full gap-2">
                  <Heart className="w-4 h-4" />
                  לתרומה
                </Button>
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
