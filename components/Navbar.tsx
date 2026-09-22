'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  const links = [
    { name: "Inicio", href: "/" },
    { name: "Agenda", href: "/agenda" },
    { name: "Pacientes", href: "/pacientes" },
    { name: "Odontograma", href: "/odontograma" },
    { name: "Profesionales", href: "/profesionales" },
    { name: "Aranceles", href: "/aranceles" },
    { name: "Liquidaciones", href: "/liquidaciones" },
  ]

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo o Nombre */}
          <div className="flex items-center flex-shrink-0 mr-6">
            <Link href="/" className="text-xl font-bold text-blue-600 tracking-tight">
              Clínica Dignidad
            </Link>
          </div>

          {/* Enlaces de navegación (Scrollable en móviles para que no se rompa) */}
          <div className="flex flex-1 items-center overflow-x-auto no-scrollbar space-x-1 sm:space-x-4">
            {links.map((link) => {
              // Lógica para detectar si la página actual es la activa
              const isActive = 
                link.href === '/' 
                  ? pathname === '/' 
                  : pathname.startsWith(link.href)

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}