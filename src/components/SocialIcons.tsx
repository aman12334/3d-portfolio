import {
  FaEnvelope,
  FaGithub,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa6";
import "./styles/SocialIcons.css";

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
            href="https://www.youtube.com/@amantiwarri"
            target="_blank"
            rel="noreferrer"
          >
            <FaYoutube />
          </a>
        </span>
        <span>
          <a href="mailto:amant10@umd.edu">
            <FaEnvelope />
          </a>
        </span>
      </div>
    </div>
  );
};

export default SocialIcons;
