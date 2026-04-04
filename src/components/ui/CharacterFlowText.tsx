import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { layoutNextLine, prepareWithSegments } from "@chenglou/pretext";

type Cursor = { segmentIndex: number; graphemeIndex: number };
type Slot = { x: number; width: number };
type Run = { text: string; x: number; y: number };
type DisplayRun = Run & { opacity: number };

type AlphaMask = {
  left: number;
  top: number;
  width: number;
  height: number;
  sampleWidth: number;
  sampleHeight: number;
  alpha: Uint8ClampedArray;
};

type Props = {
  text: string;
  className?: string;
  blockLinesOnDesktop?: boolean;
  revealProgress?: number;
};

const MAX_LINES = 260;
const MIN_SLOT_WIDTH = 120;
const H_PAD = 12;
const V_PAD = 3;
const LERP = 0.18;

function sameCursor(a: Cursor, b: Cursor): boolean {
  return a.segmentIndex === b.segmentIndex && a.graphemeIndex === b.graphemeIndex;
}

function buildCharacterMask(): AlphaMask | null {
  const canvas = document.querySelector(".character-model canvas");
  if (!(canvas instanceof HTMLCanvasElement)) return null;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return null;

  try {
    const sampleWidth = 320;
    const sampleHeight = Math.max(120, Math.round((sampleWidth * rect.height) / rect.width));
    const temp = document.createElement("canvas");
    temp.width = sampleWidth;
    temp.height = sampleHeight;
    const ctx = temp.getContext("2d");
    if (!ctx) return null;
    ctx.clearRect(0, 0, sampleWidth, sampleHeight);
    ctx.drawImage(canvas, 0, 0, sampleWidth, sampleHeight);
    const image = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      sampleWidth,
      sampleHeight,
      alpha: image.data,
    };
  } catch {
    return null;
  }
}

function getBandIntervalFromMask(
  mask: AlphaMask,
  bandTop: number,
  bandBottom: number,
): { left: number; right: number } | null {
  const localTop = ((bandTop - mask.top) / mask.height) * mask.sampleHeight;
  const localBottom = ((bandBottom - mask.top) / mask.height) * mask.sampleHeight;
  const y0 = Math.max(0, Math.floor(localTop));
  const y1 = Math.min(mask.sampleHeight - 1, Math.ceil(localBottom));
  if (y1 < 0 || y0 >= mask.sampleHeight) return null;

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  const threshold = 26;

  for (let y = y0; y <= y1; y += 1) {
    for (let x = 0; x < mask.sampleWidth; x += 1) {
      const alphaIndex = (y * mask.sampleWidth + x) * 4 + 3;
      const a = mask.alpha[alphaIndex] ?? 0;
      if (a < threshold) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
  }

  if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return null;

  const left = mask.left + (minX / mask.sampleWidth) * mask.width;
  const right = mask.left + ((maxX + 1) / mask.sampleWidth) * mask.width;
  return { left, right };
}

const CharacterFlowText = ({
  text,
  className,
  blockLinesOnDesktop = true,
  revealProgress = 1,
}: Props) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [displayRuns, setDisplayRuns] = useState<DisplayRun[]>([]);
  const targetRunsRef = useRef<Run[]>([]);
  const [heightPx, setHeightPx] = useState(0);
  const [fontCss, setFontCss] = useState("500 16px Geist, sans-serif");
  const [lineHeightPx, setLineHeightPx] = useState(28);

  const computeTargets = useCallback(() => {
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
    const useMask = blockLinesOnDesktop && window.innerWidth >= 1025;
    const mask = useMask ? buildCharacterMask() : null;

    const runs: Run[] = [];
    let cursor: Cursor = { segmentIndex: 0, graphemeIndex: 0 };
    let y = 0;

    for (let lineNo = 0; lineNo < MAX_LINES; lineNo += 1) {
      const bandTop = hostRect.top + y;
      const bandBottom = bandTop + lineHeight;
      let slots: Slot[] = [{ x: 0, width }];

      if (mask) {
        const interval = getBandIntervalFromMask(mask, bandTop - V_PAD, bandBottom + V_PAD);
        if (interval) {
          const blockLeft = interval.left - hostRect.left - H_PAD;
          const blockRight = interval.right - hostRect.left + H_PAD;
          const leftSlot: Slot = { x: 0, width: Math.max(0, blockLeft) };
          const rightSlot: Slot = {
            x: Math.max(0, blockRight),
            width: Math.max(0, width - blockRight),
          };
          const carved = [leftSlot, rightSlot].filter((s) => s.width >= MIN_SLOT_WIDTH);
          if (carved.length > 0) slots = carved;
        }
      }

      let progressed = false;
      for (let s = 0; s < slots.length; s += 1) {
        const slot = slots[s]!;
        const line = layoutNextLine(prepared, cursor, slot.width);
        if (!line) continue;
        if (sameCursor(cursor, line.end as Cursor)) continue;

        runs.push({ text: line.text, x: slot.x, y });
        cursor = line.end as Cursor;
        progressed = true;
      }

      if (!progressed) {
        const fallback = layoutNextLine(prepared, cursor, width);
        if (!fallback || sameCursor(cursor, fallback.end as Cursor)) break;
        runs.push({ text: fallback.text, x: 0, y });
        cursor = fallback.end as Cursor;
      }

      y += lineHeight;
    }

    targetRunsRef.current = runs;
    setHeightPx(Math.max(y, lineHeight));
  }, [blockLinesOnDesktop, text]);

  useEffect(() => {
    computeTargets();
    const host = hostRef.current;

    let raf = 0;
    let running = true;

    const ro = new ResizeObserver(() => computeTargets());
    if (host) ro.observe(host);

    const onScroll = () => computeTargets();
    const onResize = () => computeTargets();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    const retargetTimer = window.setInterval(computeTargets, 120);

    const step = () => {
      if (!running) return;
      const targets = targetRunsRef.current;

      setDisplayRuns((prev) => {
        const next: DisplayRun[] = targets.map((t, i) => {
          const current = prev[i];
          if (!current) {
            return { ...t, opacity: 1 };
          }
          return {
            text: t.text,
            x: current.x + (t.x - current.x) * LERP,
            y: current.y + (t.y - current.y) * LERP,
            opacity: 1,
          };
        });
        return next;
      });

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      window.clearInterval(retargetTimer);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [computeTargets]);

  const runs = useMemo(() => {
    if (revealProgress >= 0.999) return displayRuns;
    const totalChars = displayRuns.reduce((sum, run) => sum + run.text.length, 0);
    const visibleChars = Math.max(0, Math.floor(totalChars * Math.max(0, Math.min(1, revealProgress))));
    let remaining = visibleChars;
    const sliced: DisplayRun[] = [];
    for (let i = 0; i < displayRuns.length; i += 1) {
      const run = displayRuns[i]!;
      if (remaining <= 0) break;
      const take = Math.min(remaining, run.text.length);
      sliced.push({
        ...run,
        text: run.text.slice(0, take),
      });
      remaining -= take;
    }
    return sliced;
  }, [displayRuns, revealProgress]);

  return (
    <div
      ref={hostRef}
      className={className}
      style={{ position: "relative", height: heightPx || "auto" }}
    >
      {runs.map((run, idx) => (
        <span
          key={`${idx}-${run.text.length}`}
          style={{
            position: "absolute",
            left: run.x,
            top: run.y,
            font: fontCss,
            lineHeight: `${lineHeightPx}px`,
            whiteSpace: "pre",
            opacity: run.opacity,
            willChange: "left, top",
          }}
        >
          {run.text}
        </span>
      ))}
    </div>
  );
};

export default CharacterFlowText;
