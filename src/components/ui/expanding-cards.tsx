import * as React from "react";
import { Building2 } from "lucide-react";
import "./expanding-cards.css";

export interface CardItem {
  id: string | number;
  title: string;
  description: string;
  imgSrc: string;
  icon?: React.ReactNode;
  linkHref?: string;
  year?: string;
  role?: string;
}

interface ExpandingCardsProps extends React.HTMLAttributes<HTMLUListElement> {
  items: CardItem[];
  defaultActiveIndex?: number | null;
}

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export const ExpandingCards = React.forwardRef<HTMLUListElement, ExpandingCardsProps>(
  ({ className, items, defaultActiveIndex = null, ...props }, ref) => {
    const [activeIndex, setActiveIndex] = React.useState<number | null>(defaultActiveIndex);
    const [isDesktop, setIsDesktop] = React.useState(false);
    const [isMobileScroll, setIsMobileScroll] = React.useState(window.innerWidth < 768);
    const listRef = React.useRef<HTMLUListElement | null>(null);

    React.useEffect(() => {
      const handleResize = () => {
        setIsDesktop(window.innerWidth >= 1024);
        setIsMobileScroll(window.innerWidth < 768);
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    React.useEffect(() => {
      const handleGestureCareerSelect = (event: Event) => {
        const detail = (event as CustomEvent<{ index?: number }>).detail;
        if (typeof detail?.index !== "number") return;
        const nextIndex = Math.max(0, Math.min(items.length - 1, detail.index));
        setActiveIndex(nextIndex);
      };

      window.addEventListener("gesture-select-career", handleGestureCareerSelect as EventListener);
      return () => {
        window.removeEventListener(
          "gesture-select-career",
          handleGestureCareerSelect as EventListener
        );
      };
    }, [items.length]);

    const gridStyle = React.useMemo(() => {
      if (isMobileScroll) return {};
      if (items.length === 0) return {};

      if (activeIndex === null) {
        if (isDesktop) {
          return {
            gridTemplateColumns: items.map(() => "0.86fr").join(" "),
            gridTemplateRows: "1fr",
          };
        }
        return {
          gridTemplateRows: items.map(() => "1fr").join(" "),
          gridTemplateColumns: "1fr",
        };
      }

      if (isDesktop) {
        const columns = items
          .map((_, index) => (index === activeIndex ? "4.6fr" : "0.82fr"))
          .join(" ");
        return { gridTemplateColumns: columns, gridTemplateRows: "1fr" };
      }

      const rows = items
        .map((_, index) => (index === activeIndex ? "5fr" : "1fr"))
        .join(" ");
      return { gridTemplateRows: rows, gridTemplateColumns: "1fr" };
    }, [activeIndex, isDesktop, isMobileScroll, items]);

    if (items.length === 0) {
      return null;
    }

    return (
      <ul
        className={cn(
          "expanding-cards",
          isMobileScroll &&
            "expanding-cards-mobile max-[767px]:pb-3",
          className
        )}
        style={gridStyle}
        ref={(node) => {
          listRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        onMouseLeave={() => setActiveIndex(null)}
        {...props}
      >
        {items.map((item, index) => {
          const isActive = activeIndex === index;
          return (
            <li
              key={item.id}
              className={cn(
                "expanding-card",
                "expanding-card-mobile max-[767px]:!w-full max-[767px]:!max-w-none",
                isActive ? "max-[767px]:!min-h-[380px]" : "max-[767px]:!min-h-[110px]",
                isActive && "expanding-card-active"
              )}
              data-career-index={index}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onClick={() => setActiveIndex((prev) => (prev === index ? null : index))}
              tabIndex={0}
              data-active={isActive}
            >
              <div className="expanding-card-media">
                <img
                  src={item.imgSrc}
                  alt={item.title}
                  className="expanding-card-image"
                  loading="lazy"
                />
                <img
                  src={item.imgSrc}
                  alt={`${item.title} logo vertical`}
                  className="expanding-card-logo-collapsed"
                  loading="lazy"
                />
                <img
                  src={item.imgSrc}
                  alt={`${item.title} logo`}
                  className="expanding-card-logo-active"
                  loading="lazy"
                />
                <div className="expanding-card-overlay" />
              </div>

              <article className="expanding-card-content max-[767px]:!p-4">
                <p className="expanding-card-title-collapsed">{item.title}</p>

                <div className="expanding-card-title-active-wrap">
                  <span className="expanding-card-icon">{item.icon ?? <Building2 size={20} />}</span>
                  {item.year && <p className="expanding-card-year">{item.year}</p>}
                </div>

                <h3 className="expanding-card-role max-[767px]:!text-[1.02rem] max-[767px]:!leading-[1.2]">
                  {item.role ?? item.title}
                </h3>
                <h4 className="expanding-card-company max-[767px]:!text-[0.95rem] max-[767px]:!leading-[1.2]">
                  {item.title}
                </h4>
                <p className="expanding-card-description max-[767px]:!text-[0.79rem] max-[767px]:!leading-[1.4]">
                  {item.description}
                </p>
              </article>
            </li>
          );
        })}
      </ul>
    );
  }
);

ExpandingCards.displayName = "ExpandingCards";
