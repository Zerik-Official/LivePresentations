import { useEffect } from "react";

import { CtaSection } from "@/features/landing/components/CtaSection";
import { FeaturesSection } from "@/features/landing/components/FeaturesSection";
import { HeroSection } from "@/features/landing/components/HeroSection";
import { HowItWorksSection } from "@/features/landing/components/HowItWorksSection";
import { LandingFooter } from "@/features/landing/components/LandingFooter";
import { LandingNav } from "@/features/landing/components/LandingNav";

export function LandingPage(): React.ReactNode {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("hypr-smooth-scroll");
    return () => root.classList.remove("hypr-smooth-scroll");
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-hypr-bg text-zinc-900 dark:text-zinc-100">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-225 hypr-grid" />
      <div aria-hidden className="pointer-events-none absolute -top-40 left-[8%] h-112 w-md rounded-full bg-hypr-cyan/20 blur-[120px] dark:bg-hypr-cyan/15" />
      <div aria-hidden className="pointer-events-none absolute top-40 right-[4%] h-104 w-104 rounded-full bg-hypr-violet/20 blur-[120px] dark:bg-hypr-violet/15" />
      <div aria-hidden className="pointer-events-none absolute top-280 left-1/3 h-96 w-[24rem] rounded-full bg-hypr-mint/10 blur-[120px]" />

      <LandingNav />
      <main className="relative">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
