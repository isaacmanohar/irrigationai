import { Droplets, AlertTriangle, WifiOff, CloudRain } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";

const problems = [
  { icon: Droplets, text: "Over‑irrigation wastes water" },
  { icon: AlertTriangle, text: "Under‑irrigation stresses crops" },
  { icon: WifiOff, text: "Farmers lack real‑time data" },
  { icon: CloudRain, text: "Climate conditions change rapidly" },
];

const ProblemSection = () => (
  <section className="py-24 bg-card border-y border-border">
    <div className="container">
      <ScrollReveal>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-destructive mb-3">
          The Problem
        </p>
      </ScrollReveal>
      <ScrollReveal delay={0.1}>
        <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-4 max-w-lg">
          Farming Still Relies on Guesswork
        </h2>
      </ScrollReveal>
      <ScrollReveal delay={0.2}>
        <p className="text-muted-foreground text-base mb-12 max-w-xl">
          Traditional irrigation methods lead to water waste and reduced crop yield.
        </p>
      </ScrollReveal>
      <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {problems.map((p, i) => (
          <StaggerItem key={i}>
            <div className="rounded-lg border border-border bg-background/50 p-6 flex flex-col items-start gap-4 hover:border-destructive/30 transition-colors h-full">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <p.icon className="w-5 h-5 text-destructive" />
              </div>
              <p className="font-display font-semibold text-sm">{p.text}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  </section>
);

export default ProblemSection;
