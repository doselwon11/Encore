"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function ProjectDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className="reset-dialog project-dialog" aria-label={title} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <button className="icon-button project-dialog-close" onClick={onClose} aria-label="Close dialog"><X size={16}/></button>
    <h2>{title}</h2>{children}
  </dialog>;
}
