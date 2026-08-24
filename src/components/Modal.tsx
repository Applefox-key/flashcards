import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

const sizeClass = {
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  xxl: "max-w-2xl  h-content overflow-hidden overflow-y-hidden",
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: "md" | "lg" | "xl" | "xxl";
  mobileFullscreen?: boolean;
  children: ReactNode;
}

export function Modal({ open, onClose, title, size = "md", mobileFullscreen, children }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  return createPortal(
    <div className={`fixed inset-0 z-50 flex justify-center ${mobileFullscreen ? "items-end sm:items-center" : "items-center"}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative ${size === "xxl" ? "bg-transparent dark:bg-transparent" : "bg-white dark:bg-gray-800 shadow-xl"} w-full overflow-y-auto ${mobileFullscreen ? "rounded-t-2xl sm:rounded-lg mx-0 sm:mx-4 p-4 sm:p-6 max-h-[95dvh] sm:max-h-[90vh]" : "rounded-lg mx-4 p-6 max-h-[90vh]"} ${sizeClass[size]}`}>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none">
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
