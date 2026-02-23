import { PropsWithChildren, ReactNode } from 'react';

export function AppPage({ children }: PropsWithChildren) {
  return <div>{children}</div>;
}

export function AppSection({ title, children }: PropsWithChildren<{ title?: string }>) {
  return (
    <section className="space-y-3">
      {title ? <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase">{title}</h2> : null}
      {children}
    </section>
  );
}

export function AppCard({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <article className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 ${className}`}>{children}</article>;
}

export function CardHeader({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <header className={`mb-3 ${className}`}>{children}</header>;
}

export function CardContent({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <div className={`space-y-2 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <footer className={`mt-3 ${className}`}>{children}</footer>;
}

export function AppStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

export function AppSkeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/10 ${className}`} aria-hidden="true" />;
}
