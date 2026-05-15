import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Loader2 } from "lucide-react";

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuthAction = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      await logout();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuotePageClick = () => {
    navigate("/quotes");
  };

  const greeting = isAuthenticated
    ? `Welcome back, ${user?.name ?? "User"}. Ready for more inspiration?`
    : "Collect quotes, shape thoughts, and return to the words that move you.";
  const buttonLabel = isAuthenticated ? "Logout" : "Login";
  const isBusy = isLoading || isSubmitting;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0f16] text-white font-['Space_Grotesk']">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1220] via-[#0a0f16] to-[#05070c]" />
      <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-500/15 blur-[160px]" />
      <div className="absolute bottom-[-120px] right-[-40px] h-[360px] w-[360px] rounded-full bg-blue-500/20 blur-[140px]" />
      <div className="absolute top-24 left-[-120px] h-[240px] w-[240px] rounded-full bg-indigo-500/15 blur-[120px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_40%,rgba(255,255,255,0.02))]" />

      <main className="relative z-10">
        <section className="flex min-h-screen items-center justify-center px-4 py-16 sm:px-6">
          <div className="flex w-full max-w-3xl flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
            Modern quote space
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
            <span className="block">Quotie</span>
            <span className="mt-3 block text-base font-medium uppercase tracking-[0.3em] text-white/50">
              Premium quotes for focused minds
            </span>
          </h1>
          <p id="home-greeting" className="mt-6 max-w-2xl text-base text-white/70 sm:text-lg">
            {greeting}
          </p>
          <p className="mt-3 max-w-2xl text-sm text-white/50">
            Save reflections, build collections, and revisit your favorite words whenever you need a reset.
          </p>

          <div className="mt-8 flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              id="home-action-button"
              type="button"
              className="group h-11 w-full max-w-xs rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(34,211,238,0.35)] transition-all hover:-translate-y-0.5 hover:from-cyan-400 hover:to-blue-400 hover:shadow-[0_18px_36px_rgba(34,211,238,0.45)] focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              onClick={handleAuthAction}
              disabled={isBusy}
              aria-busy={isBusy}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </span>
              ) : (
                buttonLabel
              )}
            </Button>
            <Button
              id="home-quote-button"
              type="button"
              className="h-11 w-full max-w-xs rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-white/80 shadow-[0_12px_24px_rgba(8,15,26,0.4)] transition-all hover:-translate-y-0.5 hover:border-cyan-400/40 hover:text-white hover:shadow-[0_16px_30px_rgba(34,211,238,0.25)] focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              onClick={handleQuotePageClick}
              disabled={isLoading}
            >
              Quote Page
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-16 sm:px-6">
          <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_30px_80px_rgba(8,15,26,0.55)] backdrop-blur sm:p-12">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">About Quotie</p>
            <p className="mt-4 text-sm text-white/70 sm:text-base">
              Quotie is a small quote-sharing web application developed as the system under test for a capstone
              project focused on automated testing infrastructure and quality assurance practices.
            </p>
            <p className="mt-4 text-sm text-white/70 sm:text-base">
              The project is used to evaluate and experiment with:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/70 sm:text-base">
              {[
                "UI automation",
                "API testing",
                "end-to-end workflows",
                "testing pipelines",
                "reliability and maintainability strategies",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-white/70 sm:text-base">
              Built independently using modern web technologies including React, Node.js.
            </p>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5 px-4 py-4 text-center text-xs text-white/50 sm:px-6">
        © 2026 Bien Xuan Huy · D3LUX
      </footer>
    </div>
  );
}
