import { PropsWithChildren } from "react";
import "./styles/Landing.css";
import PretextReveal from "./ui/PretextReveal";

const Landing = ({ children }: PropsWithChildren) => {
  return (
    <>
      <div className="landing-section" id="landingDiv">
        <div className="landing-container">
          <div className="landing-intro">
            <PretextReveal as="h2" text="Hello! I'm" />
            <h1>
              AMAN
              <br />
              <span>TIWARI</span>
            </h1>
          </div>
          <div className="landing-info">
            <PretextReveal as="h3" text="Product Manager" />
            <h2 className="landing-info-h2">
              <div className="landing-h2-1">Platforms</div>
              <div className="landing-h2-2">AI Workflows</div>
            </h2>
            <h2>
              <div className="landing-h2-info">Operations</div>
              <div className="landing-h2-info-1">Systems</div>
            </h2>
          </div>
        </div>
        {children}
      </div>
    </>
  );
};

export default Landing;
