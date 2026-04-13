import { type MouseEvent, useEffect, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HoverLinks from "./HoverLinks";
import { gsap } from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import "./styles/Navbar.css";

gsap.registerPlugin(ScrollSmoother, ScrollTrigger);
export let smoother: ScrollSmoother | null = null;

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileMenu, setIsMobileMenu] = useState(window.innerWidth <= 900);
  const [isGyroEnabled, setIsGyroEnabled] = useState(
    () => localStorage.getItem("gyro-enabled") === "1"
  );

  useEffect(() => {
    const isDesktopViewport = () => window.innerWidth > 1024;

    const syncSmoother = () => {
      if (!isDesktopViewport()) {
        smoother?.kill();
        smoother = null;
        return;
      }

      if (!smoother) {
        smoother = ScrollSmoother.create({
          wrapper: "#smooth-wrapper",
          content: "#smooth-content",
          smooth: 0.45,
          speed: 1.7,
          effects: true,
          autoResize: true,
          ignoreMobileResize: true,
        });
      }

      const loadingCompleted = Boolean(document.querySelector("main.main-active"));
      if (!loadingCompleted) {
        smoother.scrollTop(0);
      }
      smoother.paused(!loadingCompleted);
      ScrollSmoother.refresh(true);
    };

    syncSmoother();

    const handleGestureNav = (e: Event) => {
      const detail = (e as CustomEvent<{ target?: string }>).detail;
      const section = detail?.target;
      if (!section) return;
      const nextSmoother = ScrollSmoother.get() || smoother;
      if (nextSmoother) {
        nextSmoother.scrollTo(section, true, "top top");
        return;
      }
      const fallback = document.querySelector(section);
      if (fallback instanceof HTMLElement) {
        fallback.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    window.addEventListener("gesture-nav-select", handleGestureNav as EventListener);

    const handleResize = () => {
      syncSmoother();
      const nextIsMobileMenu = window.innerWidth <= 900;
      setIsMobileMenu(nextIsMobileMenu);
      if (!nextIsMobileMenu) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("gesture-nav-select", handleGestureNav as EventListener);
      window.removeEventListener("resize", handleResize);
      smoother?.kill();
      smoother = null;
    };
  }, []);

  const handleMobileMenuClose = () => {
    if (window.innerWidth <= 900) {
      setMobileMenuOpen(false);
    }
  };

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, section: string) => {
    event.preventDefault();

    if (window.innerWidth > 1024) {
      const nextSmoother = ScrollSmoother.get() || smoother;
      if (nextSmoother) {
        nextSmoother.scrollTo(section, true, "top top");
        handleMobileMenuClose();
        return;
      }
    }

    const target = document.querySelector(section);
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    handleMobileMenuClose();
  };

  const handleGyroToggle = async () => {
    if (!isMobileMenu) return;
    if (isGyroEnabled) {
      localStorage.setItem("gyro-enabled", "0");
      setIsGyroEnabled(false);
      window.dispatchEvent(
        new CustomEvent("gyro-control-change", { detail: { enabled: false } })
      );
      return;
    }

    const orientationPermission = (
      window as Window & {
        DeviceOrientationEvent?: {
          requestPermission?: () => Promise<"granted" | "denied">;
        };
      }
    ).DeviceOrientationEvent?.requestPermission;
    const motionPermission = (
      window as Window & {
        DeviceMotionEvent?: {
          requestPermission?: () => Promise<"granted" | "denied">;
        };
      }
    ).DeviceMotionEvent?.requestPermission;

    let orientationGranted = true;
    let motionGranted = true;

    if (typeof orientationPermission === "function") {
      try {
        orientationGranted = (await orientationPermission()) === "granted";
      } catch {
        orientationGranted = false;
      }
    }

    if (typeof motionPermission === "function") {
      try {
        motionGranted = (await motionPermission()) === "granted";
      } catch {
        motionGranted = false;
      }
    }

    if (!orientationGranted || !motionGranted) return;

    localStorage.setItem("gyro-enabled", "1");
    setIsGyroEnabled(true);
    window.dispatchEvent(
      new CustomEvent("gyro-control-change", { detail: { enabled: true } })
    );
  };

  return (
    <>
      <div className={`header ${mobileMenuOpen ? "header-mobile-open" : ""}`}>
        <a href="/#" className="navbar-title" data-cursor="disable">
          Aman Tiwari
        </a>
        {isMobileMenu ? (
          <button
            type="button"
            className={`header-menu-button ${mobileMenuOpen ? "header-menu-button-open" : ""}`}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        ) : null}
        {(!isMobileMenu || mobileMenuOpen) && (
          <ul className={`header-nav-links ${mobileMenuOpen ? "header-nav-links-open" : ""}`}>
          <li>
            <a
              data-href="#about"
              data-gesture-nav="#about"
              href="#about"
              onClick={(event) => handleNavClick(event, "#about")}
            >
              <HoverLinks text="ABOUT" />
            </a>
          </li>
          <li>
            <a
              data-href="#career"
              data-gesture-nav="#career"
              href="#career"
              onClick={(event) => handleNavClick(event, "#career")}
            >
              <HoverLinks text="WORK" />
            </a>
          </li>
          <li>
            <a
              data-href="#projects-start"
              data-gesture-nav="#projects-start"
              href="#projects-start"
              onClick={(event) => handleNavClick(event, "#projects-start")}
            >
              <HoverLinks text="PROJECTS" />
            </a>
          </li>
          <li>
            <a
              data-href="#contact"
              data-gesture-nav="#contact"
              href="#contact"
              onClick={(event) => handleNavClick(event, "#contact")}
            >
              <HoverLinks text="CONTACT" />
            </a>
          </li>
          </ul>
        )}
      </div>
      {isMobileMenu ? (
        <button
          type="button"
          className="gyro-toggle-button"
          onClick={handleGyroToggle}
          aria-label="Toggle gyroscope controls"
        >
          {isGyroEnabled ? "Gyroscope On" : "Enable Gyroscope"}
        </button>
      ) : null}

      <div className="landing-circle1"></div>
      <div className="landing-circle2"></div>
      <div className="nav-fade"></div>
    </>
  );
};

export default Navbar;
