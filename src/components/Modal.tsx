import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

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
  noScroll?: boolean;
  closeBtn?: boolean;
  children: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  size = "md",
  mobileFullscreen,
  noScroll,
  closeBtn,
  children,
}: ModalProps) {
  const { t } = useTranslation();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[60] flex justify-center ${mobileFullscreen ? "items-start sm:items-center" : "items-center"}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative ${size === "xxl" ? "bg-transparent dark:bg-transparent" : "bg-white dark:bg-slate-900 shadow-xl"} w-full ${mobileFullscreen ? `flex flex-col rounded-none sm:rounded-lg mx-0 sm:mx-4 h-dvh sm:h-auto sm:max-h-[90vh] ${noScroll ? "sm:overflow-visible" : "sm:overflow-y-auto"}` : "overflow-y-auto rounded-lg mx-4 max-h-[90vh]"} ${sizeClass[size]}`}>
        <div
          className={
            mobileFullscreen
              ? `flex-1 min-h-0   ${noScroll ? "overflow-visible" : "overflow-y-auto"} p-4 sm:p-6`
              : "p-6"
          }>
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
        {mobileFullscreen && closeBtn && (
          <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 font-medium text-sm active:opacity-70">
              {t("result_screen.close")}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
