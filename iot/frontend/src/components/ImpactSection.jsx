import { Droplets, Sprout, BarChart3 } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";

const stats = [
  {
    icon: Droplets,
    value: "Up to 30%",
    label: "Water Savings",
    desc: "Reduce water usage dramatically with precision irrigation scheduling.",
  },
  {
    icon: Sprout,
    value: "Healthier",
    label: "Crops",
    desc: "Prevent crop stress by irrigating at the right time with the right amount.",
  },
  {
    icon: BarChart3,
    value: "Real‑time",
    label: "Farm Insights",
    desc: "Enable data‑driven farming with live dashboards and actionable analytics.",
  },
];

const ImpactSection = () => (
  <section className="py-24 bg-background">
    <div className="container">
      <ScrollReveal className="text-center mb-14">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary mb-3">
          Impact
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-4">
          Why GraminLink matters
        </h2>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Reduce water usage, increase crop productivity, prevent crop stress, and enable data‑driven farming.
        </p>
      </ScrollReveal>
      <StaggerContainer className="grid md:grid-cols-3 gap-8">
        {stats.map((s, i) => (
          <StaggerItem key={i}>
            <div className="text-center rounded-xl border border-border bg-card p-8 hover:border-primary/20 transition-colors h-full">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <s.icon className="w-7 h-7 text-primary" />
              </div>
              <p className="font-display text-3xl font-extrabold text-primary mb-1">{s.value}</p>
              <p className="font-display font-bold text-base mb-2">{s.label}</p>
              <p className="text-muted-foreground text-sm">{s.desc}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  </section>
);

export default ImpactSection;
