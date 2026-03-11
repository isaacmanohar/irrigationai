import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = ["Solutions", "Features", "How It Works", "Dashboard"];

const Navbar = ({ onLogin, onGetStarted }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <span className="font-display text-xl font-extrabold tracking-tight text-primary">
          GraminLink
        </span>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/ /g, "-")}`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={onLogin}>
            Log In
          </Button>
          <Button size="sm" onClick={onGetStarted}>Get Started</Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-b border-border px-6 pb-6 animate-fade-in">
          {navItems.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/ /g, "-")}`}
              onClick={() => setMobileOpen(false)}
              className="block py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {item}
            </a>
          ))}
          <div className="flex gap-3 mt-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onLogin}>Log In</Button>
            <Button size="sm" onClick={onGetStarted}>Get Started</Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
