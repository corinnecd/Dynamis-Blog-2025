import Link from 'next/link'
import { Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import { getImageUrl } from '../../lib/utils'

export default function ArticleCard({ article }) {
  // Extraire l'image de couverture du contenu si elle existe (format markdown ![alt](data:image...))
  let coverImageUrl = null
  if (article.content) {
    const imageMatch = article.content.match(/!\[.*?\]\((data:image\/[^)]+)\)/)
    if (imageMatch) {
      coverImageUrl = imageMatch[1]
    }
  }
  
  // Si pas d'image dans le contenu, utiliser cover_image
  if (!coverImageUrl && article.cover_image) {
    coverImageUrl = getImageUrl(article.cover_image)
  }
  
  return (
    <Link href={`/article/${article.slug}`} className="block group">
      <div className="bg-white rounded-lg shadow hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col">
        {/* Image - AUGMENTÉE */}
        {coverImageUrl ? (
          <div className="relative h-64 bg-gray-200 overflow-hidden">
            <img 
              src={coverImageUrl} 
              alt={article.title || 'Article'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="relative h-64 bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center">
            <span className="text-white text-4xl">📰</span>
          </div>
        )}
        
        {/* Contenu - PADDING RÉDUIT de p-6 à p-5 */}
        <div className="p-5 flex-grow flex flex-col">
          {/* Meta : Auteur (cliquable) et Date */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
            <Link
              href={`/author/${article.author?.author_slug || article.author_id}`}
              className="flex items-center gap-1 hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <User className="w-4 h-4" />
              <span>{article.author?.user_name || article.author?.prenom || 'Anonyme'}</span>
            </Link>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(article.created_at), 'd MMMM yyyy')}
              </span>
            </div>
          </div>
          
          {/* Titre - TAILLE RÉDUITE de text-xl à text-lg */}
          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>
          
          {/* Extrait - MARGIN RÉDUITE de mb-4 à mb-3 */}
          <p className="text-gray-600 mb-3 line-clamp-3 flex-grow text-sm">
            {article.excerpt}
          </p>
          
          {/* Tags et Catégorie */}
          <div className="flex flex-wrap gap-2">
            {article.category && (
              <Link
                href={`/categories/${article.category.slug}`}
                className="inline-flex items-center text-xs font-medium px-3 py-1.5 border border-primary/30 text-primary rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                #{article.category.name}
              </Link>
            )}
            {/* Tags de l'article - filtrer les doublons (normaliser avant déduplication) */}
            {article.tags && article.tags.length > 0 && (() => {
              // Normaliser les tags (trim + casse) et supprimer les doublons
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
              
              return uniqueTags.map((tag, index) => (
                <Link
                  key={index}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 border border-primary/30 text-primary rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>#</span>
                  {tag}
                </Link>
              ))
            })()}
          </div>
        </div>
      </div>
    </Link>
  )
}