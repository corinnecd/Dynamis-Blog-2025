'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ArticleCard from '@/components/articles/ArticleCard'
import Link from 'next/link'
import { ArrowLeft, User } from 'lucide-react'

export default function AuthorPage() {
  const params = useParams()
  const authorSlug = params.authorSlug
  const [author, setAuthor] = useState(null)
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    // Timeout de sécurité : forcer loading à false après 10 secondes maximum
    const timeoutId = setTimeout(() => {
      if (mounted) {
        setLoading(false)
      }
    }, 10000)

    async function fetchData() {
      if (!authorSlug) {
        if (mounted) {
          clearTimeout(timeoutId)
          setLoading(false)
        }
        return
      }

      try {
        let supabase
        try {
          supabase = createClient()
        } catch (configError) {
          console.error('❌ AuthorPage: Erreur configuration Supabase:', configError)
          if (mounted) {
            clearTimeout(timeoutId)
            setError('Erreur de configuration. Vérifiez les variables d\'environnement.')
            setLoading(false)
          }
          return
        }
        
        // Récupérer l'auteur par slug ou ID
        let authorData = null
        
        // Essayer de trouver par author_slug
        const { data: profileBySlug } = await supabase
          .from('profiles')
          .select('*')
          .eq('author_slug', authorSlug)
          .single()
        
        if (profileBySlug) {
          authorData = profileBySlug
        } else {
          // Si pas trouvé par slug, essayer par ID
          const { data: profileById } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authorSlug)
            .single()
          
          if (profileById) {
            authorData = profileById
          }
        }

        if (!mounted) {
          return
        }

        if (!authorData) {
          if (mounted) {
            clearTimeout(timeoutId)
            setError('Auteur non trouvé.')
            setLoading(false)
          }
          return
        }

        if (mounted) {
          setAuthor(authorData)
        }

        // Récupérer les articles de l'auteur
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('author_id', authorData.id)
          .order('created_at', { ascending: false })

        if (!mounted) {
          return
        }

        // Les erreurs de posts ne sont pas critiques, on continue avec un tableau vide
        if (postsError) {
          console.error('Erreur posts:', postsError)
        }

        // Récupérer les catégories
        const { data: categories } = await supabase
          .from('categories')
          .select('*')

        if (!mounted) {
          return
        }

        // Enrichir les articles
        const enrichedArticles = (posts || []).map(post => ({
          ...post,
          category: categories?.find(cat => cat.slug === post.category_slug),
          author: authorData
        }))

        if (mounted) {
          clearTimeout(timeoutId)
          setArticles(enrichedArticles)
          setLoading(false)
        }
      } catch (err) {
        console.error('❌ Erreur complète:', err)
        if (mounted) {
          clearTimeout(timeoutId)
          setError(err.message)
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [authorSlug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    )
  }

  // Afficher l'erreur seulement si on a une erreur ET pas d'auteur
  if (error && !author) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link href="/" className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  // Si pas d'auteur et pas d'erreur, c'est qu'on est encore en chargement
  if (!author && !error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4 max-w-7xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-3 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
          
          <div className="flex flex-col items-center text-center mb-2">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-2">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 uppercase mb-1">AUTEUR</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {author.user_name || author.prenom || 'Anonyme'}
            </h1>
            <p className="text-sm text-gray-600">
              {articles.length} {articles.length === 1 ? 'article publié' : 'articles publiés'}
            </p>
          </div>
        </div>
      </div>

      {/* Articles */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 text-lg">
                Aucun article publié par cet auteur.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

