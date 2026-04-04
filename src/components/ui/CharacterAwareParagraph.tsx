import { useCallback, useEffect, useRef, useState } from "react";
import { layoutNextLine, prepareWithSegments } from "@chenglou/pretext";

type Cursor = {
  segmentIndex: number;
  graphemeIndex: number;
};

type Slot = {
  x: number;
  width: number;
};

type LineRun = {
  text: string;
  x: number;
  y: number;
};

type Props = {
  text: string;
  className?: string;
};

const MIN_SLOT_WIDTH = 108;
const MAX_LINES = 220;
const BAND_PAD_X = 10;
const BAND_PAD_Y = 4;

function getCharacterWrapRect(): DOMRect | null {
  const character = document.querySelector(".character-model");
  if (!(character instanceof HTMLElement)) return null;
  const r = character.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return null;

  // Approximate the visual silhouette that overlaps copy in desktop layout.
  const left = r.left + r.width * 0.04;
  const right = r.left + r.width * 0.62;
  const top = r.top + r.height * 0.05;
  const bottom = r.bottom - r.height * 0.04;

  return {
    x: left,
    y: top,
    left,
    right,
    top,
    bottom,
    width: right - left,
    height: bottom - top,
    toJSON: () => ({}),
  } as DOMRect;
}

function sameCursor(a: Cursor, b: Cursor): boolean {
  return a.segmentIndex === b.segmentIndex && a.graphemeIndex === b.graphemeIndex;
}

const CharacterAwareParagraph = ({ text, className }: Props) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [runs, setRuns] = useState<LineRun[]>([]);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [fontCss, setFontCss] = useState<string>("500 16px Geist, sans-serif");
  const [lineHeightPx, setLineHeightPx] = useState<number>(28);

  const recalc = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;

    const style = window.getComputedStyle(host);
    const width = Math.max(1, host.clientWidth);
    const fontSize = Number.parseFloat(style.fontSize || "16") || 16;
    const parsedLineHeight = Number.parseFloat(style.lineHeight || "");
    const lineHeight = Number.isFinite(parsedLineHeight) ? parsedLineHeight : fontSize * 1.35;
    const font = `${style.fontStyle || "normal"} ${style.fontWeight || "500"} ${style.fontSize || "16px"} ${style.fontFamily || "sans-serif"}`;

    setFontCss(font);
    setLineHeightPx(lineHeight);

    const prepared = prepareWithSegments(text, font, { whiteSpace: "pre-wrap" });
    const hostRect = host.getBoundingClientRect();
    const obstruction = window.innerWidth >= 1025 ? getCharacterWrapRect() : null;

    const nextRuns: LineRun[] = [];
    let cursor: Cursor = { segmentIndex: 0, graphemeIndex: 0 };
    let y = 0;

    for (let lineIndex = 0; lineIndex < MAX_LINES; lineIndex += 1) {
      const lineTop = hostRect.top + y;
      const lineBottom = lineTop + lineHeight;

      let slots: Slot[] = [{ x: 0, width }];
      if (
        obstruction &&
        lineBottom > obstruction.top - BAND_PAD_Y &&
        lineTop < obstruction.bottom + BAND_PAD_Y
      ) {
        const blockLeft = obstruction.left - hostRect.left - BAND_PAD_X;
        const blockRight = obstruction.right - hostRect.left + BAND_PAD_X;
        const leftSlot: Slot = { x: 0, width: Math.max(0, blockLeft) };
        const rightSlot: Slot = {
          x: Math.max(0, blockRight),
          width: Math.max(0, width - blockRight),
        };
        const carved = [leftSlot, rightSlot].filter((slot) => slot.width >= MIN_SLOT_WIDTH);
        if (carved.length > 0) slots = carved;
      }

      let progressedOnRow = false;
      for (let slotIndex = 0; slotIndex < slots.length; slotIndex += 1) {
        const slot = slots[slotIndex]!;
        const line = layoutNextLine(prepared, cursor, slot.width);
        if (!line) continue;
        if (sameCursor(cursor, line.end as Cursor)) continue;

        progressedOnRow = true;
        nextRuns.push({ text: line.text, x: slot.x, y });
        cursor = line.end as Cursor;
      }

      if (!progressedOnRow) {
        const fallback = layoutNextLine(prepared, cursor, width);
        if (!fallback || sameCursor(cursor, fallback.end as Cursor)) break;

        nextRuns.push({ text: fallback.text, x: 0, y });
        cursor = fallback.end as Cursor;
      }

      y += lineHeight;
    }

    setRuns(nextRuns);
    setContentHeight(Math.max(y, lineHeight));
  }, [text]);

  useEffect(() => {
    recalc();

    let raf = 0;
    const queueRecalc = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(recalc);
    };

    const host = hostRef.current;
    const ro = new ResizeObserver(queueRecalc);
    if (host) ro.observe(host);

    window.addEventListener("resize", queueRecalc);
    window.addEventListener("scroll", queueRecalc, { passive: true });
    const timer = window.setInterval(queueRecalc, 180);

    return () => {
      window.clearInterval(timer);
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", queueRecalc);
      window.removeEventListener("scroll", queueRecalc);
    };
  }, [recalc]);

  return (
    <div
      ref={hostRef}
      className={className}
      style={{ position: "relative", height: contentHeight || "auto" }}
    >
      {runs.map((run, idx) => (
        <span
          key={`${idx}-${run.x}-${run.y}-${run.text.length}`}
          style={{
            position: "absolute",
            left: run.x,
            top: run.y,
            font: fontCss,
            lineHeight: `${lineHeightPx}px`,
            whiteSpace: "pre",
            transition: "left 160ms linear, top 160ms linear",
          }}
        >
          {run.text}
        </span>
      ))}
    </div>
  );
};

export default CharacterAwareParagraph;
