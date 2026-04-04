import { useEffect, useMemo, useState } from "react";
import "./styles/About.css";
import PretextReveal from "./ui/PretextReveal";
import CharacterFlowText from "./ui/CharacterFlowText";

const ABOUT_TEXT = `I am a product manager focused on platform products, internal tools, and
operational systems. I work in environments where workflows are manual,
data is fragmented, and execution breaks at scale, then turn those
constraints into reliable, measurable systems.

Across supply chain, fintech, and enterprise contexts, I have built
forecasting models, decision-support tools, workflow automation, and
integrations used by operators, analysts, and leadership teams. I care
deeply about clear system boundaries, disciplined execution, and
long-term stability over short-term polish.

I hold an MBA from the University of Maryland, Robert H. Smith
School of Business, and I am especially interested in applying data,
automation, and AI to real-world operational problems.`;

const About = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isSettled, setIsSettled] = useState(false);

  useEffect(() => {
    const handle = () => {
      const section = document.getElementById("about");
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      const startY = vh * 0.74;
      const settleY = vh * 0.2;
      const progress = (startY - rect.top) / Math.max(1, startY - settleY);
      const clamped = Math.max(0, Math.min(1, progress));
      setScrollProgress(clamped);

      const fullyOpen = rect.top <= settleY && rect.bottom >= vh * 0.88;
      setIsSettled(fullyOpen);
    };

    handle();
    window.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", handle);
    return () => {
      window.removeEventListener("scroll", handle);
      window.removeEventListener("resize", handle);
    };
  }, []);

  const flowReveal = useMemo(() => Math.max(0, Math.min(1, scrollProgress)), [scrollProgress]);

  return (
    <div className="about-section" id="about">
      <div className="about-me">
        <PretextReveal as="h3" className="title" text="About Me" />
        {!isSettled ? (
          <CharacterFlowText
            className="para about-pretext-para"
            text={ABOUT_TEXT}
            revealProgress={flowReveal}
          />
        ) : (
          <p className="para about-static-para">{ABOUT_TEXT}</p>
        )}
      </div>
    </div>
  );
};

export default About;
