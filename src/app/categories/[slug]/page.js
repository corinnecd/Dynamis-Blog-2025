'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import ArticleCard from '../../../components/articles/ArticleCard'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Code, BrainCircuit, Zap, Globe, Brush } from 'lucide-react'

export default function CategoryPage() {
  const params = useParams()
  const slug = params.slug
  const [category, setCategory] = useState(null)
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    // Timeout de sécurité : forcer loading à false après 5 secondes maximum
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.log('⏱️ CategoryPage: Timeout - forcer loading à false')
        setLoading(false)
      }
    }, 5000)

    async function fetchData() {
      if (!slug) {
        if (mounted) {
          clearTimeout(timeoutId)
          setLoading(false)
        }
        return
      }

      try {
        const supabase = createClient()
        
        // Récupérer la catégorie par slug
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', slug)
          .single()

        if (!mounted) {
          return
        }

        // Vérifier les erreurs de récupération de catégorie
        if (categoryError) {
          // Vérifier si c'est une erreur "non trouvée" (plusieurs codes possibles)
          const isNotFoundError = 
            categoryError.code === 'PGRST116' || 
            categoryError.code === '42P01' ||
            categoryError.message?.includes('No rows') ||
            categoryError.message?.includes('not found') ||
            categoryError.message?.includes('Could not find')
          
          if (mounted) {
            clearTimeout(timeoutId)
            setError(isNotFoundError ? 'Catégorie non trouvée.' : 'Erreur lors du chargement de la catégorie.')
            setLoading(false)
          }
          return
        }

        // Si pas de données, c'est que la catégorie n'existe pas
        if (!categoryData) {
          if (mounted) {
            clearTimeout(timeoutId)
            setError('Catégorie non trouvée.')
            setLoading(false)
          }
          return
        }

        if (mounted) {
          setCategory(categoryData)
        }

        // Récupérer les articles de cette catégorie
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('category_slug', slug)
          .order('created_at', { ascending: false })

        if (!mounted) {
          return
        }

        // Les erreurs de posts ne sont pas critiques, on continue avec un tableau vide
        if (postsError) {
          console.error('Erreur posts:', postsError)
        }

        // Récupérer les profils
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')

        if (!mounted) {
          return
        }

        // Enrichir les articles (posts peut être null en cas d'erreur)
        const enrichedArticles = (posts || []).map(post => ({
          ...post,
          category: categoryData,
          author: profiles?.find(prof => prof.id === post.author_id)
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
          setError('Une erreur est survenue lors du chargement.')
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    )
  }

  // Afficher l'erreur seulement si on a une erreur ET pas de catégorie
  // Si on a une catégorie, on affiche la page même s'il n'y a pas d'articles
  if (error && !category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link href="/categories" className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium">
            Retour aux catégories
          </Link>
        </div>
      </div>
    )
  }

  // Si pas de catégorie et pas d'erreur, c'est qu'on est encore en chargement
  if (!category && !error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    )
  }

  // Mapping des icônes
  const iconMap = {
    ShieldCheck,
    Code,
    BrainCircuit,
    Zap,
    Globe,
    Brush,
  }

  const getIcon = (iconName) => {
    const IconComponent = iconMap[iconName] || Globe
    return IconComponent
  }

  const IconComponent = getIcon(category.icon)
  const gradientClasses = category.gradient || 'from-gray-500 to-gray-600'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4 max-w-7xl">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-3 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
          
          <div className="flex flex-col items-center text-center mb-2">
            <div className={`bg-gradient-to-r ${gradientClasses} w-16 h-16 rounded-full flex items-center justify-center mb-2`}>
              <IconComponent className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {category.name}
            </h1>
            <p className="text-sm text-gray-600">
              {articles.length} {articles.length === 1 ? 'article' : 'articles'}
            </p>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-7xl xl:max-w-[1400px]">
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 text-lg">
                Aucun article trouvé dans cette catégorie.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

