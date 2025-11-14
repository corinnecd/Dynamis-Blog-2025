'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import ArticleCard from '../../../components/articles/ArticleCard'
import Link from 'next/link'
import { ArrowLeft, Tag } from 'lucide-react'

export default function TagPage() {
  const params = useParams()
  const tag = decodeURIComponent(params.tag)
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchArticles() {
      try {
        const supabase = createClient()
        
        // Récupérer tous les articles
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })

        if (postsError) {
          console.error('Erreur posts:', postsError)
          throw postsError
        }

        // Filtrer les articles qui contiennent le tag
        const filteredPosts = posts?.filter(post => {
          const postTags = post.tags || []
          return postTags.includes(tag)
        }) || []

        // Récupérer les catégories
        const { data: categories } = await supabase
          .from('categories')
          .select('*')

        // Récupérer les profils
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')

        // Enrichir les articles
        const enrichedArticles = filteredPosts.map(post => ({
          ...post,
          category: categories?.find(cat => cat.slug === post.category_slug),
          author: profiles?.find(prof => prof.id === post.author_id)
        }))

        setArticles(enrichedArticles)
      } catch (err) {
        console.error('❌ Erreur complète:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [tag])

  if (loading) {
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
          
          <div className="flex items-center gap-3 mb-2">
            <Tag className="w-5 h-5 text-primary" />
            <span className="inline-flex items-center gap-1 px-3 py-1.5 border border-primary/30 text-primary rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 text-sm font-semibold">
              #{tag}
            </span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Articles avec le tag #{tag}
          </h1>
          <p className="text-sm text-gray-600">
            {articles.length} {articles.length === 1 ? 'article trouvé' : 'articles trouvés'}
          </p>
        </div>
      </div>

      {/* Articles */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          {error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>Erreur lors du chargement des articles.</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          ) : articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 text-lg">
                Aucun article trouvé pour le tag "{tag}".
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 mt-12 bg-white">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2025 Dynamis Blog - All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

