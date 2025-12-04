// ARQUIVO: src/components/HomePageContent.tsx
'use client' // <--- OBRIGATÓRIO: Permite usar useState, useEffect, etc.

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Image from 'next/image' // Se você usa imagens, mantenha aqui

export default function HomePageContent() {
  // Agora sim, os hooks funcionam aqui porque é um componente cliente
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.log("Componente montado na rota:", pathname)
  }, [pathname])

  if (!mounted) return null

  return (
    <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-lg border border-gray-100">
      <h1 className="text-3xl font-bold text-blue-600 mb-2">LinkCondo</h1>
      <p className="text-gray-600 mb-4">Sistema carregado com sucesso.</p>
      
      <div className="text-sm bg-green-50 text-green-700 p-3 rounded w-full text-center">
        Status: Online
      </div>
    </div>
  )
}