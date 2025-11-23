'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { generateSlug as generateSlugUtil } from '@/lib/utils'
import { Upload, X, Pencil } from 'lucide-react'
import Link from 'next/link'

export default function EditArticlePage() {
  const params = useParams()
  const articleId = params.id
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [article, setArticle] = useState(null)
  const [originalAuthor, setOriginalAuthor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [currentImageUrl, setCurrentImageUrl] = useState(null)
  const [originalImageUrl, setOriginalImageUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
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
    
    async function loadData() {
      try {
        if (!articleId) {
          if (mounted) {
            clearTimeout(timeoutId)
            setError('ID d\'article invalide.')
            setLoading(false)
          }
          return
        }

        let supabase
        try {
          supabase = createClient()
        } catch (configError) {
          console.error('❌ EditArticlePage: Erreur configuration Supabase:', configError)
          if (mounted) {
            clearTimeout(timeoutId)
            setError('Erreur de configuration. Vérifiez les variables d\'environnement.')
            setLoading(false)
          }
          return
        }
        
        // Vérifier l'authentification
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
        
        if (!mounted) {
          return
        }
        
        if (authError || !currentUser) {
          if (mounted) {
            clearTimeout(timeoutId)
            setLoading(false)
            window.location.href = '/auth/signin'
          }
          return
        }

        if (mounted) {
          setUser(currentUser)
        }

        // Récupérer le profil
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single()

        if (!mounted) return

        if (mounted) {
          setProfile(profileData)
        }

        // Récupérer l'article
        let { data: articleData, error: articleError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', articleId)
          .single()

        if (!mounted) return

        if (articleError) {
          console.error('Erreur récupération article:', articleError)
          if (mounted) {
            clearTimeout(timeoutId)
            setError(`Erreur: ${articleError.message || 'Article non trouvé.'}`)
            setLoading(false)
          }
          return
        }

        if (!articleData) {
          if (mounted) {
            clearTimeout(timeoutId)
            setError('Article non trouvé.')
            setLoading(false)
          }
          return
        }

        // Vérifier les permissions
        const isSuperAdmin = profileData?.is_super_admin || currentUser.email === 'corinnediarra.cd@gmail.com'
        const isAuthor = articleData.author_id === currentUser.id

        if (!isSuperAdmin && !isAuthor) {
          if (mounted) {
            clearTimeout(timeoutId)
            setError('Vous n\'avez pas la permission de modifier cet article.')
            setLoading(false)
          }
          return
        }

        if (mounted) {
          setArticle(articleData)
        }

        // Si le super admin modifie un article qu'il n'a pas créé, récupérer l'auteur original
        if (isSuperAdmin && !isAuthor) {
          const { data: authorData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', articleData.author_id)
            .single()
          
          if (mounted) {
            setOriginalAuthor(authorData)
          }
        }

        // Récupérer les catégories
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .order('name')

        // Récupérer la catégorie actuelle
        const { data: currentCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', articleData.category_slug)
          .single()

        if (!mounted) return

        if (mounted) {
          setCategories(categoriesData || [])
          
          // Extraire l'image du contenu si elle existe (format markdown ![alt](data:image...))
          let articleContent = articleData.content || ''
          let extractedImageUrl = null
          
          // Chercher une image en base64 dans le contenu
          const imageMatch = articleContent.match(/^!\[.*?\]\((data:image\/[^)]+)\)/)
          if (imageMatch) {
            extractedImageUrl = imageMatch[1]
            // Retirer l'image du contenu pour l'éditeur
            articleContent = articleContent.replace(/^!\[.*?\]\(data:image\/[^)]+\)\n\n?/, '').trim()
          }
          
          // Initialiser les champs
          setTitle(articleData.title || '')
          setExcerpt(articleData.excerpt || '')
          setContent(articleContent)
          setSelectedCategory(currentCategory?.id || '')
          setTags(Array.isArray(articleData.tags) ? articleData.tags : [])
          setCurrentImageUrl(extractedImageUrl)
          setOriginalImageUrl(extractedImageUrl)
          clearTimeout(timeoutId)
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

    loadData()
    
    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [articleId])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setCurrentImageUrl(null)
  }

  const handleTagInputChange = (e) => {
    const value = e.target.value
    setTagInput(value)
    
    if (value.trim()) {
      // Filtrer les catégories qui correspondent à la saisie
      const filtered = categories.filter(cat =>
        cat.name.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const selectSuggestion = (categoryName) => {
    setTagInput(categoryName)
    setShowSuggestions(false)
    setSuggestions([])
  }

  const addTag = () => {
    const trimmedTag = tagInput.trim()
    if (!trimmedTag) return
    
    // Vérifier que le tag correspond à une catégorie existante
    const categoryExists = categories.some(cat => 
      cat.name.toLowerCase() === trimmedTag.toLowerCase()
    )
    
    if (!categoryExists) {
      setError('Veuillez sélectionner une catégorie valide.')
      return
    }
    
    // Vérifier si le tag existe déjà (insensible à la casse)
    if (tags.some(tag => tag.toLowerCase() === trimmedTag.toLowerCase())) {
      setError('Ce tag existe déjà.')
      setTagInput('')
      setShowSuggestions(false)
      return
    }
    
    // Limiter à 3 tags maximum
    if (tags.length >= 3) {
      setError('Vous ne pouvez ajouter que 3 tags maximum.')
      setTagInput('')
      setShowSuggestions(false)
      return
    }
    
    setTags([...tags, trimmedTag])
    
    // Si c'est le premier tag, le définir comme catégorie principale
    if (tags.length === 0) {
      const selectedCat = categories.find(cat => 
        cat.name.toLowerCase() === trimmedTag.toLowerCase()
      )
      if (selectedCat) {
        setSelectedCategory(selectedCat.id)
      }
    }
    
    setTagInput('')
    setShowSuggestions(false)
    setSuggestions([])
    setError(null)
  }

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Si une suggestion est affichée, sélectionner la première
      if (showSuggestions && suggestions.length > 0) {
        selectSuggestion(suggestions[0].name)
      } else {
        addTag()
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Empêcher les soumissions multiples
    if (uploading) {
      return
    }
    
    setError(null)
    setUploading(true)

    try {
      // Validation
      if (!title.trim()) {
        setError('Le titre est requis.')
        setUploading(false)
        return
      }

      if (!excerpt.trim()) {
        setError('L\'extrait est requis.')
        setUploading(false)
        return
      }

      if (excerpt.length > 200) {
        setError('L\'extrait ne doit pas dépasser 200 caractères.')
        setUploading(false)
        return
      }

      if (!selectedCategory) {
        setError('Veuillez sélectionner une catégorie.')
        setUploading(false)
        return
      }

      if (!content.trim()) {
        setError('Le contenu est requis.')
        setUploading(false)
        return
      }

      let supabase
      try {
        supabase = createClient()
      } catch (configError) {
        console.error('❌ Erreur configuration Supabase:', configError)
        setError('Erreur de configuration. Vérifiez les variables d\'environnement.')
        setUploading(false)
        return
      }

      // Convertir l'image en base64 si une nouvelle image est fournie (stockage local dans le contenu)
      let contentWithImage = content.trim()
      if (imageFile) {
        try {
          const reader = new FileReader()
          const base64Image = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(imageFile)
          })
          
          // Supprimer l'ancienne image du contenu si elle existe (ligne commençant par ![])
          const lines = contentWithImage.split('\n')
          const filteredLines = lines.filter(line => !line.trim().startsWith('!['))
          contentWithImage = filteredLines.join('\n').trim()
          
          // Ajouter la nouvelle image en base64 au début du contenu
          const imageMarkdown = `![${title}](${base64Image})\n\n`
          contentWithImage = imageMarkdown + contentWithImage
        } catch (imgError) {
          console.error('Erreur conversion image:', imgError)
          setError('Erreur lors du traitement de l\'image.')
          setUploading(false)
          return
        }
      } else if (originalImageUrl && !currentImageUrl) {
        // L'utilisateur a supprimé l'image, retirer du contenu
        const lines = contentWithImage.split('\n')
        const filteredLines = lines.filter(line => !line.trim().startsWith('!['))
        contentWithImage = filteredLines.join('\n').trim()
      }

      // Générer le slug si le titre a changé
      let finalSlug = article.slug
      if (title.trim() !== article.title) {
        const newSlug = generateSlugUtil(title)
        // Vérifier si le slug existe déjà (sauf pour l'article actuel)
        const { data: existingPost } = await supabase
          .from('posts')
          .select('id')
          .eq('slug', newSlug)
          .neq('id', articleId)
          .single()

        finalSlug = existingPost ? `${newSlug}-${Date.now()}` : newSlug
      }

      // Récupérer la catégorie
      const { data: categoryData } = await supabase
        .from('categories')
        .select('slug')
        .eq('id', selectedCategory)
        .single()

      // Préparer les données de mise à jour (sans image_url)
      const updateData = {
        title: title.trim(),
        slug: finalSlug,
        excerpt: excerpt.trim(),
        content: contentWithImage,
        category_slug: categoryData?.slug,
        tags: tags.length > 0 ? tags : null,
      }

      // Si le super admin modifie un article qu'il n'a pas créé, conserver l'auteur original
      const isSuperAdmin = profile?.is_super_admin || user?.email === 'corinnediarra.cd@gmail.com'
      const isAuthor = article.author_id === user?.id

      if (isSuperAdmin && !isAuthor) {
        // Conserver l'auteur_id original
        updateData.author_id = article.author_id
      }

      // Mettre à jour l'article
      const { data: updatedArticle, error: updateError } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', articleId)
        .select()
        .single()

      if (updateError) {
        console.error('Erreur mise à jour:', updateError)
        throw updateError
      }

      if (!updatedArticle) {
        throw new Error('L\'article n\'a pas pu être modifié.')
      }

      console.log('✅ Article modifié avec succès:', updatedArticle)

      // Rediriger vers la page d'accueil avec rafraîchissement complet
      // Ne pas mettre setUploading(false) ici car on redirige immédiatement
      setTimeout(() => {
        window.location.href = '/'
      }, 100)
      return
    } catch (err) {
      console.error('Erreur modification article:', err)
      setError(err.message || 'Une erreur est survenue lors de la modification de l\'article.')
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 max-w-4xl py-6 md:py-8">
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-8">
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <Pencil className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Modifier l'article
            </h1>
          </div>
          <p className="text-gray-600 mb-6 md:mb-8">
            Modifiez les détails de votre article.
          </p>

          {error && (
            <div className="mb-4 md:mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Titre */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Titre
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Le titre de votre article"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                required
              />
            </div>

            {/* Extrait */}
            <div>
              <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                Extrait
              </label>
              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Un court résumé de votre article (max 200 caractères)"
                rows={3}
                maxLength={200}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-y"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                {excerpt.length}/200 caractères
              </p>
            </div>

            {/* Catégorie & Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Catégorie & Tags (3 max)
              </label>
              
              {/* Zone de saisie, bouton Ajouter et zone d'affichage des tags sur une seule ligne */}
              <div className="flex flex-col md:flex-row gap-2 items-start">
                {/* Champ de saisie avec autocomplétion */}
                <div className="relative w-full md:w-48">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={handleTagInputChange}
                    onKeyPress={handleTagInputKeyPress}
                    onFocus={() => {
                      if (tagInput.trim() && suggestions.length > 0) {
                        setShowSuggestions(true)
                      }
                    }}
                    onBlur={() => {
                      // Délai pour permettre le clic sur une suggestion
                      setTimeout(() => setShowSuggestions(false), 200)
                    }}
                    placeholder="Ajouter un tag..."
                    className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                    disabled={tags.length >= 3}
                  />
                  {/* Liste d'autocomplétion */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {suggestions.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => selectSuggestion(category.name)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Bouton Ajouter */}
                <div className="flex flex-col w-full md:w-24">
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={tags.length >= 3 || !tagInput.trim()}
                    className="px-2 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap h-[42px] text-sm w-full md:w-auto"
                  >
                    Ajouter
                  </button>
                </div>
                
                {/* Zone d'affichage des tags sélectionnés */}
                <div className="w-full md:flex-[3] flex flex-col">
                  <div className="h-[42px] overflow-hidden border border-gray-300 rounded-lg p-2 bg-gray-50">
                    {tags.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-1">
                        Aucun tag ajouté
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              aria-label={`Supprimer le tag ${tag}`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                    La première sélection est la catégorie principale.
                  </p>
                </div>
              </div>
            </div>

            {/* Image de couverture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image de couverture
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Recommandé : 1280×720. Max 5MB (JPG, PNG, WEBP). L'image sera intégrée au contenu.
              </p>
              
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : currentImageUrl ? (
                <div className="relative">
                  <img
                    src={currentImageUrl.startsWith('data:image') 
                      ? currentImageUrl 
                      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${currentImageUrl}`}
                    alt="Current"
                    className="w-full h-64 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setCurrentImageUrl(null)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Cliquez pour uploader</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG ou WEBP (MAX. 5MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>

            {/* Contenu */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Contenu de l'article
              </label>
              <p className="text-sm text-gray-500 mb-3">
                La syntaxe Markdown est supportée.
              </p>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="## Introduction...&#10;&#10;Votre contenu ici..."
                rows={15}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-y font-mono text-sm"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                {content.split(/\s+/).filter(Boolean).length}/1000 mots
              </p>
            </div>

            {/* Boutons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 md:gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => window.location.href = '/dashboard'}
                className="px-4 md:px-6 py-2 md:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm md:text-base"
                disabled={uploading}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-4 md:px-6 py-2 md:py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                {uploading ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
