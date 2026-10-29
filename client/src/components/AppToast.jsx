import { useEffect, useState } from "react";
import { FiAlertCircle, FiCheck, FiInfo, FiX } from "react-icons/fi";

const EXIT_MS = 200;

let nextId = 0;
let items = [];
const listeners = new Set();
const timers = new Map();

const tones = {
  success: {
    Icon: FiCheck,
    iconClass: "bg-emerald-50 text-emerald-600",
    barClass: "bg-emerald-500",
  },
  error: {
    Icon: FiAlertCircle,
    iconClass: "bg-rose-50 text-rose-600",
    barClass: "bg-rose-500",
  },
  warning: {
    Icon: FiAlertCircle,
    iconClass: "bg-amber-50 text-amber-600",
    barClass: "bg-amber-500",
  },
  info: {
    Icon: FiInfo,
    iconClass: "bg-[#424687]/10 text-[#424687]",
    barClass: "bg-[#424687]",
  },
};

function emit() {
  const snapshot = items.map((item) => ({ ...item }));
  listeners.forEach((listener) => listener(snapshot));
}

function clearTimer(id) {
  const timer = timers.get(id);
  if (!timer) return;
  window.clearTimeout(timer);
  timers.delete(id);
}

function removeNow(id) {
  clearTimer(id);
  items = items.filter((item) => item.id !== id);
  emit();
}

function dismiss(id) {
  const current = items.find((item) => item.id === id);
  if (!current || current.leaving) return;
  clearTimer(id);
  items = items.map((item) => (item.id === id ? { ...item, leaving: true } : item));
  emit();
  window.setTimeout(() => removeNow(id), EXIT_MS);
}

function push(type, message, options = {}) {
  const text = String(message ?? "").trim();
  if (!text) return null;

  const existing = items.find(
    (item) => item.type === type && item.message === text && !item.leaving
  );
  if (existing) return existing.id;

  const id = ++nextId;
  const duration = options.autoClose === false ? 0 : Number(options.autoClose ?? 2400);
  items = [...items, { id, type, message: text, duration, leaving: false }];
  emit();

  if (duration > 0) {
    timers.set(id, window.setTimeout(() => dismiss(id), duration));
  }

  return id;
}

export const toast = {
  success: (message, options) => push("success", message, options),
  error: (message, options) => push("error", message, options),
  info: (message, options) => push("info", message, options),
  warning: (message, options) => push("warning", message, options),
  dismiss,
};

function ToastCard({ item, onClose }) {
  const tone = tones[item.type] || tones.info;
  const Icon = tone.Icon;

  return (
    <div
      role="status"
      className={`app-toast ${item.leaving ? "app-toast--out" : "app-toast--in"}`}
    >
      <span className={`app-toast__icon ${tone.iconClass}`}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <p className="app-toast__message">{item.message}</p>
      <button type="button" className="app-toast__close" onClick={onClose} aria-label="Dismiss">
        <FiX className="h-3.5 w-3.5" aria-hidden />
      </button>
      {item.duration > 0 && (
        <span
          className={`app-toast__progress ${tone.barClass}`}
          style={{ animationDuration: `${item.duration}ms` }}
        />
      )}
    </div>
  );
}

export function ToastContainer({ placement = "safe" }) {
  const [list, setList] = useState(() => items.map((item) => ({ ...item })));

  useEffect(() => {
    const listener = (next) => setList(next);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const placementClass =
    placement === "header-validity"
      ? "app-toast-host--header-validity"
      : placement === "header"
        ? "app-toast-host--header"
        : "";

  if (!list.length) return null;

  return (
    <div className={`app-toast-host ${placementClass}`} aria-live="polite">
      {list.map((item) => (
        <ToastCard key={item.id} item={item} onClose={() => dismiss(item.id)} />
      ))}
    </div>
  );
}
