export function getImageUrl(imagePath) {
    if (!imagePath) {
      return null
    }
    
    // Si c'est une image base64, la retourner directement
    if (imagePath.startsWith('data:image')) {
      return imagePath
    }
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!supabaseUrl) {
      return null
    }
    
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
    const fullUrl = `${supabaseUrl}/storage/v1/object/public/post-images/${cleanPath}`
    
    return fullUrl
  }
  
  export function cn(...classes) {
    return classes.filter(Boolean).join(' ')
  }

  // Fonction pour générer un slug à partir d'un titre
  export function generateSlug(title) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
      .replace(/^-+|-+$/g, '') // Supprimer les tirets en début et fin
      .substring(0, 100) // Limiter la longueur
  }

  // Fonction pour uploader une image vers Supabase Storage
  export async function uploadImageToSupabase(file, supabase) {
    try {
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Le fichier est trop volumineux. Maximum 5MB.')
      }

      // Vérifier le type de fichier
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        throw new Error('Type de fichier non supporté. Utilisez JPG, PNG ou WEBP.')
      }

      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `post-images/${fileName}`

      // Uploader le fichier
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      return filePath
    } catch (error) {
      console.error('Erreur upload image:', error)
      throw error
    }
  }
