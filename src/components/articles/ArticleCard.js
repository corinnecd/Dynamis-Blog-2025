import Link from 'next/link'
import { Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import { getImageUrl } from '../../lib/utils'

export default function ArticleCard({ article }) {
  const imageUrl = getImageUrl(article.image_url)
  
  // 🔍 DEBUG : Afficher les URLs dans la console
  console.log('Article:', article.title)
  console.log('image_url brut:', article.image_url)
  console.log('imageUrl final:', imageUrl)
  
  return (
    <Link href={`/article/${article.slug}`} className="block group">
      <div className="bg-white rounded-lg shadow hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col">
        {/* Image */}
        {article.image_url && imageUrl ? (
          <div className="relative h-56 bg-gray-200 overflow-hidden">
            <img 
              src={imageUrl} 
              alt={article.title || 'Article'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                console.error('❌ Erreur chargement image:', imageUrl)
                e.target.style.display = 'none'
              }}
              onLoad={() => {
                console.log('✅ Image chargée:', imageUrl)
              }}
            />
          </div>
        ) : (
          <div className="relative h-56 bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center">
            <span className="text-white text-4xl">📰</span>
          </div>
        )}
        
        {/* Contenu */}
        <div className="p-6 flex-grow flex flex-col">
          {/* Meta : Auteur et Date */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{article.author?.user_name || article.author?.prenom || 'Anonyme'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(article.created_at), 'd MMMM yyyy')}
              </span>
            </div>
          </div>
          
          {/* Titre */}
          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>
          
          {/* Extrait */}
          <p className="text-gray-600 mb-4 line-clamp-3 flex-grow">
            {article.excerpt}
          </p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {article.category && (
              <span className="inline-flex items-center text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-primary">
                #{article.category.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}