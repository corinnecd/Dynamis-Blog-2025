export function getImageUrl(imagePath) {
    console.log('🔍 getImageUrl appelée avec:', imagePath)
    
    if (!imagePath) {
      console.log('⚠️ Pas d\'image_url')
      return null
    }
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      console.log('✅ URL complète détectée:', imagePath)
      return imagePath
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!supabaseUrl) {
      console.error('❌ NEXT_PUBLIC_SUPABASE_URL non définie')
      return null
    }
    
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
    const fullUrl = `${supabaseUrl}/storage/v1/object/public/post-images/${cleanPath}`
    
    console.log('🔨 URL construite:', fullUrl)
    return fullUrl
  }
  
  export function cn(...classes) {
    return classes.filter(Boolean).join(' ')
  }