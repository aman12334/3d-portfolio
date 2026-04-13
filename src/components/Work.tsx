import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Bot,
  Building2,
  ChartNoAxesCombined,
  FileSearch,
  PawPrint,
  Radar,
  Send,
} from "lucide-react";
import "./styles/Work.css";

type Project = {
  title: string;
  category: string;
  tools: string;
  image?: string;
  tileImage?: string;
  link: string;
  icon: JSX.Element;
  mediaType: "image" | "iframe" | "youtube";
  embedUrl?: string;
};

const projects: Project[] = [
  {
    title: "Github Metropolis",
    category: "Interactive City-Scale GitHub Visualization",
    tools:
      "A cyberpunk-style 3D city built with React + Vite + Three.js, where each building represents a GitHub user.",
    link: "https://github.com/aman12334/Github-metropolis",
    tileImage:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    icon: <Building2 size={18} />,
    mediaType: "iframe",
    embedUrl: "https://githubmetropolis.vercel.app",
  },
  {
    title: "OpsSentinel",
    category: "Operational Monitoring",
    tools: "Python, Observability, Alerts, Workflow Reliability",
    image:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1600&q=80",
    tileImage:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
    link: "https://github.com/aman12334/OpsSentinel#readme",
    icon: <Radar size={18} />,
    mediaType: "image",
  },
  {
    title: "Institutional AI Finance Agent",
    category: "Multi-Agent Finance Workflow",
    tools:
      "Agent Orchestration, Finance Workflows, Process Automation, Decision Support",
    image:
      "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1600&q=80",
    tileImage:
      "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1200&q=80",
    link: "https://github.com/aman12334/institutional-ai-finance-agent",
    icon: <Bot size={18} />,
    mediaType: "image",
  },
  {
    title: "AI-Driven Procurement Optimization Platform",
    category: "YouTube Demo (In-Card Playback)",
    tools:
      "RFP Uploads, Auto Requirement Extraction, Compliance Monitoring, AI-Driven Risk Alerts",
    link: "https://www.youtube.com/watch?v=7BGNm0PT3Vs",
    tileImage:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
    icon: <FileSearch size={18} />,
    mediaType: "youtube",
    embedUrl: "https://www.youtube.com/embed/7BGNm0PT3Vs",
  },
  {
    title: "Streamlining Microfinance Loan Disbursement",
    category: "YouTube Demo (In-Card Playback)",
    tools:
      "Reduced loan cycle from 10-45 days to 3-4 days, Women-focused microfinance, Product prototyping",
    link: "https://www.youtube.com/watch?v=yIdoWKgwwrI",
    tileImage:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
    icon: <ChartNoAxesCombined size={18} />,
    mediaType: "youtube",
    embedUrl: "https://www.youtube.com/embed/yIdoWKgwwrI",
  },
  {
    title: "PetAsUs",
    category: "YouTube Shorts Demo (In-Card Playback)",
    tools:
      "Pet services booking app with personalized onboarding, location-based discovery, ratings, real-time booking, and rescheduling reminders.",
    link: "https://www.youtube.com/shorts/U0v8PF6nVPc",
    tileImage: "https://img.youtube.com/vi/U0v8PF6nVPc/hqdefault.jpg",
    icon: <PawPrint size={18} />,
    mediaType: "youtube",
    embedUrl: "https://www.youtube.com/embed/U0v8PF6nVPc",
  },
  {
    title: "Telegram Focus Agent",
    category: "Automation Workflow Agent",
    tools:
      "Zero-budget focus workflow connecting macOS Focus, Telegram, Make, Google Sheets, and a hosted LLM to protect deep work.",
    link: "https://github.com/aman12334/Telegram-Focus-Agent",
    tileImage:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80",
    icon: <Send size={18} />,
    mediaType: "image",
  },
];

const Work = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isProjectOpen, setIsProjectOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [isYouTubePlaying, setIsYouTubePlaying] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const playerFrameRef = useRef<HTMLIFrameElement>(null);
  const centerIndex = Math.floor(projects.length / 2);
  const closedIndex = isMobile ? 0 : centerIndex;

  const focusIndex = hoveredIndex ?? (isProjectOpen ? activeIndex : closedIndex);
  const activeProject = projects[activeIndex];

  const handleStagePointerMove = (clientX: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const projected = Math.min(
      projects.length - 1,
      Math.floor(ratio * projects.length)
    );
    setHoveredIndex((prev) => (prev === projected ? prev : projected));
    setActiveIndex((prev) => (prev === projected ? prev : projected));
  };

  const tilePositions = useMemo(() => {
    return projects.map((_, i) => {
      if (!isProjectOpen) {
        const offset = i - closedIndex;
        const dist = Math.abs(offset);
        return {
          x: offset * (isMobile ? 16 : 52),
          y: dist * (isMobile ? 4 : 9),
          z: -dist * (isMobile ? 35 : 70),
          rotateY: offset * (isMobile ? -2.2 : -4),
          rotateX: offset * 0.6,
          scale: Math.max(isMobile ? 0.76 : 0.84, 1 - dist * (isMobile ? 0.07 : 0.05)),
          opacity: Math.max(0.25, 1 - dist * 0.11),
          zIndex: 180 - dist * 10,
        };
      }

      const hasPreview = hoveredIndex !== null;
      const offset = i - focusIndex;
      const isFocused = i === focusIndex;
      if (isFocused) {
        return {
          x: 0,
          y: isMobile ? -8 : -24,
          z: isMobile ? 180 : 320,
          rotateY: 0,
          rotateX: 0,
          scale: isMobile ? 1.03 : 1.12,
          opacity: 1,
          zIndex: 500,
        };
      }

      const dist = Math.abs(offset);
      const baseOpacity = hasPreview
        ? i < focusIndex
          ? 0.16
          : 0.22
        : 0.76;

      return {
        x: offset * (isMobile ? 36 : 142),
        y: offset * (isMobile ? 8 : 26) + dist * (isMobile ? 6 : 10) + (isMobile ? 4 : 12),
        z: (hasPreview ? -250 : -165) - dist * (isMobile ? 34 : 62),
        rotateY: offset * (isMobile ? -4 : -8),
        rotateX: offset * (isMobile ? 1 : 1.8),
        scale: hasPreview ? (isMobile ? 0.9 : 0.83) : isMobile ? 0.94 : 0.88,
        opacity: Math.max(0.08, baseOpacity - dist * 0.04),
        zIndex: 180 - dist * 12,
      };
    });
  }, [closedIndex, focusIndex, hoveredIndex, isMobile, isProjectOpen]);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const handleGestureProjectSelect = (event: Event) => {
      const detail = (event as CustomEvent<{ index?: number }>).detail;
      if (typeof detail?.index !== "number") return;
      const nextIndex = Math.max(0, Math.min(projects.length - 1, detail.index));
      setHoveredIndex(nextIndex);
      setActiveIndex(nextIndex);
      setIsProjectOpen(true);
    };

    window.addEventListener("gesture-select-project", handleGestureProjectSelect as EventListener);
    return () => {
      window.removeEventListener(
        "gesture-select-project",
        handleGestureProjectSelect as EventListener
      );
    };
  }, []);

  useEffect(() => {
    setIsYouTubePlaying(false);
  }, [activeProject.title]);

  const handleYouTubePlaybackToggle = () => {
    const iframe = playerFrameRef.current;
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.postMessage(
      JSON.stringify({
        event: "command",
        func: isYouTubePlaying ? "pauseVideo" : "playVideo",
        args: [],
      }),
      "*"
    );
    setIsYouTubePlaying((prev) => !prev);
  };

  const handleProjectTileClick = (index: number) => {
    if (isProjectOpen && activeIndex === index) {
      setIsProjectOpen(false);
      setHoveredIndex(null);
      setActiveIndex(closedIndex);
      return;
    }
    setActiveIndex(index);
    setHoveredIndex(index);
    setIsProjectOpen(true);
  };

  const handleProjectNavigate = (direction: -1 | 1) => {
    const baseIndex = hoveredIndex ?? activeIndex;
    const nextIndex = (baseIndex + direction + projects.length) % projects.length;
    setActiveIndex(nextIndex);
    setHoveredIndex(nextIndex);
  };

  return (
    <section
      className="work-section max-[767px]:px-2"
      id="projects"
      onMouseLeave={() => {
        setHoveredIndex(null);
        if (!isProjectOpen) {
          setActiveIndex(closedIndex);
        }
      }}
    >
      <div id="work" className="work-anchor" aria-hidden="true" />
      <div id="projects-start" className="work-anchor" aria-hidden="true" />
      <div className="work-container section-container max-[767px]:!w-full max-[767px]:!max-w-none">
        <h2 className="section-title max-[767px]:!mb-6 max-[767px]:!text-[2rem] max-[767px]:!leading-[1.03]">
          My <span className="accent">Work</span>
        </h2>

        <div className="work-stack-layout max-[767px]:!grid-cols-1 max-[767px]:!gap-4">
          <div
            ref={stageRef}
            className="work-stack-stage"
            onMouseLeave={() => {
              setHoveredIndex(null);
              if (!isProjectOpen) {
                setActiveIndex(closedIndex);
              }
            }}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              if (touch) handleStagePointerMove(touch.clientX);
            }}
          >
            <div className="work-stack-hit-zones" aria-hidden>
              <div
                className="work-stack-hit-zones-grid"
                style={{
                  gridTemplateColumns: `repeat(${projects.length}, minmax(0, 1fr))`,
                }}
              >
                {projects.map((project, i) => (
                  <button
                    key={`${project.title}-zone`}
                    type="button"
                    className="work-stack-hit-zone"
                    data-project-index={i}
                    onClick={() => handleProjectTileClick(i)}
                    onMouseEnter={() => {
                      setHoveredIndex(i);
                      setActiveIndex(i);
                    }}
                    onFocus={() => {
                      setHoveredIndex(i);
                      setActiveIndex(i);
                    }}
                    aria-label={`Preview ${project.title}`}
                  />
                ))}
              </div>
            </div>
            <div className="work-stack-scene">
              {projects.map((project, i) => (
                <motion.button
                  key={project.title}
                  type="button"
                  className={`work-stack-tile ${i === activeIndex ? "work-stack-tile-active" : ""}`}
                  data-project-index={i}
                  onMouseEnter={() => {
                    setHoveredIndex(i);
                    setActiveIndex(i);
                  }}
                  onFocus={() => {
                    setHoveredIndex(i);
                    setActiveIndex(i);
                  }}
                  onBlur={() => setHoveredIndex(null)}
                  onClick={() => handleProjectTileClick(i)}
                  animate={{
                    x: tilePositions[i].x,
                    y: tilePositions[i].y,
                    rotateY: tilePositions[i].rotateY,
                    rotateX: tilePositions[i].rotateX,
                    scale: tilePositions[i].scale,
                    opacity: tilePositions[i].opacity,
                  }}
                  transition={{
                    type: "tween",
                    ease: [0.22, 1, 0.36, 1],
                    duration: 0.9,
                  }}
                  style={{
                    translateZ: tilePositions[i].z,
                    zIndex: tilePositions[i].zIndex,
                  }}
                  aria-label={`Open ${project.title}`}
                  aria-pressed={i === activeIndex}
                >
                  <img
                    src={project.tileImage ?? project.image}
                    alt={project.title}
                    className="work-stack-tile-image"
                    loading="lazy"
                  />
                  <div className="work-stack-tile-overlay" />
                  <h3>{project.title}</h3>
                  <p>{project.category}</p>
                </motion.button>
              ))}
            </div>
            {isMobile ? (
              <>
                <button
                  type="button"
                  className="work-stack-nav-btn work-stack-nav-btn-left"
                  onClick={() => handleProjectNavigate(-1)}
                  aria-label="Previous project"
                >
                  {"<"}
                </button>
                <button
                  type="button"
                  className="work-stack-nav-btn work-stack-nav-btn-right"
                  onClick={() => handleProjectNavigate(1)}
                  aria-label="Next project"
                >
                  {">"}
                </button>
              </>
            ) : (
              <div className="work-stack-steps" aria-label="Project selector">
                {projects.map((project, i) => (
                  <button
                    key={`${project.title}-step`}
                    type="button"
                    className={`work-stack-step ${i === activeIndex ? "work-stack-step-active" : ""}`}
                    data-project-index={i}
                    onMouseEnter={() => {
                      setHoveredIndex(i);
                      setActiveIndex(i);
                    }}
                    onFocus={() => {
                      setHoveredIndex(i);
                      setActiveIndex(i);
                    }}
                    onClick={() => handleProjectTileClick(i)}
                    aria-label={`Select ${project.title}`}
                    aria-pressed={i === activeIndex}
                  />
                ))}
              </div>
            )}
          </div>

          {isProjectOpen ? (
          <motion.article
            key={activeProject.title}
            className="work-project-panel max-[767px]:rounded-2xl max-[767px]:border max-[767px]:border-[#bfd0e6] max-[767px]:bg-white/80 max-[767px]:p-4 max-[767px]:shadow-[0_10px_28px_rgba(15,47,95,0.12)]"
            initial={{ opacity: 0, x: 26 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <div className="work-project-head">
              <span className="work-project-icon">{activeProject.icon}</span>
              <div>
                <p className="work-project-category max-[767px]:!text-[10px] max-[767px]:!tracking-[0.08em]">
                  {activeProject.category}
                </p>
                <h3 className="max-[767px]:!text-[1.35rem] max-[767px]:!leading-[1.18]">
                  {activeProject.title}
                </h3>
              </div>
            </div>

            <p className="work-project-tools max-[767px]:!mt-2 max-[767px]:!text-[0.92rem] max-[767px]:!leading-[1.5]">
              {activeProject.tools}
            </p>

            <div className="work-project-media max-[767px]:!mt-3">
              {activeProject.mediaType === "iframe" && activeProject.embedUrl ? (
                <iframe
                  src={activeProject.embedUrl}
                  title={activeProject.title}
                  className={`work-project-embed ${
                    activeProject.title === "Github Metropolis"
                      ? "work-project-embed-metropolis"
                      : ""
                  } max-[767px]:!h-[56vw] max-[767px]:!min-h-[210px] max-[767px]:!max-h-[285px]`}
                  loading="lazy"
                  allow="fullscreen; autoplay"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : null}

              {activeProject.mediaType === "youtube" && activeProject.embedUrl ? (
                <iframe
                  ref={playerFrameRef}
                  src={`${activeProject.embedUrl}${
                    activeProject.embedUrl.includes("?") ? "&" : "?"
                  }enablejsapi=1&playsinline=1&rel=0`}
                  title={activeProject.title}
                  className="work-project-embed max-[767px]:!h-[56vw] max-[767px]:!min-h-[210px] max-[767px]:!max-h-[285px]"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : null}

              {activeProject.mediaType === "image" && activeProject.image ? (
                <img
                  src={activeProject.image}
                  alt={activeProject.title}
                  className="work-project-image max-[767px]:!max-h-[285px] max-[767px]:!rounded-xl"
                  loading="lazy"
                />
              ) : null}
            </div>

            <div className="work-project-links max-[767px]:!mt-3 max-[767px]:!gap-2">
              <a
                href={activeProject.link}
                target="_blank"
                rel="noreferrer"
                className="work-project-link max-[767px]:!px-3 max-[767px]:!py-2 max-[767px]:!text-[12px]"
                data-cursor="disable"
              >
                Open Source / Demo
              </a>

              {activeProject.mediaType === "youtube" ? (
                <button
                  type="button"
                  className="work-project-link max-[767px]:!px-3 max-[767px]:!py-2 max-[767px]:!text-[12px]"
                  data-cursor="disable"
                  onClick={handleYouTubePlaybackToggle}
                >
                  {isYouTubePlaying ? "Pause Demo" : "Play Demo"}
                </button>
              ) : null}

              {activeProject.title === "Github Metropolis" &&
              activeProject.embedUrl ? (
                <a
                  href={activeProject.embedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="work-project-link max-[767px]:!px-3 max-[767px]:!py-2 max-[767px]:!text-[12px]"
                  data-cursor="disable"
                >
                  Open in New Tab (Play)
                </a>
              ) : null}
            </div>
          </motion.article>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default Work;
