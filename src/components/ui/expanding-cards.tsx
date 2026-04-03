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

    React.useEffect(() => {
      const handleResize = () => {
        setIsDesktop(window.innerWidth >= 1024);
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    const gridStyle = React.useMemo(() => {
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
    }, [activeIndex, isDesktop, items]);

    if (items.length === 0) {
      return null;
    }

    return (
      <ul
        className={cn("expanding-cards", className)}
        style={gridStyle}
        ref={ref}
        onMouseLeave={() => setActiveIndex(null)}
        {...props}
      >
        {items.map((item, index) => {
          const isActive = activeIndex === index;
          return (
            <li
              key={item.id}
              className={cn("expanding-card", isActive && "expanding-card-active")}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
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

              <article className="expanding-card-content">
                <p className="expanding-card-title-collapsed">{item.title}</p>

                <div className="expanding-card-title-active-wrap">
                  <span className="expanding-card-icon">{item.icon ?? <Building2 size={20} />}</span>
                  {item.year && <p className="expanding-card-year">{item.year}</p>}
                </div>

                <h3 className="expanding-card-role">{item.role ?? item.title}</h3>
                <h4 className="expanding-card-company">{item.title}</h4>
                <p className="expanding-card-description">{item.description}</p>
              </article>
            </li>
          );
        })}
      </ul>
    );
  }
);

ExpandingCards.displayName = "ExpandingCards";
