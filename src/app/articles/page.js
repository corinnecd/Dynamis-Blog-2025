'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ArticleCard from '@/components/articles/ArticleCard'

export default function ArticlesPage() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    // Timeout de sécurité : forcer loading à false après 15 secondes maximum
    const timeoutId = setTimeout(() => {
      if (mounted) {
        setLoading(false)
      }
    }, 15000)

    async function fetchArticles() {
      try {
        let supabase
        try {
          supabase = createClient()
        } catch (configError) {
          console.error('❌ ArticlesPage: Erreur configuration Supabase:', configError)
          if (mounted) {
            clearTimeout(timeoutId)
            setError('Erreur de configuration. Vérifiez les variables d\'environnement.')
            setLoading(false)
          }
          return
        }
        
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })

        if (!mounted) {
          return
        }

        if (postsError) {
          console.error('Erreur posts:', postsError)
          if (mounted) {
            clearTimeout(timeoutId)
            setError('Erreur lors du chargement des articles.')
            setLoading(false)
          }
          return
        }

        // Requêtes parallèles pour catégories et profils avec gestion d'erreur
        const [categoriesResult, profilesResult] = await Promise.allSettled([
          supabase.from('categories').select('*'),
          supabase.from('profiles').select('*')
        ])

        const categories = categoriesResult.status === 'fulfilled' && categoriesResult.value.data 
          ? categoriesResult.value.data 
          : []
        const profiles = profilesResult.status === 'fulfilled' && profilesResult.value.data
          ? profilesResult.value.data
          : []

        if (!mounted) {
          return
        }

        const enrichedArticles = (posts || []).map(post => ({
          ...post,
          category: categories?.find(cat => cat.slug === post.category_slug),
          author: profiles?.find(prof => prof.id === post.author_id)
        }))

        if (mounted) {
          clearTimeout(timeoutId)
          setArticles(enrichedArticles)
          setLoading(false)
          setError(null)
        }
      } catch (err) {
        console.error('❌ Erreur complète:', err)
        if (mounted) {
          clearTimeout(timeoutId)
          setError('Une erreur est survenue lors du chargement.')
          setLoading(false)
        }
      }
    }

    fetchArticles()

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-7xl xl:max-w-[1400px]">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Tous les articles
          </h1>
          
          {error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>Erreur lors du chargement des articles.</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          ) : articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 text-lg">
                Aucun article publié pour le moment.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
