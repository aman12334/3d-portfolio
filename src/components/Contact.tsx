import { MdCopyright } from "react-icons/md";
import "./styles/Contact.css";
import PretextReveal from "./ui/PretextReveal";
import ProfessionalConnect from "./ui/get-in-touch";

const Contact = () => {
  return (
    <div className="contact-section section-container" id="contact">
      <div className="contact-container">
        <PretextReveal as="h3" className="section-title" text="Contact" />
        <div className="contact-flex">
          <div className="contact-box contact-connect-box">
            <ProfessionalConnect />
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
