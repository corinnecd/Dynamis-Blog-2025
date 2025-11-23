'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

export default function SignUpPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    setLoading(true)

    try {
      let supabase
      try {
        supabase = createClient()
      } catch (configError) {
        console.error('❌ SignUpPage: Erreur configuration Supabase:', configError)
        setError('Erreur de configuration. Vérifiez les variables d\'environnement.')
        setLoading(false)
        return
      }
      
      // Créer l'utilisateur (sans créer le profil immédiatement pour éviter les conflits avec les triggers)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            user_name: username.trim(),
          },
        },
      })

      if (signUpError) {
        console.error('Erreur signup:', signUpError)
        let errorMessage = signUpError.message || 'Erreur lors de l\'inscription.'
        
        // Messages d'erreur plus clairs
        if (signUpError.message?.includes('User already registered') || signUpError.message?.includes('already registered')) {
          errorMessage = 'Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.'
        } else if (signUpError.message?.includes('Password')) {
          errorMessage = 'Le mot de passe ne respecte pas les critères requis.'
        } else if (signUpError.message?.includes('Database error')) {
          errorMessage = 'Erreur lors de la création du compte. Vérifiez que tous les champs sont corrects et réessayez.'
        }
        
        setError(errorMessage)
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('L\'utilisateur n\'a pas pu être créé. Vérifiez votre email de confirmation si l\'inscription nécessite une confirmation.')
        setLoading(false)
        return
      }

      // Attendre un peu pour que le trigger Supabase crée le profil (si il existe)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Générer un author_slug à partir du username
      const baseSlug = username.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const authorSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`
      
      // Vérifier si le profil existe déjà (créé par un trigger)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single()

      // Si le profil n'existe pas, le créer
      if (!existingProfile) {
        const isSuperAdmin = email.trim().toLowerCase() === 'corinnediarra.cd@gmail.com'
        
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: authData.user.id,
                user_name: username.trim(),
                author_slug: authorSlug,
                is_super_admin: isSuperAdmin,
              },
            ])

          if (profileError) {
            console.error('Erreur création profil:', profileError)
            // Ne pas bloquer l'inscription même si le profil ne peut pas être créé
            // L'utilisateur pourra toujours se connecter et le profil pourra être créé plus tard
            if (profileError.code !== '23505' && !profileError.message?.includes('duplicate')) {
              console.warn('Le profil n\'a pas pu être créé automatiquement. L\'utilisateur peut toujours se connecter.')
            }
          } else {
            console.log('✅ Profil créé avec succès')
          }
        } catch (profileErr) {
          console.error('Exception lors de la création du profil:', profileErr)
          // Ne pas bloquer l'inscription
        }
      } else {
        // Le profil existe déjà, le mettre à jour avec les informations manquantes
        try {
          const isSuperAdmin = email.trim().toLowerCase() === 'corinnediarra.cd@gmail.com'
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              user_name: username.trim(),
              author_slug: authorSlug,
              is_super_admin: isSuperAdmin,
            })
            .eq('id', authData.user.id)

          if (updateError) {
            console.warn('Erreur mise à jour profil:', updateError)
          } else {
            console.log('✅ Profil mis à jour avec succès')
          }
        } catch (updateErr) {
          console.error('Exception lors de la mise à jour du profil:', updateErr)
        }
      }

      // Toujours rediriger vers la page de connexion après une inscription réussie
      console.log('✅ Inscription réussie, redirection vers la page de connexion')
      setLoading(false)
      
      // Afficher un message de succès temporaire
      const successMessage = 'Votre compte a été créé avec succès ! Redirection vers la page de connexion...'
      setError(successMessage)
      
      // Rediriger vers la page de connexion après un court délai
      setTimeout(() => {
        window.location.href = '/auth/signin'
      }, 2000)
    } catch (err) {
      setError('Une erreur est survenue lors de l\'inscription.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6 text-center">
            Créer un compte sur DYNAMIS BLOG
          </h2>

          {error && (
            <div className={`mb-4 p-3 rounded ${
              error.includes('succès') || error.includes('créé avec succès')
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Nom d'utilisateur
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Votre nom d'utilisateur"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6+ caractères"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez le mot de passe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Inscription...' : "S'inscrire"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Déjà un compte ?{' '}
              <Link href="/auth/signin" className="text-primary hover:underline font-medium">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

