"use client";

import React, { useEffect, useState } from "react";
import { FaGithub, FaLinkedin, FaYoutube } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";
import "../styles/get-in-touch.css";

type Platform = {
  name: string;
  icon: React.ReactNode;
  link: string;
  description: string;
  color: string;
};

const PLATFORMS: Platform[] = [
  {
    name: "LinkedIn",
    icon: <FaLinkedin />,
    link: "https://www.linkedin.com/in/amantiwarri",
    description: "Professional Network",
    color: "#0A66C2",
  },
  {
    name: "GitHub",
    icon: <FaGithub />,
    link: "https://github.com/aman12334",
    description: "Code Repository",
    color: "#111827",
  },
  {
    name: "YouTube",
    icon: <FaYoutube />,
    link: "https://www.youtube.com/@amantiwarri",
    description: "Video Content",
    color: "#FF0033",
  },
  {
    name: "Email",
    icon: <HiOutlineMail />,
    link: "mailto:amant10@umd.edu",
    description: "Direct Contact",
    color: "#2563eb",
  },
];

export const ProfessionalConnect = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="professional-connect">
      <div className="professional-connect-header">
        <div className="professional-connect-avatar-wrap">
          <img
            src="/images/about-word-source.jpg"
            alt="Aman Tiwari"
            className="professional-connect-avatar"
          />
        </div>
        <div className="professional-connect-copy">
          <p className="professional-connect-kicker">Connect & Collaborate</p>
          <h4>Get In Touch</h4>
          <p>
            Let&apos;s connect across platforms for product, AI workflow, and
            systems conversations.
          </p>
        </div>
      </div>

      <div className="professional-connect-grid">
        {PLATFORMS.map((platform, index) => (
          <a
            key={platform.name}
            href={platform.link}
            target={platform.link.startsWith("mailto:") ? undefined : "_blank"}
            rel={platform.link.startsWith("mailto:") ? undefined : "noreferrer"}
            data-cursor="disable"
            className={`professional-card ${
              hoveredIndex === index ? "professional-card-active" : ""
            }`}
            style={{ ["--brand-color" as string]: platform.color }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="professional-card-icon">{platform.icon}</div>
            <div className="professional-card-text">
              <h5>{platform.name}</h5>
              <p>{platform.description}</p>
            </div>
          </a>
        ))}
      </div>

      <div
        className="professional-connect-light"
        style={{
          left: `${mousePosition.x - 130}px`,
          top: `${mousePosition.y - 130}px`,
        }}
      />
    </div>
  );
};

export default ProfessionalConnect;
