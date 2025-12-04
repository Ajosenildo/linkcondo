// ARQUIVO: src/app/page.tsx
import { Suspense } from 'react'
import HomePageContent from '@/components/HomePageContent'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <Suspense fallback={<div className="p-4 text-blue-600 animate-pulse">Carregando sistema...</div>}>
        <HomePageContent />
      </Suspense>
    </main>
  )
}