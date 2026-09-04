"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import styles from "./admin-feedback.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pendingText: string;
};

export default function AdminSubmitButton({ children, pendingText, disabled, ...props }: Props) {
  const { pending } = useFormStatus();
  return (
    <button {...props} type="submit" disabled={disabled || pending} aria-busy={pending}>
      {pending && <span className={styles.spinner} aria-hidden="true" />}
      {pending ? pendingText : children}
    </button>
  );
}
