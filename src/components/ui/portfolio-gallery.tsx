"use client";

import { useCallback, useState } from "react";
import { motion } from "motion/react";
import "../styles/portfolio-gallery.css";

export interface PortfolioItem {
  title: string;
  subtitle: string;
  description: string;
  image: string;
}

interface PortfolioGalleryProps {
  title?: string;
  items: PortfolioItem[];
  className?: string;
}

export default function PortfolioGallery({
  title = "Core Focus Areas",
  items,
  className = "",
}: PortfolioGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const handleStackMove = useCallback(
    (clientX: number, container: HTMLDivElement) => {
      const rect = container.getBoundingClientRect();
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      const ratio = rect.width === 0 ? 0 : x / rect.width;
      const nextIndex = Math.round(ratio * (items.length - 1));
      setActiveIndex(nextIndex);
    },
    [items.length]
  );

  return (
    <section
      className={`portfolio-gallery ${className}`.trim()}
      onMouseLeave={() => setActiveIndex(0)}
    >
      <h3 className="portfolio-gallery-title">{title}</h3>

      <div
        className="portfolio-stack"
        role="list"
        aria-label={title}
        onMouseMove={(e) => handleStackMove(e.clientX, e.currentTarget)}
        onClick={(e) => handleStackMove(e.clientX, e.currentTarget)}
      >
        {items.map((item, index) => {
          const distance = index - activeIndex;
          const isActive = index === activeIndex;

          return (
            <motion.button
              key={item.title}
              type="button"
              role="listitem"
              className={`portfolio-card ${isActive ? "is-active" : "is-inactive"}`}
              tabIndex={-1}
              initial={false}
              animate={{
                x: distance * 112,
                y: isActive ? -30 : Math.abs(distance) * 8,
                scale: isActive ? 1.06 : 0.9,
                rotateY: isActive ? 0 : distance < 0 ? -16 : 16,
                zIndex: isActive ? 30 : 20 - Math.abs(distance),
                opacity: isActive ? 1 : 0.3,
                filter: isActive ? "blur(0px)" : "blur(0.4px)",
              }}
              transition={{
                type: "spring",
                stiffness: 170,
                damping: 20,
                mass: 0.72,
              }}
            >
              <img src={item.image} alt={item.title} loading="lazy" />
              <span className="portfolio-overlay" />
              <span className="portfolio-label">{item.title}</span>
            </motion.button>
          );
        })}
      </div>

      <motion.article
        key={items[activeIndex]?.title}
        className="portfolio-copy"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        <p className="portfolio-copy-kicker">{items[activeIndex]?.subtitle}</p>
        <h4>{items[activeIndex]?.title}</h4>
        <p>{items[activeIndex]?.description}</p>
      </motion.article>
    </section>
  );
}
