'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  // Cliente do navegador para interações
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    // Redireciona para o login após o logout
    router.push('/admin/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
    >
      Sair
    </button>
  )
}