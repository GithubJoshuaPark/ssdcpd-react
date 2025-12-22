import type { FC } from "react";
import { AboutSection } from "../sections/AboutSection";
import { Hero } from "../sections/Hero";
import { TimelineSection } from "../sections/TimelineSection";
import { TracksSection } from "../sections/TracksSection";

export const Cpd: FC = () => {
  return (
    <>
      <Hero />
      <TracksSection />
      <TimelineSection />
      <AboutSection />
    </>
  );
};
