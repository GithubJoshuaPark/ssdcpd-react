import type { FC } from "react";
import { Link } from "react-router-dom";

export const Intro: FC = () => {
  return (
    <div className="intro-container">
      <section className="intro-hero">
        <div className="intro-illustration">
          <img
            src="/intro.png"
            alt="Joshua Park Illustration"
            className="intro-img"
          />
        </div>

        <h1 className="intro-name">Hi, I'm Joshua Park</h1>
        <h2 className="intro-title">A passionate Full Stack Developer</h2>

        <div className="intro-description">
          <p>Welcome! I'm an IT professional with</p>
          <p className="highlight-text">20+ years of expertise in:</p>
          <p className="expertise-tags">
            <span className="expertise-tag">business analysis</span>,
            <span className="expertise-tag">software development</span>, and
            <span className="expertise-tag">project management</span>
          </p>
          <p>I transform ideas into scalable solutions</p>
          <p>that drive business success.</p>
        </div>
      </section>

      <section className="tech-skills-section">
        <h2 className="section-title">Technical Skills</h2>
        <div className="skills-grid">
          {/* Frontend */}
          <div className="skill-card">
            <h3>Frontend</h3>
            <div className="skill-items">
              <div className="skill-item">
                <span>⚛️</span> React
              </div>
              <div className="skill-item">
                <span>TS</span> TypeScript
              </div>
              <div className="skill-item">
                <span>🌊</span> Tailwind CSS
              </div>
              <div className="skill-item">
                <span>N</span> Next.js
              </div>
            </div>
          </div>

          {/* Backend */}
          <div className="skill-card">
            <h3>Backend</h3>
            <div className="skill-items">
              <div className="skill-item">
                <span>JS</span> Node.js
              </div>
              <div className="skill-item">
                <span>ex</span> Express
              </div>
              <div className="skill-item">
                <span>🍃</span> MongoDB
              </div>
              <div className="skill-item">
                <span>🔗</span> RESTful APIs
              </div>
            </div>
          </div>

          {/* Tools & Others */}
          <div className="skill-card">
            <h3>Tools & Others</h3>
            <div className="skill-items">
              <div className="skill-item">
                <span>Git</span> Git
              </div>
              <div className="skill-item">
                <span>🐳</span> Docker
              </div>
              <div className="skill-item">
                <span>aws</span> AWS
              </div>
              <div className="skill-item">
                <span>🔄</span> CI/CD
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="intro-actions">
        <button className="primary-btn contact-btn">Contact Me</button>
        <Link to="/cpd" className="secondary-btn view-projects-btn">
          View Projects
        </Link>
      </div>
    </div>
  );
};
