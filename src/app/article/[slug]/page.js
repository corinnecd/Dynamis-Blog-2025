'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar, User, Edit, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getImageUrl } from '../../../lib/utils'

export default function ArticleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug
  const [article, setArticle] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
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

    async function loadArticle() {
      if (!slug) {
        if (mounted) {
          clearTimeout(timeoutId)
          setLoading(false)
        }
        return
      }

      try {
        const supabase = createClient()

        // Vérifier l'utilisateur connecté
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (currentUser && mounted) {
          setUser(currentUser)
          
          // Récupérer le profil
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single()
          
          if (mounted) {
            setProfile(profileData)
          }
        }

        // Récupérer l'article
        const { data: post, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('slug', slug)
          .single()

        if (!mounted) {
          return
        }

        // Vérifier les erreurs de récupération d'article
        if (postError) {
          // Vérifier si c'est une erreur "non trouvée" (plusieurs codes possibles)
          const isNotFoundError = 
            postError.code === 'PGRST116' || 
            postError.code === '42P01' ||
            postError.message?.includes('No rows') ||
            postError.message?.includes('not found') ||
            postError.message?.includes('Could not find')
          
          if (mounted) {
            clearTimeout(timeoutId)
            setError(isNotFoundError ? 'Article non trouvé.' : 'Erreur lors du chargement de l\'article.')
            setLoading(false)
          }
          return
        }

        if (!post) {
          if (mounted) {
            clearTimeout(timeoutId)
            setError('Article non trouvé.')
            setLoading(false)
          }
          return
        }

        // Récupérer la catégorie (non critique si erreur)
        const { data: category } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', post.category_slug)
          .single()

        // Récupérer l'auteur (non critique si erreur)
        const { data: author } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', post.author_id)
          .single()

        if (!mounted) {
          return
        }

        if (mounted) {
          clearTimeout(timeoutId)
          setArticle({
            ...post,
            category: category || null,
            author: author || null,
          })
          setLoading(false)
        }
      } catch (err) {
        console.error('Erreur:', err)
        if (mounted) {
          clearTimeout(timeoutId)
          setError('Une erreur est survenue.')
          setLoading(false)
        }
      }
    }

    loadArticle()

    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [slug])

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      return
    }

    try {
      const supabase = createClient()
      const isSuperAdmin = profile?.is_super_admin || user?.email === 'corinnediarra.cd@gmail.com'
      const isAuthor = article.author_id === user?.id

      if (!isSuperAdmin && !isAuthor) {
        alert('Vous n\'avez pas la permission de supprimer cet article.')
        return
      }

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', article.id)

      if (error) {
        alert('Erreur lors de la suppression.')
        return
      }

      window.location.href = '/'
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

  // Afficher l'erreur seulement si on a une erreur ET pas d'article
  if (error && !article) {
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

  // Si pas d'article et pas d'erreur, c'est qu'on est encore en chargement
  if (!article && !error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    )
  }

  const isSuperAdmin = profile?.is_super_admin || user?.email === 'corinnediarra.cd@gmail.com'
  const isAuthor = article.author_id === user?.id
  const canEdit = isSuperAdmin || isAuthor

  // Extraire l'image du contenu si elle existe (format markdown ![alt](data:image...))
  let articleContent = article.content || ''
  let coverImageUrl = null
  
  // Chercher une image en base64 dans le contenu (au début ou n'importe où)
  const imageMatch = articleContent.match(/!\[.*?\]\((data:image\/[^)]+)\)/)
  if (imageMatch) {
    coverImageUrl = imageMatch[1]
    // Retirer l'image du contenu pour l'affichage (peut être au début ou ailleurs)
    articleContent = articleContent.replace(/!\[.*?\]\(data:image\/[^)]+\)\n?\n?/g, '').trim()
  }

  // Extraire les tags de l'article (si le champ tags existe) et supprimer les doublons
  // Normaliser les tags (trim + casse) avant déduplication
  const articleTags = article.tags && article.tags.length > 0 ? (() => {
    const normalizedTags = article.tags
      .map(tag => typeof tag === 'string' ? tag.trim() : String(tag).trim())
      .filter(tag => tag.length > 0)
    
    const uniqueTags = []
    const seen = new Set()
    
    for (const tag of normalizedTags) {
      const normalized = tag.toLowerCase()
      if (!seen.has(normalized)) {
        seen.add(normalized)
        uniqueTags.push(tag) // Garder le tag original (avec sa casse)
      }
    }
    
    return uniqueTags
  })() : []

  return (
    <div className="min-h-screen bg-white">
      {/* Contenu principal */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Bouton retour et actions sur la même ligne */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
          
          {canEdit && (
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/articles/${article.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded transition-colors font-medium hover:bg-blue-700"
              >
                <Edit className="w-5 h-5" />
                Modifier
              </Link>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded transition-colors font-medium hover:bg-red-700"
              >
                <Trash2 className="w-5 h-5" />
                Supprimer
              </button>
            </div>
          )}
        </div>

        {/* Tag catégorie cliquable */}
        {article.category && (
          <div className="mb-4">
            <Link
              href={`/categories/${article.category.slug}`}
              className="inline-block px-4 py-2 border border-primary/30 text-primary rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 text-sm font-semibold uppercase"
            >
              {article.category.name}
            </Link>
          </div>
        )}

        {/* Titre */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          {article.title}
        </h1>

        {/* Meta : Auteur (cliquable) et Date */}
        <div className="flex items-center gap-4 text-gray-600 mb-8">
          <Link
            href={`/author/${article.author?.author_slug || article.author_id}`}
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="font-medium">
              {article.author?.user_name || article.author?.prenom || 'Anonyme'}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span>
              {format(new Date(article.created_at), 'd MMMM yyyy', { locale: fr })}
            </span>
          </div>
        </div>

        {/* Image de couverture - juste après le nom et la date */}
        {coverImageUrl && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={coverImageUrl}
              alt={article.title}
              className="w-full h-auto max-h-[600px] object-cover"
            />
          </div>
        )}

        {/* Contenu de l'article */}
        <div className="prose prose-lg max-w-none mb-12">
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {articleContent}
          </div>
        </div>

        {/* Tags en bas de l'article */}
        {articleTags.length > 0 && (
          <div className="border-t border-gray-200 pt-8 mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Tags :</h3>
            <div className="flex flex-wrap gap-2">
              {articleTags.map((tag, index) => (
                <Link
                  key={index}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-primary/30 text-primary rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 text-sm font-medium"
                >
                  <span>#</span>
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  )
}

