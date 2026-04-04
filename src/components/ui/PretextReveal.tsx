import { useEffect, useRef, useState } from "react";
import { layoutWithLines, prepareWithSegments } from "@chenglou/pretext";
import "../styles/PretextReveal.css";

type Props = {
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "div" | "span";
  text: string;
  className?: string;
  lineStaggerMs?: number;
};

const PretextReveal = ({
  as = "div",
  text,
  className,
  lineStaggerMs = 70,
}: Props) => {
  const Tag = as;
  const ref = useRef<HTMLDivElement | null>(null);
  const [lines, setLines] = useState<string[]>([text]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const recalc = () => {
      const width = Math.max(1, node.clientWidth);
      const style = window.getComputedStyle(node);
      const fontSize = Number.parseFloat(style.fontSize || "16") || 16;
      const rawLineHeight = Number.parseFloat(style.lineHeight || "");
      const lineHeight = Number.isFinite(rawLineHeight)
        ? rawLineHeight
        : fontSize * 1.2;

      const font = `${style.fontStyle || "normal"} ${style.fontWeight || "500"} ${style.fontSize || "16px"} ${style.fontFamily || "sans-serif"}`;

      try {
        const prepared = prepareWithSegments(text, font);
        const result = layoutWithLines(prepared, width, lineHeight);
        if (result.lines.length > 0) {
          setLines(result.lines.map((line) => line.text));
          return;
        }
      } catch {
        // Fall through to simple text fallback.
      }

      setLines([text]);
    };

    recalc();
    const ro = new ResizeObserver(() => recalc());
    ro.observe(node);
    return () => ro.disconnect();
  }, [text]);

  return (
    <Tag ref={ref as unknown as never} className={`pretext-reveal ${className ?? ""}`}>
      {lines.map((line, index) => (
        <span
          key={`${line}-${index}`}
          className="pretext-reveal-line"
          style={{ animationDelay: `${index * lineStaggerMs}ms` }}
        >
          {line}
        </span>
      ))}
    </Tag>
  );
};

export default PretextReveal;
