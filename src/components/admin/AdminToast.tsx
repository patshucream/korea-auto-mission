"use client";

import { useEffect } from "react";

type Props = {
  message: string | null;
  type?: "success" | "error";
  onClose: () => void;
};

export function AdminToast({ message, type = "success", onClose }: Props) {
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      className={`admin-toast ${type === "success" ? "admin-toast-success" : "admin-toast-error"}`}
      role="status"
    >
      {message}
    </div>
  );
}
