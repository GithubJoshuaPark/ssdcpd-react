import type { FC } from "react";
import { Link } from "react-router-dom";

export const Footer: FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      className="footer"
      style={{ textAlign: "center", padding: "40px 20px" }}
    >
      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
        © <span>{year}</span> Senior Software Developer&apos;s CPD
      </p>
      <div
        style={{
          marginTop: "12px",
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          fontSize: "0.85rem",
        }}
      >
        <Link
          to="/privacy"
          style={{ color: "var(--text-muted)", textDecoration: "none" }}
        >
          Privacy Policy
        </Link>
        <Link
          to="/terms"
          style={{ color: "var(--text-muted)", textDecoration: "none" }}
        >
          Terms of Service
        </Link>
        <a
          href="mailto:soromiso@gmail.com"
          style={{ color: "var(--text-muted)", textDecoration: "none" }}
        >
          Contact
        </a>
      </div>
    </footer>
  );
};
