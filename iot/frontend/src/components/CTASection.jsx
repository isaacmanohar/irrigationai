import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const CTASection = ({ onGetStarted }) => (
  <section className="py-24 bg-background">
    <div className="container">
      <ScrollReveal variant="scaleIn">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 p-12 md:p-16 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-4">
            Start Smarter Irrigation Today
          </h2>
          <p className="text-muted-foreground text-base mb-8 max-w-md mx-auto">
            Join farmers across India who are saving water, boosting yields, and farming with confidence.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="gap-2" onClick={onGetStarted}>
              Create Account <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-foreground/20 text-foreground hover:bg-foreground/10"
              onClick={onGetStarted}
            >
              Try Dashboard
            </Button>
          </div>
        </div>
      </ScrollReveal>
    </div>
  </section>
);

export default CTASection;
