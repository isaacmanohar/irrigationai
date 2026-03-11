import { User, Lightbulb, FlaskConical, Building2 } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";

const audiences = [
  {
    icon: User,
    title: "Small & Medium Farmers",
    desc: "Affordable precision irrigation tools designed for farms of any scale.",
  },
  {
    icon: Lightbulb,
    title: "Agri‑Tech Startups",
    desc: "Build on GraminLink's data platform to create innovative farming solutions.",
  },
  {
    icon: FlaskConical,
    title: "Smart Farming Researchers",
    desc: "Access real‑time field data and satellite imagery for agricultural research.",
  },
  {
    icon: Building2,
    title: "Agricultural Organizations",
    desc: "Deploy scalable irrigation intelligence across large agricultural programs.",
  },
];

const AudienceSection = () => (
  <section className="py-24 bg-card border-y border-border">
    <div className="container">
      <ScrollReveal className="text-center mb-14">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary mb-3">
          Who It's For
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-extrabold">
          Built for every stakeholder in agriculture
        </h2>
      </ScrollReveal>
      <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {audiences.map((a, i) => (
          <StaggerItem key={i}>
            <div className="rounded-xl border border-border bg-background/50 p-6 text-center hover:border-primary/20 transition-colors h-full">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <a.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-bold text-sm mb-2">{a.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{a.desc}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  </section>
);

export default AudienceSection;
