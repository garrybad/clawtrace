import Link from "next/link";
import { Bug } from "lucide-react";

export function HeaderLanding() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 lg:px-10 border-b border-white/5 bg-background-dark/80 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-8 rounded-lg bg-surface border border-border text-primary shadow-glow">
          <Bug className="size-5" />
        </div>
        <span className="font-display font-bold text-lg tracking-tight text-white">
          ClawTrace
        </span>
      </div>
      <div className="flex items-center gap-6">
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="#"
            className="text-sm font-medium text-text-muted hover:text-primary transition-colors"
          >
            Documentation
          </Link>
          <Link
            href="#"
            className="text-sm font-medium text-text-muted hover:text-primary transition-colors"
          >
            API
          </Link>
        </nav>
      </div>
    </header>
  );
}
