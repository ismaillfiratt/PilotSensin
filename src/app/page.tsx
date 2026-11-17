import Navbar            from "@/components/landing/Navbar";
import Hero              from "@/components/landing/Hero";
import PainPoints        from "@/components/landing/PainPoints";
import SolutionDashboard from "@/components/landing/SolutionDashboard";
import ModulesBento      from "@/components/landing/ModulesBento";
import HowItWorks        from "@/components/landing/HowItWorks";
import DeepDive          from "@/components/landing/DeepDive";
import Pricing           from "@/components/landing/Pricing";
import FAQ               from "@/components/landing/FAQ";
import Footer            from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <PainPoints />
        <SolutionDashboard />
        <ModulesBento />
        <HowItWorks />
        <DeepDive />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
