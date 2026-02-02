import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Global Background Image */}
      <div 
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url('/images/rabbi-background.png')`,
          backgroundAttachment: 'fixed'
        }}
      />
      {/* Dark Overlay for Readability */}
      <div className="fixed inset-0 -z-10 bg-primary/75 backdrop-blur-[2px]" />
      
      <Header />
      <main className="flex-1 relative">{children}</main>
      <Footer />
    </div>
  );
}
