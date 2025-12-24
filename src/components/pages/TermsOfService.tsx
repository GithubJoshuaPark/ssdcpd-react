import type { FC } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";

export const TermsOfService: FC = () => {
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
          Terms of Service
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
            Agreement to Terms
          </h2>
          <p>
            These Terms of Service constitute a legally binding agreement made
            between you and Soro's Portfolio, concerning your access to and use
            of the website. You agree that by accessing the website, you have
            read, understood, and agree to be bound by all of these Terms of
            Service.
          </p>
          <p style={{ marginTop: "12px" }}>
            If you do not agree with all of these Terms of Service, then you are
            expressly prohibited from using the website and you must discontinue
            use immediately.
          </p>

          <h2
            style={{
              marginTop: "32px",
              marginBottom: "16px",
              color: "var(--accent)",
            }}
          >
            Intellectual Property Rights
          </h2>
          <p>
            Unless otherwise indicated, the website is our proprietary property
            and all source code, databases, functionality, software, website
            designs, audio, video, text, photographs, and graphics on the
            website (collectively, the "Content") and the trademarks, service
            marks, and logos contained therein (the "Marks") are owned or
            controlled by us or licensed to us.
          </p>
          <p style={{ marginTop: "12px" }}>
            The Content and the Marks are provided on the website "AS IS" for
            your information and personal use only. Except as expressly provided
            in these Terms of Service, no part of the website and no Content or
            Marks may be copied, reproduced, aggregated, republished, uploaded,
            posted, publicly displayed, encoded, translated, transmitted,
            distributed, sold, licensed, or otherwise exploited for any
            commercial purpose whatsoever, without our express prior written
            permission.
          </p>

          <h2
            style={{
              marginTop: "32px",
              marginBottom: "16px",
              color: "var(--accent)",
            }}
          >
            User Representations
          </h2>
          <p>By using the website, you represent and warrant that:</p>
          <ul style={{ paddingLeft: "20px", marginTop: "12px" }}>
            <li>
              All registration information you submit will be true, accurate,
              current, and complete.
            </li>
            <li>
              You will maintain the accuracy of such information and promptly
              update such registration information as necessary.
            </li>
            <li>
              You have the legal capacity and you agree to comply with these
              Terms of Service.
            </li>
            <li>
              You are not a minor in the jurisdiction in which you reside.
            </li>
            <li>
              You will not access the website through automated or non-human
              means, whether through a bot, script, or otherwise.
            </li>
            <li>
              You will not use the website for any illegal or unauthorized
              purpose.
            </li>
          </ul>

          <h2
            style={{
              marginTop: "32px",
              marginBottom: "16px",
              color: "var(--accent)",
            }}
          >
            Prohibited Activities
          </h2>
          <p>
            You may not access or use the website for any purpose other than
            that for which we make the website available. The website may not be
            used in connection with any commercial endeavors except those that
            are specifically endorsed or approved by us.
          </p>
          <p style={{ marginTop: "12px" }}>
            As a user of the website, you agree not to:
          </p>
          <ul style={{ paddingLeft: "20px", marginTop: "12px" }}>
            <li>
              Systematically retrieve data or other content from the website to
              create or compile, directly or indirectly, a collection,
              compilation, database, or directory without written permission
              from us.
            </li>
            <li>
              Trick, defraud, or mislead us and other users, especially in any
              attempt to learn sensitive account information such as user
              passwords.
            </li>
            <li>
              Circumvent, disable, or otherwise interfere with security-related
              features of the website.
            </li>
            <li>
              Engage in unauthorized framing of or linking to the website.
            </li>
          </ul>

          <h2
            style={{
              marginTop: "32px",
              marginBottom: "16px",
              color: "var(--accent)",
            }}
          >
            Modifications and Interruptions
          </h2>
          <p>
            We reserve the right to change, modify, or remove the contents of
            the website at any time or for any reason at our sole discretion
            without notice. We also reserve the right to modify or discontinue
            all or part of the website without notice at any time.
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
            If you have any questions about these Terms of Service, please
            contact us at:
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
