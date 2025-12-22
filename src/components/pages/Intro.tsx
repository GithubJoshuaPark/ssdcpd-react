import type { FC } from "react";
import { useState } from "react";
import { AiOutlineCode } from "react-icons/ai";
import {
  FaAngular,
  FaApple,
  FaAws,
  FaDatabase,
  FaDocker,
  FaGitAlt,
  FaJava,
  FaNodeJs,
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

const LOTTIE_FILES = ["developer0.json", "contact0.json"];

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
            <span className="expertise-tag">business analysis</span>
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
                <AiOutlineCode /> C/C++/C#
              </div>
              <div className="skill-item">
                <FaJava /> Java
              </div>
              <div className="skill-item">
                <SiPython /> Python
              </div>
              <div className="skill-item">
                <FaSwift /> Swift
              </div>
              <div className="skill-item">
                <SiSwift /> SwiftUI
              </div>
              <div className="skill-item">
                <SiKotlin /> Kotlin
              </div>
            </div>
          </div>

          {/* Native */}
          <div className="skill-card">
            <h3>Native</h3>
            <div className="skill-items single-col">
              <div className="skill-item">
                <FaApple /> xCode
              </div>
              <div className="skill-item">
                <SiAndroidstudio /> Android Studio
              </div>
            </div>
          </div>

          {/* Frontend */}
          <div className="skill-card">
            <h3>Frontend</h3>
            <div className="skill-items single-col">
              <div className="skill-item">
                <SiJavascript /> JavaScript
              </div>
              <div className="skill-item">
                <SiTypescript /> TypeScript
              </div>
              <div className="skill-item">
                <FaReact /> React
              </div>
              <div className="skill-item">
                <FaAngular /> Angular
              </div>
              <div className="skill-item">
                <SiTailwindcss /> Tailwind
              </div>
            </div>
          </div>

          {/* Backend */}
          <div className="skill-card">
            <h3>Backend</h3>
            <div className="skill-items">
              <div className="skill-item">
                <FaNodeJs /> Node.js
              </div>
              <div className="skill-item">
                <SiExpress /> Express
              </div>
              <div className="skill-item">
                <SiSpringboot /> SpringBoot
              </div>
              <div className="skill-item">
                <SiFirebase /> Firebase
              </div>
              <div className="skill-item">
                <SiSupabase /> Supabase
              </div>
              <div className="skill-item">
                <FaDatabase /> RDBMS
              </div>
            </div>
          </div>

          {/* Tools */}
          <div className="skill-card">
            <h3>Tools</h3>
            <div className="skill-items single-col">
              <div className="skill-item">
                <FaGitAlt /> Git
              </div>
              <div className="skill-item">
                <FaDocker /> Docker
              </div>
              <div className="skill-item">
                <FaAws /> AWS
              </div>
              <div className="skill-item">
                <VscSettingsGear /> CI/CD
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="intro-actions">
        <button
          className="primary-btn contact-btn"
          onClick={handleContactClick}
        >
          Contact Me
        </button>
        <Link to="/projects" className="secondary-btn view-projects-btn">
          View Projects
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
