import StackedPanels from "./stacked-panels-cursor-intereactive-component";
import "./stacked-panels.css";

export default function StackedPanelsDemo() {
  return (
    <section className="sp-demo">
      <div className="sp-noise" />
      <p className="sp-top-label">Interactive Project Depth</p>
      <div className="sp-content">
        <StackedPanels />
      </div>
      <p className="sp-bottom-label">Move cursor to interact</p>
    </section>
  );
}
