"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let supabase;
      try {
        supabase = createClient();
      } catch (configError) {
        console.error("❌ SignInPage: Erreur configuration Supabase:", configError);
        setError("Erreur de configuration. Vérifiez les variables d'environnement.");
        setLoading(false);
        return;
      }
      
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (signInError) {
        console.error("Erreur connexion:", signInError);

        // Messages d'erreur plus clairs
        let errorMessage = signInError.message;
        if (signInError.message?.includes("Invalid login credentials") || 
            signInError.message?.includes("invalid_credentials") ||
            signInError.status === 400) {
          errorMessage =
            "Email ou mot de passe incorrect. Vérifiez vos identifiants.";
        } else if (signInError.message?.includes("Email not confirmed") ||
                   signInError.message?.includes("email_not_confirmed")) {
          errorMessage =
            "Votre email n'a pas été confirmé. Vérifiez votre boîte mail et cliquez sur le lien de confirmation.";
        } else if (signInError.message?.includes("User not found")) {
          errorMessage =
            "Aucun compte n'est associé à cet email. Vérifiez votre adresse email ou créez un compte.";
        }

        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Vérifier que la session est bien établie
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          window.location.href = "/dashboard";
        } else {
          setError("La session n'a pas pu être établie. Veuillez réessayer.");
          setLoading(false);
        }
      } else {
        setError("Connexion échouée. Veuillez réessayer.");
        setLoading(false);
      }
    } catch (err) {
      setError("Une erreur est survenue lors de la connexion.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Se connecter à DYNAMIS BLOG
          </h2>
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">
                  Erreur lors de la connexion
                </span>
              </div>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Adresse e-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Pas encore de compte ?{" "}
              <Link
                href="/auth/signup"
                className="text-primary hover:underline font-medium"
              >
                S'inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
