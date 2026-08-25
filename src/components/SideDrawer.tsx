import { useEffect } from "react";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  side?: "left" | "right";
  tabLabel: string;
  topValue?: string;
  tabIcon?: React.ReactNode;
  title: string;
  hasActiveIndicator?: boolean;
  rotate?: boolean;
  /** When false the drawer is visible on all screen sizes (default: true = mobile only) */
  mobileOnly?: boolean;
  children: React.ReactNode;
}

export function SideDrawer({
  open,
  onClose,
  onOpen,
  side = "left",
  topValue = "top-1/2",
  rotate = false,
  tabLabel,
  tabIcon,
  title,
  hasActiveIndicator = false,
  mobileOnly = true,
  children,
}: SideDrawerProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const hide = mobileOnly ? "sm:hidden" : "";
  const isRight = side === "right";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`${hide} fixed inset-0 z-[51] bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer panel — tab is attached and moves with it */}
      <div
        className={`${hide} fixed inset-y-0 z-[51] w-full bg-white dark:bg-gray-900 shadow-2xl
          flex flex-col transition-transform duration-300 ease-in-out
          ${isRight ? "right-0" : "left-0"}
          ${open ? "translate-x-0" : isRight ? "translate-x-full" : "-translate-x-full"}`}>
        {/* Tab — sticks out from the outer edge of the panel */}
        <button
          onClick={open ? onClose : onOpen}
          className={`absolute  -translate-y-1/2
            bg-indigo-600 text-white shadow-lg select-none dark:bg-indigo-950 dark:text-indigo-400
            flex flex-row items-center justify-between gap-1 px-2 py-3 ${topValue}
            ${isRight ? "left-0 -translate-x-full rounded-l-xl" : "right-0 translate-x-full rounded-r-xl"}`}>
          {tabIcon}
          <span
            className="text-[12px] font-bold leading-none tracking-wide"
            style={rotate ? { writingMode: "vertical-rl", transform: "rotate(180deg)" } : {}}>
            {tabLabel}
          </span>
          {hasActiveIndicator && (
            <span
              className={`absolute -top-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-gray-900 ${
                isRight ? "-right-1" : "-left-1"
              }`}
            />
          )}
        </button>

        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <span className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">{title}</span>
          <button
            onClick={onClose}
            className="p-1 shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-md">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">{children}</div>
      </div>
    </>
  );
}
