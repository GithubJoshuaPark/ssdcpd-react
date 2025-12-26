// src/components/common/Toast.tsx
import type { FC } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: FC<ToastProps> = ({
  message,
  type,
  onClose,
  duration = 5000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none", // Allow clicking through the empty space
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999, // Should be very high
      }}
    >
      <div
        className={`toast toast-${type}`}
        style={{
          pointerEvents: "auto", // Enable clicks on the toast itself if needed
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <p>{message}</p>
      </div>
    </div>,
    document.body
  );
};
