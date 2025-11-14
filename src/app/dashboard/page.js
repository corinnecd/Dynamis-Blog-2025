'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Edit, Trash2, FileText } from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    // Timeout de sécurité : forcer loading à false après 10 secondes maximum
    const timeoutId = setTimeout(() => {
      if (mounted) {
        setLoading(false)
      }
    }, 10000)
    
    async function checkAuth() {
      try {
        const supabase = createClient()
        
        // Vérifier l'authentification
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
        
        if (!mounted) {
          return
        }
        
        if (authError || !currentUser) {
          if (mounted) {
            clearTimeout(timeoutId)
            setLoading(false)
            // Petit délai pour permettre à setLoading de s'exécuter avant la redirection
            setTimeout(() => {
              window.location.href = '/auth/signin'
            }, 100)
          }
          return
        }

        setUser(currentUser)

        // Récupérer le profil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single()

        if (!mounted) {
          return
        }

        if (profileError) {
          console.error('Erreur profil:', profileError)
          if (mounted) {
            clearTimeout(timeoutId)
            setError('Erreur lors du chargement du profil.')
            setLoading(false)
          }
          return
        }

        if (mounted) {
          setProfile(profileData)
        }

        // Vérifier si super admin (par email ou is_super_admin)
        const isSuperAdmin = profileData?.is_super_admin || currentUser.email === 'corinnediarra.cd@gmail.com'

        // Récupérer les articles de l'utilisateur (ou tous si super admin)
        let articlesQuery = supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })

        // Si pas super admin, filtrer par author_id
        if (!isSuperAdmin) {
          articlesQuery = articlesQuery.eq('author_id', currentUser.id)
        }

        const { data: articlesData, error: articlesError } = await articlesQuery

        if (!mounted) {
          return
        }

        if (articlesError) {
          console.error('Erreur articles:', articlesError)
          if (mounted) {
            clearTimeout(timeoutId)
            setError('Erreur lors du chargement des articles.')
            setLoading(false)
          }
          return
        }

        // Enrichir avec les catégories et profils
        const { data: categories } = await supabase.from('categories').select('*')
        const { data: profiles } = await supabase.from('profiles').select('*')

        if (!mounted) {
          return
        }

        const enrichedArticles = articlesData?.map(article => ({
          ...article,
          category: categories?.find(cat => cat.slug === article.category_slug),
          author: profiles?.find(prof => prof.id === article.author_id)
        })) || []

        if (mounted) {
          clearTimeout(timeoutId)
          setArticles(enrichedArticles)
          setLoading(false)
        }
      } catch (err) {
        console.error('❌ Erreur:', err)
        if (mounted) {
          clearTimeout(timeoutId)
          setError('Une erreur est survenue.')
          setLoading(false)
        }
      }
    }

    checkAuth()
    
    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [])

  const handleDelete = async (articleId, articleAuthorId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      return
    }

    try {
      const supabase = createClient()
      
      // Vérifier les permissions avant de supprimer
      const isSuperAdmin = profile?.is_super_admin || user?.email === 'corinnediarra.cd@gmail.com'
      const isAuthor = articleAuthorId === user?.id

      if (!isSuperAdmin && !isAuthor) {
        alert('Vous n\'avez pas la permission de supprimer cet article.')
        return
      }

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', articleId)

      if (error) {
        alert('Erreur lors de la suppression.')
        return
      }

      // Recharger les articles
      window.location.reload()
    } catch (err) {
      console.error('Erreur suppression:', err)
      alert('Erreur lors de la suppression.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    )
  }

  if (error && !user) {
    return null // Redirection en cours
  }

  const isSuperAdmin = profile?.is_super_admin || user?.email === 'corinnediarra.cd@gmail.com'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Mon Dashboard
              </h1>
              <p className="text-gray-600">
                Bienvenue, {profile?.user_name || 'Utilisateur'}
                {isSuperAdmin && (
                  <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium">
                    Super Admin
                  </span>
                )}
              </p>
            </div>
            <Link
              href="/dashboard/articles/new"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Créer un article
            </Link>
          </div>
        </div>
      </section>

      {/* Articles List */}
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : articles.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {isSuperAdmin ? 'Tous les articles' : 'Mes articles'} ({articles.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {articles.map((article) => {
                  const canEdit = isSuperAdmin || article.author_id === user?.id
                  return (
                    <div key={article.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {article.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                            <Link
                              href={`/author/${article.author?.author_slug || article.author_id}`}
                              className="hover:text-primary transition-colors"
                            >
                              Par {article.author?.user_name || 'Anonyme'}
                            </Link>
                            <span>•</span>
                            <span>
                              {new Date(article.created_at).toLocaleDateString('fr-FR')}
                            </span>
                            {article.category && (
                              <>
                                <span>•</span>
                                <Link
                                  href={`/categories/${article.category.slug}`}
                                  className="px-2 py-1 bg-blue-50 text-primary rounded text-xs hover:bg-blue-100 transition-colors"
                                >
                                  {article.category.name}
                                </Link>
                              </>
                            )}
                          </div>
                          {article.excerpt && (
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {article.excerpt}
                            </p>
                          )}
                        </div>
                        {canEdit && (
                          <div className="flex items-center gap-2 ml-4">
                            <Link
                              href={`/dashboard/articles/${article.id}/edit`}
                              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-5 h-5" />
                              <span>Modifier</span>
                            </Link>
                            <button
                              onClick={() => handleDelete(article.id, article.author_id)}
                              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-5 h-5" />
                              <span>Supprimer</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun article
              </h3>
              <p className="text-gray-600 mb-6">
                {isSuperAdmin 
                  ? "Aucun article n'a été créé pour le moment."
                  : "Vous n'avez pas encore créé d'article."}
              </p>
              <Link
                href="/dashboard/articles/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Créer votre premier article
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

