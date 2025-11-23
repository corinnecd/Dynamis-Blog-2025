'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useRef, useEffect } from 'react'
import { User, LogOut, LayoutDashboard, Plus } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const { user, signOut, loading } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const dropdownRef = useRef(null)
  const pathname = usePathname()
  const isDashboardPage = pathname?.startsWith('/dashboard')

  // Récupérer le profil de l'utilisateur
  useEffect(() => {
    let mounted = true
    
    async function fetchProfile() {
      if (user && user.id) {
        try {
          const { createClient } = await import('@/lib/supabase/client')
          let supabase
          try {
            supabase = createClient()
          } catch (configError) {
            console.error('❌ Navbar: Erreur configuration Supabase:', configError)
            return
          }
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          if (mounted) {
            setProfile(data)
          }
        } catch (error) {
          console.error('Erreur récupération profil:', error)
        }
      } else if (mounted) {
        setProfile(null)
      }
    }
    
    fetchProfile()
    
    return () => {
      mounted = false
    }
  }, [user?.id])

  // Fermer le dropdown si on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  const handleSignOut = async () => {
    setDropdownOpen(false)
    const result = await signOut()
    if (!result.error) {
      // Forcer le rechargement de la page pour s'assurer que la session est bien supprimée
      window.location.href = '/'
    } else {
      console.error('Erreur lors de la déconnexion:', result.error)
      alert('Erreur lors de la déconnexion. Veuillez réessayer.')
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 py-3 md:py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo à gauche */}
        <Link href="/" className="text-xl md:text-2xl font-bold text-primary">
          DYNAMIS BLOG
        </Link>
        
        {/* Catégories au centre - masqué sur mobile */}
        <div className="hidden md:flex flex-1 justify-center">
          <Link 
            href="/categories" 
            className="px-4 py-2 rounded-lg transition-colors font-medium hover:text-primary"
          >
            Catégories
          </Link>
        </div>

        {/* Boutons à droite */}
        <div className="flex items-center gap-2 md:gap-4">
          {loading ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
          ) : user ? (
            <>
              {/* Bouton Créer un article (sauf sur le dashboard) - masqué sur mobile */}
              {!isDashboardPage && (
                <Link
                  href="/dashboard/articles/new"
                  className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary transition-colors font-medium"
                  title="Créer un article"
                >
                  <Plus className="w-4 h-4" />
                  <span>Créer un article</span>
                </Link>
              )}
              
              {/* Menu déroulant du profil */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="p-2 text-gray-700 hover:text-primary transition-colors rounded-full hover:bg-gray-100"
                  aria-label="Menu profil"
                >
                  <User className="w-5 h-5" />
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 min-w-[220px] bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50">
                    <div className="px-3 py-2 border-b border-gray-200 mb-2">
                      <p className="text-sm font-semibold text-gray-900">
                        Bonjour, {profile?.user_name || user.email?.split('@')[0] || 'Utilisateur'} !
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {user.email}
                      </p>
                    </div>
                    
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    
                    {/* Bouton Créer un article dans le menu déroulant (visible sur mobile et desktop) */}
                    {!isDashboardPage && (
                      <Link
                        href="/dashboard/articles/new"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <Plus className="w-4 h-4" />
                        Créer un article
                      </Link>
                    )}
                    
                    <div className="h-px bg-gray-200 my-2" />
                    
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded cursor-pointer outline-none"
                    >
                      <span className="flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        Se déconnecter
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Boutons Se connecter et S'inscrire - masqués sur mobile, visibles sur desktop */}
              <div className="hidden md:flex items-center gap-4">
                <Link 
                  href="/auth/signin" 
                  className="text-gray-700 hover:text-primary transition-colors font-medium"
                >
                  Se connecter
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
                >
                  S'inscrire
                </Link>
              </div>
              
              {/* Menu déroulant du profil - visible uniquement sur mobile quand non connecté */}
              <div className="relative md:hidden" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="p-2 text-gray-700 hover:text-primary transition-colors rounded-full hover:bg-gray-100"
                  aria-label="Menu profil"
                >
                  <User className="w-5 h-5" />
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 min-w-[220px] bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50">
                    <Link
                      href="/auth/signin"
                      className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer outline-none mb-2"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Se connecter
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-primary text-white rounded hover:bg-primary-hover transition-colors cursor-pointer outline-none"
                      onClick={() => setDropdownOpen(false)}
                    >
                      S'inscrire
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}