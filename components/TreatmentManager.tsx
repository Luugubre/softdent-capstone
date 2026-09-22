"use client"

import { useState } from "react"
import { createTreatment, deleteTreatment } from "@/lib/actions"
import { useRouter } from "next/navigation"

interface Treatment {
  id: string;
  name: string;
  price: number;
  category: string;
}

export function TreatmentManager({ initialTreatments }: { initialTreatments: Treatment[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Estados del formulario
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("General");
  const [newCategory, setNewCategory] = useState("");

  // Agrupamos los tratamientos existentes por categoría
  const groupedTreatments = initialTreatments.reduce((acc, curr) => {
    if (!acc[curr.category]) acc[curr.category] = [];
    acc[curr.category].push(curr);
    return acc;
  }, {} as Record<string, Treatment[]>);

  // Obtenemos una lista única de las categorías actuales
  const existingCategories = Object.keys(groupedTreatments);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const priceNum = parseInt(price);
    if (isNaN(priceNum) || priceNum < 0) {
      alert("Precio inválido");
      setLoading(false);
      return;
    }

    // Si el usuario escribió una nueva categoría, la usamos, si no, usamos la del selector
    const finalCategory = newCategory.trim() !== "" ? newCategory.trim() : category;

    const result = await createTreatment({
      name: name.trim(),
      price: priceNum,
      category: finalCategory
    });

    if (result.success) {
      setName("");
      setPrice("");
      setNewCategory("");
      router.refresh();
    } else {
      alert(result.error);
    }
    setLoading(false);
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este tratamiento del catálogo?")) return;
    
    const result = await deleteTreatment(id);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Panel Izquierdo: Formulario */}
      <div className="lg:col-span-1">
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-8">
          <h3 className="font-bold text-gray-800 text-lg mb-6">Nueva Prestación</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Tratamiento</label>
              <input 
                type="text" required
                placeholder="Ej: Resina Compuesta"
                className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-blue-500"
                value={name} onChange={e => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Precio / Arancel ($)</label>
              <input 
                type="number" required min="0"
                placeholder="Ej: 45000"
                className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-blue-500"
                value={price} onChange={e => setPrice(e.target.value)}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Carpeta / Categoría</label>
              
              {existingCategories.length > 0 && (
                <select 
                  className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-blue-500 mb-3"
                  value={category} onChange={e => setCategory(e.target.value)}
                >
                  {existingCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              )}

              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">O crear nueva carpeta:</p>
              <input 
                type="text" 
                placeholder="Ej: Endodoncia Avanzada"
                className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-blue-500 text-sm"
                value={newCategory} onChange={e => setNewCategory(e.target.value)}
              />
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:bg-gray-300 transition-colors mt-4"
            >
              {loading ? "Guardando..." : "Guardar en Catálogo"}
            </button>
          </div>
        </form>
      </div>

      {/* Panel Derecho: Lista Agrupada por Carpetas */}
      <div className="lg:col-span-2 space-y-6">
        {Object.keys(groupedTreatments).length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-gray-200 text-center text-gray-400 font-bold">
            No hay tratamientos registrados en el catálogo.
          </div>
        ) : (
          Object.keys(groupedTreatments).sort().map(catName => (
            <div key={catName} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Título de la Carpeta */}
              <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-black">
                  📁
                </div>
                <h3 className="font-black text-gray-700 uppercase tracking-wide">{catName}</h3>
                <span className="ml-auto bg-gray-200 text-gray-500 text-xs px-2 py-1 rounded-full font-bold">
                  {groupedTreatments[catName].length} ítems
                </span>
              </div>

              {/* Ítems dentro de la carpeta */}
              <ul className="divide-y divide-gray-100">
                {groupedTreatments[catName].map(t => (
                  <li key={t.id} className="p-4 hover:bg-gray-50 flex justify-between items-center transition-colors">
                    <span className="font-semibold text-gray-800">{t.name}</span>
                    <div className="flex items-center gap-6">
                      <span className="font-black text-emerald-600">${t.price.toLocaleString('es-CL')}</span>
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                        title="Eliminar del catálogo"
                      >
                        X
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

    </div>
  )
}