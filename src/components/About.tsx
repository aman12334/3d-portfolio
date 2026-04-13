import { useEffect, useMemo, useState } from "react";
import "./styles/About.css";
import PretextReveal from "./ui/PretextReveal";
import CharacterFlowText from "./ui/CharacterFlowText";

const ABOUT_PARAGRAPHS = [
  "I am a product manager focused on platform products, internal tools, and operational systems. I work in environments where workflows are manual, data is fragmented, and execution breaks at scale, then turn those constraints into reliable, measurable systems.",
  "Across supply chain, fintech, and enterprise contexts, I have built forecasting models, decision-support tools, workflow automation, and integrations used by operators, analysts, and leadership teams. I care deeply about clear system boundaries, disciplined execution, and long-term stability over short-term polish.",
  "I hold an MBA from the University of Maryland, Robert H. Smith School of Business, and I am especially interested in applying data, automation, and AI to real-world operational problems.",
];

const ABOUT_TEXT = ABOUT_PARAGRAPHS.join("\n\n");

const About = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isSettled, setIsSettled] = useState(false);

  useEffect(() => {
    let rafId = 0;

    const handle = () => {
      const section = document.getElementById("about");
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      const startY = vh * 0.74;
      const settleY = vh * 0.2;
      const progress = (startY - rect.top) / Math.max(1, startY - settleY);
      const clamped = Math.max(0, Math.min(1, progress));
      setScrollProgress((prev) => (Math.abs(prev - clamped) > 0.001 ? clamped : prev));

      const sectionInView = rect.bottom > vh * 0.12 && rect.top < vh * 0.9;
      setIsSettled((prev) => {
        if (!sectionInView) return false;
        if (prev) {
          return clamped >= 0.92;
        }
        return clamped >= 0.995;
      });
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        handle();
      });
    };

    handle();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", handle);
    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", handle);
    };
  }, []);

  const flowReveal = useMemo(() => Math.max(0, Math.min(1, scrollProgress)), [scrollProgress]);

  return (
    <div className="about-section" id="about">
      <div className="about-me">
        <PretextReveal as="h3" className="title section-title" text="About Me" />
        {!isSettled ? (
          <CharacterFlowText
            className="para about-copy about-pretext-para"
            text={ABOUT_TEXT}
            revealProgress={flowReveal}
          />
        ) : (
          <div className="para about-copy about-static-para">
            {ABOUT_PARAGRAPHS.map((paragraph) => (
              <p key={paragraph} className="about-paragraph">
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default About;
