import type { FC } from "react";
import { FaCircleNotch } from "react-icons/fa";

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: FC<LoadingSpinnerProps> = ({
  message = "Processing...",
}) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "80px",
          height: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Glow Effect */}
        <div
          style={{
            position: "absolute",
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
            opacity: 0.3,
            animation: "spinner-pulse 1.5s infinite alternate",
          }}
        />

        {/* Spinning Icon */}
        <FaCircleNotch
          style={{
            fontSize: "48px",
            color: "var(--accent)",
            animation: "spinner-spin 1s linear infinite",
          }}
        />
      </div>

      <p
        style={{
          marginTop: "20px",
          color: "#fff",
          fontSize: "1.1rem",
          fontWeight: "600",
          letterSpacing: "1px",
          textShadow: "0 2px 4px rgba(0,0,0,0.3)",
        }}
      >
        {message}
      </p>

      <style>{`
        @keyframes spinner-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spinner-pulse {
          from { transform: scale(0.8); opacity: 0.2; }
          to { transform: scale(1.2); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};
