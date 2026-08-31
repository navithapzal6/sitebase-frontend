 "use client";

import { useEffect, useRef, useState, type ReactElement } from "react";

type ToastType = "success" | "error";

const TOAST_DURATION = 3000;

const CONFIG: Record<
  ToastType,
  { accent: string; bg: string; ring: string; icon: ReactElement }
> = {
  success: {
    accent: "#16a34a",
    bg: "#052e12",
    ring: "rgba(22,163,74,0.25)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <path
          d="M5 10.5l3 3 7-7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  error: {
    accent: "#ef4444",
    bg: "#2c0a0a",
    ring: "rgba(239,68,68,0.25)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 6v5M10 14h.01"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
};

export function Toaster({
  message,
  type,
  onClose,
}: {
  message: string;
  type: ToastType;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<"enter" | "visible" | "leave">("enter");
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const dismiss = () => {
    setStage("leave");
    leaveTimer.current = setTimeout(onClose, 200);
  };

  useEffect(() => {
    const raf = requestAnimationFrame(() => setStage("visible"));
    closeTimer.current = setTimeout(dismiss, TOAST_DURATION);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(closeTimer.current);
      clearTimeout(leaveTimer.current);
    };
  }, []);

  const c = CONFIG[type];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-5 right-5 z-[9999]"
      style={{
        transform:
          stage === "enter"
            ? "translateX(24px) scale(0.96)"
            : stage === "leave"
            ? "translateX(12px) scale(0.98)"
            : "translateX(0) scale(1)",
        opacity: stage === "enter" ? 0 : stage === "leave" ? 0 : 1,
        transition: "transform 220ms cubic-bezier(0.22,1,0.36,1), opacity 200ms ease",
      }}
    >
      <div
        className="relative flex items-start gap-3 overflow-hidden rounded-2xl pl-4 pr-3 py-3 backdrop-blur-xl"
        style={{
          background: "rgba(20,20,22,0.92)",
          boxShadow: `0 8px 24px -4px rgba(0,0,0,0.45), 0 0 0 1px ${c.ring}`,
          minWidth: "280px",
          maxWidth: "360px",
        }}
      >
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
          style={{ background: c.bg, color: c.accent }}
        >
          {c.icon}
        </span>

        <p className="flex-1 pt-0.5 text-[13px] leading-snug text-white/90">
          {message}
        </p>

        <button
          onClick={dismiss}
          aria-label="Dismiss notification"
          className="mt-0.5 shrink-0 rounded-full p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M1 1l10 10M11 1L1 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div
          className="absolute bottom-0 left-0 h-[2px] w-full origin-left"
          style={{ background: c.accent, opacity: 0.7 }}
        >
          <div
            style={{
              height: "100%",
              width: "100%",
              background: c.accent,
              transformOrigin: "left",
              animation:
                stage === "visible"
                  ? `toast-shrink ${TOAST_DURATION}ms linear forwards`
                  : "none",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes toast-shrink {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}
