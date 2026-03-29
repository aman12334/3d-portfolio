import { MdArrowOutward, MdCopyright } from "react-icons/md";
import "./styles/Contact.css";

const Contact = () => {
  return (
    <div className="contact-section section-container" id="contact">
      <div className="contact-container">
        <h3>Contact</h3>
        <div className="contact-flex">
          <div className="contact-box">
            <h4>Connect</h4>
            <p>
              <a
                href="https://www.linkedin.com/in/amantiwarri"
                target="_blank"
                rel="noreferrer"
                data-cursor="disable"
              >
                LinkedIn — amantiwarri
              </a>
            </p>
            <p>
              <a href="mailto:amant10@umd.edu" data-cursor="disable">
                Email — amant10@umd.edu
              </a>
            </p>
            <h4>Education</h4>
            <p>
              MBA, University of Maryland (Robert H. Smith School of Business)
              — 2023-2025
            </p>
            <p>
              B.Tech, Electronics &amp; Instrumentation Engineering, Dr. APJ
              Abdul Kalam Azad Technical University — 2014-2018
            </p>
          </div>
          <div className="contact-box">
            <h4>Social</h4>
            <a
              href="https://github.com/aman12334"
              target="_blank"
              rel="noreferrer"
              data-cursor="disable"
              className="contact-social"
            >
              GitHub <MdArrowOutward />
            </a>
            <a
              href="https://www.linkedin.com/in/amantiwarri"
              target="_blank"
              rel="noreferrer"
              data-cursor="disable"
              className="contact-social"
            >
              LinkedIn <MdArrowOutward />
            </a>
            <a
              href="https://www.amantiwarri.com/"
              target="_blank"
              rel="noreferrer"
              data-cursor="disable"
              className="contact-social"
            >
              Website <MdArrowOutward />
            </a>
            <a
              href="mailto:amant10@umd.edu"
              data-cursor="disable"
              className="contact-social"
            >
              Email <MdArrowOutward />
            </a>
          </div>
          <div className="contact-box">
            <h2>
              Designed and Developed <br /> by <span>Aman Tiwari</span>
            </h2>
            <h5>
              <MdCopyright /> 2026
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
