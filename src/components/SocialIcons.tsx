import {
  FaEnvelope,
  FaGlobe,
  FaGithub,
  FaLinkedinIn,
} from "react-icons/fa6";
import "./styles/SocialIcons.css";
import { TbNotes } from "react-icons/tb";
import HoverLinks from "./HoverLinks";

const SocialIcons = () => {
  return (
    <div className="icons-section">
      <div className="social-icons" data-cursor="icons" id="social">
        <span>
          <a
            href="https://github.com/aman12334"
            target="_blank"
            rel="noreferrer"
          >
            <FaGithub />
          </a>
        </span>
        <span>
          <a
            href="https://www.linkedin.com/in/amantiwarri"
            target="_blank"
            rel="noreferrer"
          >
            <FaLinkedinIn />
          </a>
        </span>
        <span>
          <a
            href="https://www.amantiwarri.com/"
            target="_blank"
            rel="noreferrer"
          >
            <FaGlobe />
          </a>
        </span>
        <span>
          <a
            href="mailto:amant10@umd.edu"
          >
            <FaEnvelope />
          </a>
        </span>
      </div>
      <a
        className="resume-button"
        href="mailto:amant10@umd.edu"
      >
        <HoverLinks text="EMAIL" />
        <span>
          <TbNotes />
        </span>
      </a>
    </div>
  );
};

export default SocialIcons;
