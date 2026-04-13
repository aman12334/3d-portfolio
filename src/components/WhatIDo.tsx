import { useMemo } from "react";
import "./styles/WhatIDo.css";
import PortfolioGallery, { PortfolioItem } from "./ui/portfolio-gallery";

const WhatIDo = () => {
  const items = useMemo<PortfolioItem[]>(
    () => [
      {
        title: "Platform Product Management",
        subtitle: "CORE OPERATING SYSTEMS",
        description:
          "Designing platform products and internal systems that align stakeholders, reduce handoffs, and improve execution quality.",
        image:
          "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1400&q=80",
      },
      {
        title: "AI Workflows & Automation",
        subtitle: "PRACTICAL AI ENABLEMENT",
        description:
          "Turning AI into useful operator workflows with measurable outcomes across compliance, reporting, and decision support.",
        image:
          "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80",
      },
      {
        title: "Data Platforms & BI",
        subtitle: "SQL • TABLEAU • SNOWFLAKE",
        description:
          "Building KPI instrumentation and analytics foundations so teams can move from fragmented data to clear operating insight.",
        image:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80",
      },
      {
        title: "Multi-Agent Systems",
        subtitle: "LLMS + ORCHESTRATION",
        description:
          "Architecting reliable multi-agent systems with API contracts, workflow control, and guardrails for enterprise execution.",
        image:
          "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=1400&q=80",
      },
    ],
    []
  );

  return (
    <div className="whatIDO">
      <div className="what-shell">
        <h2 className="title section-title">
          W<span className="hat-h2">HAT</span>
          <div>
            I<span className="do-h2"> DO</span>
          </div>
        </h2>
        <div className="what-box-in">
          <PortfolioGallery title="Core Focus Areas" items={items} />
        </div>
      </div>
    </div>
  );
};

export default WhatIDo;
