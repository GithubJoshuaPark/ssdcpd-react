import type { FC } from "react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AboutSection } from "../sections/AboutSection";
import { Hero } from "../sections/Hero";
import { TimelineSection } from "../sections/TimelineSection";
import { TracksSection } from "../sections/TracksSection";

export const Cpd: FC = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Remove '#' from the hash
      const id = hash.replace("#", "");
      const element = document.getElementById(id);

      if (element) {
        // Small delay to ensure the content is rendered
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } else {
      // If no hash, scroll to top
      window.scrollTo(0, 0);
    }
  }, [hash]);

  return (
    <>
      <Hero />
      <TracksSection />
      <TimelineSection />
      <AboutSection />
    </>
  );
};
