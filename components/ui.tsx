import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  testId,
}: {
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}

const CLASS_STYLES: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800",
  B: "bg-amber-100 text-amber-800",
  C: "bg-slate-100 text-slate-600",
};

export function ClassBadge({ value }: { value: "A" | "B" | "C" }) {
  return (
    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${CLASS_STYLES[value]}`}>
      {value}
    </span>
  );
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  testId,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "outline";
  testId?: string;
  disabled?: boolean;
}) {
  const styles = {
    primary: "bg-brand-700 text-white hover:bg-brand-900 disabled:opacity-50",
    outline: "border border-slate-300 text-slate-700 hover:bg-slate-50",
    ghost: "text-brand-700 hover:bg-brand-50",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      data-testid={testId}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium transition ${styles}`}
    >
      {children}
    </button>
  );
}
