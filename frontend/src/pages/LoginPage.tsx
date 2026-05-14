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
import backgroundImage from "@/assets/sasuke-uchiha-5120x2880-19827.jpg";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [animationDirection, setAnimationDirection] = useState<"forward" | "backward">("forward");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  };

  const transitionClass = animationDirection === "forward"
    ? "animate-in fade-in slide-in-from-right-4 duration-300"
    : "animate-in fade-in slide-in-from-left-4 duration-300";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="absolute inset-0 bg-white/20" />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] rounded-lg border bg-card/90 shadow-sm backdrop-blur-sm">
          <div className="p-6">
            <div>
              <button id="login-back-home-button" onClick={() => navigate("/")} className="ml-auto block text-sm font-medium text-muted-foreground hover:underline cursor-pointer">
                Back to Home
              </button>
            </div>

            <div key={isLogin ? "login-mode" : "register-mode"} className={transitionClass}>
              <h1 className="font-extrabold text-2xl text-dark-blue">{isLogin ? "Welcome Back" : "Create Account"}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isLogin
                  ? "Enter your credentials to access your account"
                  : "Fill in your details to create a new account"}
              </p>

              {isLogin ? (
                <Form {...loginForm} key="login-form">
                  <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4 mt-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              id="login-email-input"
                              type="email"
                              placeholder="you@example.com"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              id="login-password-input"
                              type="password"
                              placeholder="••••••••"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {error && (
                      <div id="login-error-message" className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                        {error}
                      </div>
                    )}

                    <Button id="login-submit-button" type="submit" className="w-full bg-dark-blue hover:bg-dark-blue-light cursor-pointer" disabled={isLoading}>
                      {isLoading ? "Loading..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
              ) : (
                <Form {...registerForm} key="register-form">
                  <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-4 mt-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input
                              id="register-name-input"
                              type="text"
                              placeholder="Faker"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              id="register-email-input"
                              type="email"
                              placeholder="you@example.com"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              id="register-password-input"
                              type="password"
                              placeholder="••••••••"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {error && (
                      <div id="register-error-message" className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                        {error}
                      </div>
                    )}

                    <Button id="register-submit-button" type="submit" className="w-full bg-dark-blue hover:bg-dark-blue-light cursor-pointer" disabled={isLoading}>
                      {isLoading ? "Loading..." : "Sign Up"}
                    </Button>
                  </form>
                </Form>
              )}
            </div>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                id="auth-switch-mode-button"
                type="button"
                onClick={toggleMode}
                className="text-dark-blue hover:underline font-medium cursor-pointer"
                disabled={isLoading}
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
