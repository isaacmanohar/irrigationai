import { Radio, Satellite, BrainCircuit, Droplets } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";

const steps = [
  {
    num: "01",
    icon: Radio,
    title: "Sensors Collect Data",
    desc: "IoT sensors gather soil moisture, temperature, and environmental data from your fields.",
  },
  {
    num: "02",
    icon: Satellite,
    title: "Satellite Imagery Analyzes",
    desc: "Sentinel‑2 satellite imagery provides NDVI crop health analysis across your farm.",
  },
  {
    num: "03",
    icon: BrainCircuit,
    title: "AI Processes the Data",
    desc: "Machine learning models analyze all inputs to predict optimal irrigation schedules.",
  },
  {
    num: "04",
    icon: Droplets,
    title: "Farmers Get Recommendations",
    desc: "Receive clear, actionable irrigation guidance via dashboard or SMS alerts.",
  },
];

const HowItWorks = ({ id }) => (
  <section id={id} className="py-24 bg-card border-y border-border">
    <div className="container">
      <ScrollReveal className="text-center mb-14">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary mb-3">
          How It Works
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-extrabold">
          From sensors to smart decisions
        </h2>
      </ScrollReveal>
      <StaggerContainer className="grid md:grid-cols-4 gap-6">
        {steps.map((s, i) => (
          <StaggerItem key={i}>
            <div className="relative text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <s.icon className="w-6 h-6 text-primary" />
              </div>
              <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">
                Step {s.num}
              </span>
              <h3 className="font-display font-bold text-base mt-1 mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-7 left-[60%] w-[80%] border-t border-dashed border-border" />
              )}
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  </section>
);

export default HowItWorks;
