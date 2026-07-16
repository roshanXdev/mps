import { Link, useLocation } from "wouter";
import { BookOpen, CheckCircle, CreditCard, LogIn, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navLinks = [
    { href: "/", label: "होम", icon: BookOpen },
    { href: "/assignments", label: "असाइनमेंट सूची", icon: BookOpen },
    { href: "/pay", label: "भुगतान करें", icon: CreditCard },
    { href: "/verify", label: "सत्यापन", icon: CheckCircle },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-orange-200/50 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold group-hover:scale-110 transition-transform">
              🎓
            </div>
            <span className="font-serif font-bold text-xl sm:text-2xl text-foreground">
              IGNOU <span className="text-primary">Wala</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`font-semibold text-base ${isActive ? "bg-primary text-white shadow-md shadow-primary/20" : "text-foreground hover:bg-orange-50 hover:text-primary"}`}
                  >
                    <link.icon className="w-4 h-4 mr-2" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-foreground hover:bg-orange-50 rounded-lg"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-white/95 backdrop-blur-sm border-t border-orange-100">
          <nav className="container mx-auto px-4 py-8 flex flex-col gap-4">
            {navLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start text-lg h-14 ${isActive ? "bg-primary text-white shadow-md" : "text-foreground bg-orange-50/50"}`}
                  >
                    <link.icon className="w-5 h-5 mr-3" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
            <div className="h-px bg-orange-100 my-4" />
            <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-start text-lg h-14 border-orange-200 text-foreground">
                <LogIn className="w-5 h-5 mr-3" />
                एडमिन लॉगिन
              </Button>
            </Link>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-orange-200 bg-white py-8 md:py-12 mt-auto relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-lg">
                  🇮🇳
                </div>
                <span className="font-serif font-bold text-xl text-foreground">
                  IGNOU <span className="text-primary">Wala</span>
                </span>
              </Link>
              <p className="text-muted-foreground font-medium">
                हिंदी माध्यम के छात्रों के लिए राजनीति विज्ञान (M.A. Political Science) के सर्वोत्तम असाइनमेंट।
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4 text-foreground font-serif">त्वरित लिंक</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors font-medium">होम पेज</Link></li>
                <li><Link href="/assignments" className="text-muted-foreground hover:text-primary transition-colors font-medium">असाइनमेंट खोजें</Link></li>
                <li><Link href="/pay" className="text-muted-foreground hover:text-primary transition-colors font-medium">भुगतान करें</Link></li>
                <li><Link href="/verify" className="text-muted-foreground hover:text-primary transition-colors font-medium">भुगतान सत्यापन</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4 text-foreground font-serif">सहायता</h3>
              <p className="text-muted-foreground mb-2 font-medium">
                किसी भी समस्या के लिए हमें ईमेल करें।
              </p>
              <a href="mailto:support@ignouwala.in" className="text-primary font-bold hover:underline">
                support@ignouwala.in
              </a>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-orange-100 text-center text-muted-foreground font-medium">
            <p>© {new Date().getFullYear()} IGNOU Assignment Wala. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
