"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FICHA_TABS } from "@/lib/ficha"

export function FichaTabs({ patientId }: { patientId: string }) {
  const pathname = usePathname()

  return (
    <nav className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-x-auto print:hidden">
      <div className="flex min-w-max">
        {FICHA_TABS.map((tab) => {
          const href = `/pacientes/${patientId}/${tab.slug}`
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={tab.slug}
              href={href}
              className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? "border-blue-600 text-blue-700 bg-blue-50/60"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
