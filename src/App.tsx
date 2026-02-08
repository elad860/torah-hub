import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Lessons from "./pages/Lessons";
import Lesson from "./pages/Lesson";
import Donate from "./pages/Donate";
import About from "./pages/About";
import Shop from "./pages/Shop";
import BookCheckout from "./pages/BookCheckout";
import Articles from "./pages/Articles";
import Kids from "./pages/Kids";
import Newsletters from "./pages/Newsletters";
import Schedule from "./pages/Schedule";
import Contact from "./pages/Contact";
import Podcasts from "./pages/Podcasts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/lesson/:id" element={<Lesson />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/about" element={<About />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/book-checkout" element={<BookCheckout />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/kids" element={<Kids />} />
          <Route path="/newsletters" element={<Newsletters />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/podcasts" element={<Podcasts />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
