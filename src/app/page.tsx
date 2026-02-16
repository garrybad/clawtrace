import { HeaderLanding } from "@/components/layout/HeaderLanding";
import { HeroInput } from "@/components/landing/HeroInput";
import { RecentSearches } from "@/components/landing/RecentSearches";
import { Wrench } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen text-text-primary antialiased selection:bg-primary selection:text-background-dark flex flex-col overflow-hidden">
      <HeaderLanding />
      <main className="relative flex-1 flex flex-col items-center justify-center w-full min-h-screen">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-cyber-grid bg-grid-animate opacity-50 animate-pulse-slow" />
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
        </div>
        <div className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center animate-[fadeIn_0.5s_ease-out]">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary blur-[20px] opacity-20 rounded-full" />
                <Wrench className="size-14 text-primary relative z-10 drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-bold text-white tracking-[-0.02em] mb-3 drop-shadow-lg">
              ClawTrace
            </h1>
            <p className="text-lg text-text-muted font-sans font-light tracking-wide max-w-md mx-auto">
              Intelligent <span className="text-white font-medium">BNB Chain</span> trace
              debugger & failure analysis.
            </p>
          </div>
          <HeroInput />
          <RecentSearches />
        </div>
        <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
          <p className="text-xs text-text-muted/40 font-mono">
            v1.0.4 • Powered by ClawAI Engine
          </p>
        </div>
      </main>
    </div>
  );
}
