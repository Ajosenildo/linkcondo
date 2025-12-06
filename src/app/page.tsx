// ARQUIVO: src/app/page.tsx
import Link from 'next/link'
import { ArrowRight, Building2, ShieldCheck, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      
      {/* 1. Cabeçalho / Navbar Simples */}
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          {/* Logo */}
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">LinkCondo</span>
        </div>
        
        <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
          <Link href="#funcionalidades" className="hover:text-blue-600 transition">Funcionalidades</Link>
          <Link href="#planos" className="hover:text-blue-600 transition">Planos</Link>
          <Link href="#sobre" className="hover:text-blue-600 transition">Sobre</Link>
        </nav>

        <Link 
          href="/acesso" 
          className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition shadow-md hover:shadow-lg"
        >
          Área do Cliente
        </Link>
      </header>

      {/* 2. Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 md:py-32">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wide mb-8 border border-blue-100 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Sistema Online v2.0
        </div>

        <h1 className="max-w-4xl text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-tight">
          Gestão de Condomínios <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
            Simples e Inteligente
          </span>
        </h1>

        <p className="max-w-2xl text-lg md:text-xl text-slate-600 mb-12 leading-relaxed">
          O LinkCondo centraliza reservas, portaria, financeiro e comunicação em uma única plataforma. 
          Ideal para síndicos profissionais e administradoras.
        </p>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link 
            href="/acesso" 
            className="group flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-lg hover:shadow-blue-500/25 transform hover:-translate-y-1"
          >
            <Building2 className="w-5 h-5 group-hover:scale-110 transition" />
            Acessar Meu Condomínio
          </Link>
          
          <button className="flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition shadow-sm hover:shadow-md">
            Falar com Consultor
          </button>
        </div>

        {/* 3. Grid de Funcionalidades */}
        <div id="funcionalidades" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-6xl w-full text-left px-4">
          <FeatureCard 
            title="Gestão Financeira" 
            desc="Boletos, balancetes e prestação de contas em tempo real com transparência total."
            icon={<Building2 size={24} />}
          />
          <FeatureCard 
            title="Controle de Portaria" 
            desc="Segurança total com registro digital de visitantes, prestadores e encomendas."
            icon={<ShieldCheck size={24} />}
          />
          <FeatureCard 
            title="App para Moradores" 
            desc="Reservas de áreas comuns, avisos e ocorrências direto no celular do morador."
            icon={<Users size={24} />}
          />
        </div>
      </main>

      {/* 4. Rodapé */}
      <footer className="py-8 text-center text-sm text-slate-500 border-t border-slate-200 bg-white">
        <p>&copy; {new Date().getFullYear()} LinkCondo Tecnologia. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}

// Componente auxiliar para os cards
function FeatureCard({ title, desc, icon }: { title: string, desc: string, icon: React.ReactNode }) {
  return (
    <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition hover:border-blue-100 group">
      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 text-base leading-relaxed">{desc}</p>
    </div>
  )
}