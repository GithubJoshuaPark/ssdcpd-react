import type { FC } from "react";
import { useState } from "react";
import { AiOutlineCode } from "react-icons/ai";
import {
  FaAngular,
  FaApple,
  FaAws,
  FaDatabase,
  FaDocker,
  FaEnvelope,
  FaGitAlt,
  FaGraduationCap,
  FaJava,
  FaNodeJs,
  FaProjectDiagram,
  FaReact,
  FaSwift,
} from "react-icons/fa";
import {
  SiAndroidstudio,
  SiExpress,
  SiFirebase,
  SiJavascript,
  SiKotlin,
  SiPython,
  SiSpringboot,
  SiSupabase,
  SiSwift,
  SiTailwindcss,
  SiTypescript,
} from "react-icons/si";
import { VscSettingsGear } from "react-icons/vsc";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { AuthModal } from "../auth/AuthModal";
import { LottieView } from "../common/LottieView";
import { ContactModal } from "../contact/ContactModal";

const LOTTIE_FILES = [
  "developer0.json",
  "developer2.json",
  "contact0.json",
  "lottieDeveloper.json",
];

export const Intro: FC = () => {
  const { currentUser } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const [randomLottie] = useState(
    () => LOTTIE_FILES[Math.floor(Math.random() * LOTTIE_FILES.length)]
  );

  const handleContactClick = () => {
    if (currentUser) {
      setIsContactModalOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <div className="intro-container">
      <section className="intro-hero">
        <div className="intro-illustration">
          <LottieView fileName={randomLottie} className="intro-lottie" />
        </div>

        <h1 className="intro-name">Hi, I'm Joshua Park</h1>
        <h2 className="intro-title">A passionate Full Stack Developer</h2>

        <div className="intro-description">
          <p>Welcome! I'm an IT professional with</p>
          <p className="highlight-text">20+ years of expertise in:</p>
          <p className="expertise-tags">
            <span className="expertise-tag">Business analysis</span>
            <span className="expertise-tag">, software development</span>
            <span className="expertise-tag">&nbsp;and project management</span>
          </p>
          <p>I transform ideas into scalable solutions</p>
          <p>that drive business success.</p>
        </div>
      </section>

      <section className="tech-skills-section">
        <h2 className="section-title">Skills</h2>
        <div className="skills-grid">
          {/* Langs */}
          <div className="skill-card">
            <h3>Langs</h3>
            <div className="skill-items">
              <div className="skill-item">
                <AiOutlineCode color="#9ca3af" /> C/C++/C#
              </div>
              <div className="skill-item">
                <FaJava color="#f89820" /> Java
              </div>
              <div className="skill-item">
                <SiPython color="#3776AB" /> Python
              </div>
              <div className="skill-item">
                <FaSwift color="#F05138" /> Swift
              </div>
              <div className="skill-item">
                <SiSwift color="#007AFF" /> SwiftUI
              </div>
              <div className="skill-item">
                <SiKotlin color="#7F52FF" /> Kotlin
              </div>
            </div>
          </div>

          {/* Native */}
          <div className="skill-card">
            <h3>Native</h3>
            <div className="skill-items single-col">
              <div className="skill-item">
                <FaApple color="#ffffff" /> xCode
              </div>
              <div className="skill-item">
                <SiAndroidstudio color="#3DDC84" /> Android Studio
              </div>
            </div>
          </div>

          {/* Frontend */}
          <div className="skill-card">
            <h3>Frontend</h3>
            <div className="skill-items single-col">
              <div className="skill-item">
                <SiJavascript color="#F7DF1E" /> JavaScript
              </div>
              <div className="skill-item">
                <SiTypescript color="#3178C6" /> TypeScript
              </div>
              <div className="skill-item">
                <FaReact color="#61DAFB" /> React
              </div>
              <div className="skill-item">
                <FaAngular color="#DD0031" /> Angular
              </div>
              <div className="skill-item">
                <SiTailwindcss color="#06B6D4" /> Tailwind
              </div>
            </div>
          </div>

          {/* Backend */}
          <div className="skill-card">
            <h3>Backend</h3>
            <div className="skill-items">
              <div className="skill-item">
                <FaNodeJs color="#339933" /> Node.js
              </div>
              <div className="skill-item">
                <SiExpress color="#ffffff" /> Express
              </div>
              <div className="skill-item">
                <SiSpringboot color="#6DB33F" /> SpringBoot
              </div>
              <div className="skill-item">
                <SiFirebase color="#FFCA28" /> Firebase
              </div>
              <div className="skill-item">
                <SiSupabase color="#3ECF8E" /> Supabase
              </div>
              <div className="skill-item">
                <FaDatabase color="#60A5FA" /> RDBMS
              </div>
            </div>
          </div>

          {/* Tools */}
          <div className="skill-card">
            <h3>Tools</h3>
            <div className="skill-items single-col">
              <div className="skill-item">
                <FaGitAlt color="#F05032" /> Git
              </div>
              <div className="skill-item">
                <FaDocker color="#2496ED" /> Docker
              </div>
              <div className="skill-item">
                <FaAws color="#FF9900" /> AWS
              </div>
              <div className="skill-item">
                <VscSettingsGear color="#9ca3af" /> CI/CD
              </div>
            </div>
          </div>
        </div>
      </section>

      <div
        className="intro-actions"
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "40px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          className="primary-btn contact-btn"
          onClick={handleContactClick}
          style={{
            padding: "12px 32px",
            fontSize: "1.1rem",
            fontWeight: "600",
            borderRadius: "30px",
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            boxShadow: "0 8px 20px rgba(59, 130, 246, 0.3)",
            border: "none",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={e =>
            (e.currentTarget.style.transform = "translateY(-3px)")
          }
          onMouseLeave={e =>
            (e.currentTarget.style.transform = "translateY(0)")
          }
        >
          <FaEnvelope /> Contact
        </button>

        <Link
          to="/cpd"
          className="secondary-btn"
          style={{
            padding: "12px 32px",
            fontSize: "1.1rem",
            fontWeight: "600",
            borderRadius: "30px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            backdropFilter: "blur(10px)",
            transition: "transform 0.2s ease, background 0.2s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
          }}
        >
          <FaGraduationCap /> CPD
        </Link>

        <Link
          to="/projects"
          className="secondary-btn"
          style={{
            padding: "12px 32px",
            fontSize: "1.1rem",
            fontWeight: "600",
            borderRadius: "30px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            backdropFilter: "blur(10px)",
            transition: "transform 0.2s ease, background 0.2s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
          }}
        >
          <FaProjectDiagram /> Projects
        </Link>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </div>
  );
};
