import { Sprout, Satellite, Bot, Droplets, Bell } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";

const features = [
  {
    icon: Sprout,
    title: "Soil Monitoring",
    desc: "Real‑time soil moisture tracking using IoT sensors.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Satellite,
    title: "Satellite Crop Health",
    desc: "NDVI analysis from Sentinel‑2 imagery.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: Bot,
    title: "AI Irrigation Recommendations",
    desc: "AI suggests optimal watering schedules.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Droplets,
    title: "Water Usage Analytics",
    desc: "Track how much water your farm uses.",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    desc: "SMS or dashboard alerts for irrigation needs.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
];

const FeaturesSection = ({ id }) => (
  <section id={id} className="py-24 bg-card border-y border-border">
    <div className="container">
      <ScrollReveal className="text-center mb-14">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary mb-3">
          Key Features
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-4">
          Everything you need to irrigate smarter
        </h2>
      </ScrollReveal>
      <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <StaggerItem key={i}>
            <div className="rounded-xl border border-border bg-background/50 p-6 hover:border-primary/20 transition-colors h-full">
              <div className={`w-11 h-11 rounded-lg ${f.bg} flex items-center justify-center mb-4`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="font-display font-bold text-base mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  </section>
);

export default FeaturesSection;
