import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import backgroundImage from "@/assets/sasuke-uchiha-5120x2880-19827.jpg";

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async () => {
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

  const greeting = isAuthenticated ? `Hello ${user?.name ?? "User"}!` : "Hello world!";
  const buttonLabel = isAuthenticated ? "Logout" : "Login";

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="absolute inset-0 bg-white/20" />
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="bg-white/90 p-5 rounded-lg">
          <p id="home-greeting" className="text-3xl font-extrabold text-dark-blue mb-2">{greeting}</p>
          <Button id="home-action-button" className="bg-dark-blue cursor-pointer hover:bg-dark-blue-light" onClick={handleClick} disabled={isLoading || isSubmitting}>
            {isSubmitting ? "Loading..." : buttonLabel}
          </Button>
        </div>
      </section>
    </main>
  );
}
