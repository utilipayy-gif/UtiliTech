"use client";

import { useEffect, useState } from "react";
import styles from "./admin-feedback.module.css";

export default function AdminToast({ message, tone }: { message: string; tone: "success" | "error" }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    window.history.replaceState({}, "", window.location.pathname);
    const timer = window.setTimeout(() => setVisible(false), 5500);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;
  return (
    <div className={`${styles.toast} ${tone === "success" ? styles.toastSuccess : styles.toastError}`} role={tone === "error" ? "alert" : "status"}>
      <span aria-hidden="true">{tone === "success" ? "✓" : "!"}</span>
      <p>{message}</p>
      <button type="button" aria-label="Dismiss notification" onClick={() => setVisible(false)}>×</button>
    </div>
  );
}
