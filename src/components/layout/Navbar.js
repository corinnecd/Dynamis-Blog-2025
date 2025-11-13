'use client'

import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          DYNAMIS BLOG
        </Link>
        <div className="flex gap-6">
          <Link href="/" className="hover:text-blue-600">
            Accueil
          </Link>
          <Link href="/categories" className="hover:text-blue-600">
            Catégories
          </Link>
        </div>
      </div>
    </nav>
  )
}