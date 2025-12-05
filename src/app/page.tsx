// ARQUIVO: src/app/page.tsx
import Link from 'next/link'
import { ArrowRight, Building2, ShieldCheck, Users } from 'lucide-react' // Ícones modernos (opcional, se não tiver, remova os ícones)

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      
      {/* 1. Cabeçalho / Navbar Simples */}
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
        <div className="flex items-center gap-2">
          {/* Simulação de Logo */}
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <span className="text-xl font-bold text-gray-800">LinkCondo</span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
          <Link href="#" className="hover:text-blue-600 transition">Funcionalidades</Link>
          <Link href="#" className="hover:text-blue-600 transition">Planos</Link>
          <Link href="#" className="hover:text-blue-600 transition">Sobre</Link>
        </nav>
        <Link 
          href="/login" 
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition shadow-md"
        >
          Área do Cliente
        </Link>
      </header>

      {/* 2. Hero Section (Área Principal) */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold uppercase tracking-wide mb-6 border border-blue-100">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          Sistema Online v2.0
        </div>

        <h1 className="max-w-4xl text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
          Gestão de Condomínios <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
            Simples e Inteligente
          </span>
        </h1>

        <p className="max-w-2xl text-lg text-gray-600 mb-10 leading-relaxed">
          O LinkCondo centraliza reservas, portaria, financeiro e comunicação em uma única plataforma. 
          Ideal para síndicos profissionais e administradoras.
        </p>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link 
            href="http://rezende.localhost:3000" 
            target="_blank"
            className="flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Building2 className="w-5 h-5" />
            Testar Condomínio Rezende
          </Link>
          
          <button className="flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm hover:shadow-md">
            Falar com Consultor
          </button>
        </div>

        {/* 3. Grid de Funcionalidades Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl w-full text-left">
          <FeatureCard 
            title="Gestão Financeira" 
            desc="Boletos, balancetes e prestação de contas em tempo real."
          />
          <FeatureCard 
            title="Controle de Portaria" 
            desc="Segurança total com registro de visitantes e encomendas."
          />
          <FeatureCard 
            title="App para Moradores" 
            desc="Reservas de áreas comuns e avisos direto no celular."
          />
        </div>
      </main>

      {/* 4. Rodapé Simples */}
      <footer className="py-8 text-center text-sm text-gray-500 border-t border-gray-200 bg-white">
        <p>&copy; {new Date().getFullYear()} LinkCondo Tecnologia. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}

// Componente auxiliar simples para os cards (pode ficar no mesmo arquivo)
function FeatureCard({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4 text-blue-600">
        <ShieldCheck size={20} />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}