'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  ShieldCheck, 
  Code, 
  BrainCircuit, 
  Zap, 
  Globe, 
  Brush,
  ArrowRight 
} from 'lucide-react'

// Mapping des icônes
const iconMap = {
  ShieldCheck,
  Code,
  BrainCircuit,
  Zap,
  Globe,
  Brush,
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [articleCounts, setArticleCounts] = useState({})
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

    async function fetchCategories() {
      try {
        let supabase
        try {
          supabase = createClient()
        } catch (configError) {
          console.error('❌ CategoriesPage: Erreur configuration Supabase:', configError)
          if (mounted) {
            clearTimeout(timeoutId)
            setError('Erreur de configuration. Vérifiez les variables d\'environnement.')
            setLoading(false)
          }
          return
        }
        
        // Récupérer toutes les catégories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true })

        if (!mounted) {
          return
        }

        if (categoriesError) {
          console.error('Erreur catégories:', categoriesError)
          throw categoriesError
        }

        // Récupérer tous les posts pour compter les articles par catégorie
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('category_slug')

        if (!mounted) {
          return
        }

        if (postsError) {
          console.error('Erreur posts:', postsError)
          throw postsError
        }

        // Compter les articles par catégorie
        const counts = {}
        posts?.forEach(post => {
          if (post.category_slug) {
            counts[post.category_slug] = (counts[post.category_slug] || 0) + 1
          }
        })

        if (mounted) {
          clearTimeout(timeoutId)
          setCategories(categoriesData || [])
          setArticleCounts(counts)
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

    fetchCategories()

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [])

  const getIcon = (iconName) => {
    const IconComponent = iconMap[iconName] || Globe
    return IconComponent
  }

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
      <section className="bg-white py-8 md:py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
            Toutes les catégories
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Découvrez tous les sujets Tech qui vous passionnent.
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-8 md:py-12 pb-12 md:pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>Erreur lors du chargement des catégories.</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mx-auto">
              {categories.map((category) => {
                const IconComponent = getIcon(category.icon)
                const articleCount = articleCounts[category.slug] || 0
                // Utiliser le gradient de la base de données ou un gradient par défaut
                const gradientClasses = category.gradient || 'from-gray-500 to-gray-600'
                
                return (
                  <Link 
                    key={category.id} 
                    href={`/categories/${category.slug}`}
                    className="block group"
                  >
                    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col">
                      {/* Gradient Header with Icon - h-36 (144px) */}
                      <div className={`bg-gradient-to-r ${gradientClasses} h-36 flex items-center justify-center`}>
                        <IconComponent className="w-16 h-16 text-white" />
                      </div>
                      
                      {/* Content */}
                      <div className="p-7 flex-grow flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        
                        <p className="text-gray-600 text-sm mb-4 flex-grow leading-relaxed">
                          {category.description}
                        </p>
                        
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                          <span className="text-sm text-gray-500">
                            {articleCount} {articleCount === 1 ? 'article' : 'articles'}
                          </span>
                          <span className="text-primary font-medium flex items-center gap-1.5 group-hover:gap-2 transition-all text-sm">
                            Explorer <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 text-lg">
                Aucune catégorie disponible pour le moment.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

