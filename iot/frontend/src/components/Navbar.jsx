import { useState } from "react";
import { Menu, X, Languages, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";

const languageLabels = {
  English: "English",
  Hindi: "हिंदी",
  Telugu: "తెలుగు",
  Tamil: "தமிழ்",
  Malayalam: "മലയാളം",
  Kannada: "ಕನ್ನಡ",
  Marathi: "मराठी",
  Bengali: "বাংলা",
  Gujarati: "ગુજરાતી"
};

const Navbar = ({ onLogin, onGetStarted, currentLang, changeLanguage, t }) => {
  const navItems = [
    { label: t('solutions'), id: 'solutions' },
    { label: t('features'), id: 'features' },
    { label: t('howItWorks'), id: 'how-it-works' },
    { label: t('dashboard'), id: 'dashboard' }
  ];
  const [mobileOpen, setMobileOpen] = useState(false);

  const LanguageSelector = ({ isMobile }) => (
    <div className={`relative ${isMobile ? 'w-full px-2 py-4' : ''}`}>
      <div className={`flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-xl border border-border ${isMobile ? 'w-full' : ''}`}>
        <Languages size={14} className="text-muted-foreground" />
        <select
          value={currentLang}
          onChange={(e) => changeLanguage(e.target.value)}
          className="bg-transparent text-[11px] font-bold uppercase tracking-wider outline-none cursor-pointer appearance-none pr-4 w-full"
        >
          {Object.keys(languageLabels).map((lang) => (
            <option key={lang} value={lang} className="bg-card text-foreground">
              {languageLabels[lang]}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronRight size={10} className="rotate-90 text-muted-foreground" />
        </div>
      </div>
    </div>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <span 
          className="font-display text-xl font-extrabold tracking-tight text-primary cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          AgriMate
        </span>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <LanguageSelector isMobile={false} />
          <ThemeToggle variant="button" />
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={onLogin}>
            {t('login')}
          </Button>
          <Button size="sm" onClick={onGetStarted}>{t('getStarted')}</Button>
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle variant="button" className="w-9 h-9" />
          <button
            className="text-foreground p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-b border-border px-6 pb-6 animate-fade-in">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setMobileOpen(false)}
              className="block py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
          <LanguageSelector isMobile={true} />
          <div className="flex gap-3 mt-4">
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onLogin}>{t('login')}</Button>
            <Button size="sm" className="w-full" onClick={onGetStarted}>{t('getStarted')}</Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

