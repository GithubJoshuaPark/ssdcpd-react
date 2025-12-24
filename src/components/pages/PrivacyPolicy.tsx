import type { FC } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";

export const PrivacyPolicy: FC = () => {
  return (
    <div
      className="static-page-container"
      style={{
        padding: "60px 20px",
        maxWidth: "800px",
        margin: "0 auto",
        color: "var(--text-main)",
      }}
    >
      <Link
        to="/"
        className="back-link"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "var(--accent)",
          textDecoration: "none",
          marginBottom: "40px",
          fontSize: "0.9rem",
          fontWeight: "600",
        }}
      >
        <FaArrowLeft /> Back to Home
      </Link>

      <section className="card" style={{ padding: "40px" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "8px" }}>
          Privacy Policy
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            marginBottom: "32px",
            fontSize: "0.9rem",
          }}
        >
          Last Updated: February 27, 2025
        </p>

        <div
          className="static-content"
          style={{ lineHeight: "1.8", fontSize: "1.05rem" }}
        >
          <h2
            style={{
              marginTop: "32px",
              marginBottom: "16px",
              color: "var(--accent)",
            }}
          >
            Introduction
          </h2>
          <p>
            Welcome to Soro's Portfolio. We respect your privacy and are
            committed to protecting your personal data. This privacy policy will
            inform you about how we look after your personal data when you visit
            our website and tell you about your privacy rights and how the law
            protects you.
          </p>

          <h2
            style={{
              marginTop: "32px",
              marginBottom: "16px",
              color: "var(--accent)",
            }}
          >
            Information We Collect
          </h2>
          <p>
            We may collect, use, store and transfer different kinds of personal
            data about you which we have grouped together as follows:
          </p>
          <ul style={{ paddingLeft: "20px", marginTop: "12px" }}>
            <li>
              <strong>Identity Data</strong>: includes first name, last name,
              username or similar identifier.
            </li>
            <li>
              <strong>Contact Data</strong>: includes email address and
              telephone numbers.
            </li>
            <li>
              <strong>Technical Data</strong>: includes internet protocol (IP)
              address, your login data, browser type and version, time zone
              setting and location, browser plug-in types and versions,
              operating system and platform, and other technology on the devices
              you use to access this website.
            </li>
            <li>
              <strong>Usage Data</strong>: includes information about how you
              use our website, products and services.
            </li>
          </ul>

          <h2
            style={{
              marginTop: "32px",
              marginBottom: "16px",
              color: "var(--accent)",
            }}
          >
            How We Use Your Information
          </h2>
          <p>
            We will only use your personal data when the law allows us to. Most
            commonly, we will use your personal data in the following
            circumstances:
          </p>
          <ul style={{ paddingLeft: "20px", marginTop: "12px" }}>
            <li>
              Where we need to perform the contract we are about to enter into
              or have entered into with you.
            </li>
            <li>
              Where it is necessary for our legitimate interests (or those of a
              third party) and your interests and fundamental rights do not
              override those interests.
            </li>
            <li>Where we need to comply with a legal obligation.</li>
          </ul>

          <h2
            style={{
              marginTop: "32px",
              marginBottom: "16px",
              color: "var(--accent)",
            }}
          >
            Disclosure of Your Information
          </h2>
          <p>
            We may share your personal data with the parties set out below for
            the purposes set out in this privacy policy:
          </p>
          <ul style={{ paddingLeft: "20px", marginTop: "12px" }}>
            <li>
              Service providers who provide IT and system administration
              services.
            </li>
            <li>
              Professional advisers including lawyers, bankers, auditors and
              insurers.
            </li>
            <li>
              Regulators and other authorities who require reporting of
              processing activities in certain circumstances.
            </li>
          </ul>

          <h2
            style={{
              marginTop: "32px",
              marginBottom: "16px",
              color: "var(--accent)",
            }}
          >
            Security of Your Information
          </h2>
          <p>
            We have put in place appropriate security measures to prevent your
            personal data from being accidentally lost, used or accessed in an
            unauthorized way, altered or disclosed. In addition, we limit access
            to your personal data to those employees, agents, contractors and
            other third parties who have a business need to know.
          </p>

          <h2
            style={{
              marginTop: "32px",
              marginBottom: "16px",
              color: "var(--accent)",
            }}
          >
            Contact Us
          </h2>
          <p>
            If you have any questions about this privacy policy or our privacy
            practices, please contact us at:
          </p>
          <p style={{ marginTop: "12px" }}>
            Email:{" "}
            <a
              href="mailto:soromiso@gmail.com"
              style={{ color: "var(--accent)", textDecoration: "none" }}
            >
              soromiso@gmail.com
            </a>
          </p>
        </div>
      </section>
    </div>
  );
};
