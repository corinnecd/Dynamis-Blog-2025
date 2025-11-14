/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
  ],
  safelist: [
    // Gradients pour les catégories
    'from-yellow-400',
    'to-amber-500',
    'from-red-500',
    'to-orange-500',
    'from-purple-500',
    'to-pink-500',
    'from-blue-500',
    'to-indigo-600',
    'from-green-400',
    'to-teal-500',
    'from-cyan-400',
    'to-sky-500',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          hover: '#4338CA',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
    },
  },
  plugins: [],
}

