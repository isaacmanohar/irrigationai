import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

const slides = [
  {
    label: "Precision Agriculture",
    title: "AI‑Powered Precision Irrigation for",
    highlight: "Smarter Farming",
    desc: "Monitor crop health, track soil moisture, and automate irrigation using IoT sensors, satellite data, and AI insights.",
    cta1: "Get Started",
    cta2: "View Dashboard Demo",
    videoId: "O4c4vZVQmFE",
  },
  {
    label: "Data-Driven Insights",
    title: "Turn field data into",
    highlight: "Real‑World Results",
    desc: "From soil health to yield maps, get actionable insights delivered straight to your device in real time.",
    cta1: "Get Started",
    cta2: "See How It Works",
    videoId: "ik5NOdwFAgc",
  },
  {
    label: "Smart Hardware",
    title: "Connected sensors for",
    highlight: "Every Acre",
    desc: "Our IoT-enabled hardware adapts to your fields — monitoring, measuring, and optimizing season after season.",
    cta1: "Get Started",
    cta2: "View Hardware",
    videoId: "bZ5be7agkv4",
  },
];

const HeroSection = ({ onGetStarted }) => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [paused]);

  const slide = slides[active];

  return (
    <section className="relative h-screen min-h-[600px] flex items-center overflow-hidden">
      {/* Background videos */}
      {slides.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === active ? 1 : 0 }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${s.videoId}?autoplay=1&mute=1&loop=1&playlist=${s.videoId}&controls=0&showinfo=0&modestbranding=1&rel=0&disablekb=1&playsinline=1`}
            title={s.label}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] min-w-full min-h-full pointer-events-none"
            style={{ border: "none" }}
            allow="autoplay; encrypted-media"
            tabIndex={-1}
          />
        </div>
      ))}

      {/* Overlay */}
      <div className="absolute inset-0 bg-background/70" />

      {/* Content */}
      <div className="relative z-10 container pt-16">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-6 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {slide.label}
          </div>
          <h1
            key={active}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6 animate-fade-in-up"
          >
            {slide.title}{" "}
            <span className="text-primary">{slide.highlight}</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-lg animate-fade-in">
            {slide.desc}
          </p>
          <div className="flex flex-wrap gap-4 animate-fade-in">
            <Button size="lg" className="gap-2" onClick={onGetStarted}>
              {slide.cta1} <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="lg" className="gap-2 border-foreground/20 text-foreground hover:bg-foreground/10" onClick={onGetStarted}>
              <Play className="w-4 h-4" /> {slide.cta2}
            </Button>
          </div>
        </div>
      </div>

      {/* Tab indicators */}
      <div className="absolute bottom-12 left-0 right-0 z-10">
        <div className="container flex items-center gap-8">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => { setActive(i); setPaused(true); }}
              className={`relative pb-3 text-sm font-semibold transition-colors ${i === active ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
                }`}
            >
              {s.label}
              {i === active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
