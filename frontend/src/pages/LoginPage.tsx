import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoginSchema, RegisterSchema } from "@/schemas/user.schema";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [animationDirection, setAnimationDirection] = useState<"forward" | "backward">("forward");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const { login, register } = useAuth();

  // Login form
  const loginForm = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  // Handle login submissions
  const handleLoginSubmit = async (values: z.infer<typeof LoginSchema>) => {
    setError(null);
    setIsLoading(true);

    try {
      await login(values.email, values.password);
      loginForm.reset();
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle register submission
  const handleRegisterSubmit = async (values: z.infer<typeof RegisterSchema>) => {
    setError(null);
    setIsLoading(true);

    try {
      await register(values.name, values.email, values.password);
      registerForm.reset();
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle between login and register modes
  const toggleMode = () => {
    setAnimationDirection(isLogin ? "forward" : "backward");
    setIsLogin(!isLogin);
    setError(null);
    loginForm.reset();
    registerForm.reset();
    setShowLoginPassword(false);
    setShowRegisterPassword(false);
  };

  const transitionClass = animationDirection === "forward"
    ? "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-6 duration-300"
    : "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-6 duration-300";

  const inputClassName =
    "h-11 rounded-xl border border-white/10 bg-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-0 focus-visible:border-cyan-400/50";
  const labelClassName = "text-xs font-medium uppercase tracking-[0.2em] text-white/60";

  const AuthError = ({ id }: { id: string }) => {
    if (!error) {
      return null;
    }

    return (
      <div
        id={id}
        role="alert"
        className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
      >
        {error}
      </div>
    );
  };

  const SubmitButton = ({ id, label }: { id: string; label: string }) => (
    <Button
      id={id}
      type="submit"
      className="group h-11 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(34,211,238,0.35)] transition-all hover:-translate-y-0.5 hover:from-cyan-400 hover:to-blue-400 hover:shadow-[0_16px_36px_rgba(34,211,238,0.45)] focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      disabled={isLoading}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </span>
      ) : (
        label
      )}
    </Button>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0f16] text-white font-['Space_Grotesk']">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1220] via-[#0a0f16] to-[#05070c]" />
      <div className="absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-500/15 blur-[160px]" />
      <div className="absolute bottom-[-120px] right-[-40px] h-[360px] w-[360px] rounded-full bg-blue-500/20 blur-[140px]" />
      <div className="absolute top-16 left-[-120px] h-[240px] w-[240px] rounded-full bg-indigo-500/15 blur-[120px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_40%,rgba(255,255,255,0.02))]" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_60px_rgba(34,211,238,0.18)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between px-6 pt-6 sm:px-8">
            <button
              id="login-back-home-button"
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
            >
              <ArrowLeft className="h-4 w-4" />
              Back Home
            </button>
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">
              Secure
            </span>
          </div>

          <div className="px-6 pb-6 pt-4 sm:px-8 sm:pb-8">
            <div key={isLogin ? "login-mode" : "register-mode"} className={transitionClass}>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="mt-2 text-sm text-white/60">
                {isLogin
                  ? "Enter your credentials to access your account."
                  : "Fill in the details below to get started."}
              </p>

              {isLogin ? (
                <Form {...loginForm} key="login-form">
                  <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="mt-6 space-y-5">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClassName}>Email</FormLabel>
                          <FormControl>
                            <Input
                              id="login-email-input"
                              type="email"
                              autoComplete="email"
                              placeholder="you@example.com"
                              disabled={isLoading}
                              className={inputClassName}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-rose-300" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClassName}>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                id="login-password-input"
                                type={showLoginPassword ? "text" : "password"}
                                autoComplete="current-password"
                                placeholder="********"
                                disabled={isLoading}
                                className={`${inputClassName} pr-11`}
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowLoginPassword((prev) => !prev)}
                                disabled={isLoading}
                                aria-label={showLoginPassword ? "Hide password" : "Show password"}
                                aria-pressed={showLoginPassword}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 disabled:cursor-not-allowed"
                              >
                                {showLoginPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-rose-300" />
                        </FormItem>
                      )}
                    />

                    <AuthError id="login-error-message" />

                    <SubmitButton id="login-submit-button" label="Sign In" />
                  </form>
                </Form>
              ) : (
                <Form {...registerForm} key="register-form">
                  <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="mt-6 space-y-5">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClassName}>Name</FormLabel>
                          <FormControl>
                            <Input
                              id="register-name-input"
                              type="text"
                              autoComplete="name"
                              placeholder="Alex Chen"
                              disabled={isLoading}
                              className={inputClassName}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-rose-300" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClassName}>Email</FormLabel>
                          <FormControl>
                            <Input
                              id="register-email-input"
                              type="email"
                              autoComplete="email"
                              placeholder="you@example.com"
                              disabled={isLoading}
                              className={inputClassName}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-rose-300" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClassName}>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                id="register-password-input"
                                type={showRegisterPassword ? "text" : "password"}
                                autoComplete="new-password"
                                placeholder="********"
                                disabled={isLoading}
                                className={`${inputClassName} pr-11`}
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowRegisterPassword((prev) => !prev)}
                                disabled={isLoading}
                                aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                                aria-pressed={showRegisterPassword}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 disabled:cursor-not-allowed"
                              >
                                {showRegisterPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-rose-300" />
                        </FormItem>
                      )}
                    />

                    <AuthError id="register-error-message" />

                    <SubmitButton id="register-submit-button" label="Sign Up" />
                  </form>
                </Form>
              )}
            </div>

            <div className="mt-6 text-center text-sm text-white/60">
              <span>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                id="auth-switch-mode-button"
                type="button"
                onClick={toggleMode}
                className="font-semibold text-cyan-300 transition-colors hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
