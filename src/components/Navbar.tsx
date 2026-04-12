import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HoverLinks from "./HoverLinks";
import { gsap } from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import "./styles/Navbar.css";

gsap.registerPlugin(ScrollSmoother, ScrollTrigger);
export let smoother: ScrollSmoother;

const Navbar = () => {
  useEffect(() => {
    smoother?.kill();
    smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 0.45,
      speed: 1.7,
      effects: true,
      autoResize: true,
      ignoreMobileResize: true,
    });

    smoother.scrollTop(0);
    smoother.paused(true);

    const handleLinkClick = (e: Event) => {
      if (window.innerWidth <= 1024) return;
      const target = e.currentTarget as HTMLAnchorElement | null;
      if (!target) return;
      const section = target.getAttribute("data-href");
      if (!section) return;
      e.preventDefault();
      smoother.scrollTo(section, true, "top top");
    };

    const links = Array.from(document.querySelectorAll(".header ul a")) as HTMLAnchorElement[];
    links.forEach((element) => element.addEventListener("click", handleLinkClick));

    const handleResize = () => {
      ScrollSmoother.refresh(true);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      links.forEach((element) => element.removeEventListener("click", handleLinkClick));
      window.removeEventListener("resize", handleResize);
      smoother?.kill();
    };
  }, []);
  return (
    <>
      <div className="header">
        <a href="/#" className="navbar-title" data-cursor="disable">
          Aman Tiwari
        </a>
        <ul>
          <li>
            <a data-href="#about" href="#about">
              <HoverLinks text="ABOUT" />
            </a>
          </li>
          <li>
            <a data-href="#career" href="#career">
              <HoverLinks text="WORK" />
            </a>
          </li>
          <li>
            <a data-href="#projects-start" href="#projects-start">
              <HoverLinks text="PROJECTS" />
            </a>
          </li>
          <li>
            <a data-href="#contact" href="#contact">
              <HoverLinks text="CONTACT" />
            </a>
          </li>
        </ul>
      </div>

      <div className="landing-circle1"></div>
      <div className="landing-circle2"></div>
      <div className="nav-fade"></div>
    </>
  );
};

export default Navbar;
