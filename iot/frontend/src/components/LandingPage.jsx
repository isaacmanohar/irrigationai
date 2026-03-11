import Navbar from "./Navbar";
import HeroSection from "./HeroSection";
import ProblemSection from "./ProblemSection";
import SolutionsSection from "./SolutionsSection";
import FeaturesSection from "./FeaturesSection";
import DashboardPreview from "./DashboardPreview";
import HowItWorks from "./HowItWorks";
import ImpactSection from "./ImpactSection";
import AudienceSection from "./AudienceSection";
import CTASection from "./CTASection";
import Footer from "./Footer";

const LandingPage = ({ onLogin, onGetStarted }) => (
    <>
        <Navbar onLogin={onLogin} onGetStarted={onGetStarted} />
        <HeroSection onGetStarted={onGetStarted} />
        <ProblemSection />
        <SolutionsSection id="solutions" />
        <FeaturesSection id="features" />
        <DashboardPreview id="dashboard" />
        <HowItWorks id="how-it-works" />
        <ImpactSection />
        <AudienceSection />
        <CTASection onGetStarted={onGetStarted} />
        <Footer onLogin={onLogin} onGetStarted={onGetStarted} />
    </>
);

export default LandingPage;
