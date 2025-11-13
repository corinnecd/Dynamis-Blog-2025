'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase/client'
import ArticleCard from '../components/articles/ArticleCard'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function Home() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    async function fetchArticles() {
      try {
        const supabase = createClient()
        
        // Récupérer TOUS les posts
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(12)

        if (postsError) {
          console.error('Erreur posts:', postsError)
          throw postsError
        }

        console.log('📦 Posts récupérés:', posts)
        console.log('🖼️ Première image_url:', posts[0]?.image_url)

        // Récupérer les catégories
        const { data: categories } = await supabase
          .from('categories')
          .select('*')

        // Récupérer les profils
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')

        // Enrichir les articles
        const enrichedArticles = posts?.map(post => ({
          ...post,
          category: categories?.find(cat => cat.slug === post.category_slug),
          author: profiles?.find(prof => prof.id === post.author_id)
        })) || []

        console.log('✨ Articles enrichis:', enrichedArticles)
        setArticles(enrichedArticles)
      } catch (err) {
        console.error('❌ Erreur complète:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [])

  const displayedArticles = showAll ? articles : articles.slice(0, 3)
  const moreArticles = showAll ? [] : articles.slice(3, 9)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-blue-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            🚀 Explorez, Apprenez, <span className="text-blue-200">Partagez.</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            DYNAMIS Blog, votre plateforme 100% Tech !
          </p>
        </div>
      </section>

      {/* Section Derniers Articles */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Derniers articles
          </h2>
          
          {error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>Erreur lors du chargement des articles.</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          ) : articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedArticles.map((article) => (
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

      {/* Section Plus d'articles */}
      {!showAll && moreArticles.length > 0 && (
        <section className="pb-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Plus d'articles
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {moreArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Boutons Voir plus / Voir moins */}
      {articles.length > 3 && (
        <section className="pb-16">
          <div className="container mx-auto px-4 flex justify-center gap-4">
            {!showAll ? (
              <button
                onClick={() => setShowAll(true)}
                className="flex items-center gap-2 px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-300 font-medium"
              >
                Voir plus d'articles
                <ChevronDown className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowAll(false)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="flex items-center gap-2 px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all duration-300 font-medium"
              >
                Voir moins d'articles
                <ChevronUp className="w-5 h-5" />
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  )
}