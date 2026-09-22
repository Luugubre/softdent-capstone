"use client"

import { useState } from "react"
import { Tooth } from "@/components/Tooth"
import { SurfaceStatus, ToothSurfaces, ToothCondition } from "@/types/clinical"
import { updateOdontogram } from "@/lib/actions"
import { useRouter } from "next/navigation"

const c1 = [18, 17, 16, 15, 14, 13, 12, 11]; 
const c2 = [21, 22, 23, 24, 25, 26, 27, 28]; 
const c3 = [48, 47, 46, 45, 44, 43, 42, 41]; 
const c4 = [31, 32, 33, 34, 35, 36, 37, 38]; 
const t1 = [55, 54, 53, 52, 51]; 
const t2 = [61, 62, 63, 64, 65]; 
const t3 = [85, 84, 83, 82, 81]; 
const t4 = [71, 72, 73, 74, 75]; 

function generateInitialState() {
  const allTeeth = [...c1, ...c2, ...c3, ...c4, ...t1, ...t2, ...t3, ...t4];
  const state: Record<number, { condition: ToothCondition, surfaces: ToothSurfaces }> = {};
  allTeeth.forEach(id => {
    state[id] = { condition: "SANO", surfaces: { vestibular: "SANO", palatine: "SANO", mesial: "SANO", distal: "SANO", oclusal: "SANO" } };
  });
  return state;
}

interface Props {
  patientId: string;
  initialData?: any;
}

export function OdontogramaClinico({ patientId, initialData }: Props) {
  const router = useRouter();
  const [isChildView, setIsChildView] = useState(false);
  const [currentTool, setCurrentTool] = useState<SurfaceStatus>("CARIES");
  const [isSaving, setIsSaving] = useState(false);
  
  // Si el paciente ya tiene datos guardados, los usamos. Si no, generamos un estado limpio.
  const [odontogramaState, setOdontogramaState] = useState(
    initialData && Object.keys(initialData).length > 0 ? initialData : generateInitialState()
  );

  const handleSurfaceClick = (toothId: number, surface: keyof ToothSurfaces) => {
    setOdontogramaState((prev: any) => ({
      ...prev, [toothId]: { ...prev[toothId], surfaces: { ...prev[toothId].surfaces, [surface]: currentTool } }
    }));
  }

  const handleRootClick = (toothId: number) => {
    setOdontogramaState((prev: any) => ({
      ...prev, [toothId]: { ...prev[toothId], condition: prev[toothId].condition === "SANO" ? "AUSENTE" : "SANO" }
    }));
  }

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateOdontogram(patientId, odontogramaState);
    if (result.success) {
      alert("Odontograma guardado correctamente");
      router.refresh();
    } else {
      alert(result.error);
    }
    setIsSaving(false);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 mt-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 w-full lg:w-56 h-fit shrink-0">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Herramientas</h2>
        <div className="flex flex-col gap-2">
          <button onClick={() => setCurrentTool("CARIES")} className={`p-2 text-sm rounded border text-left ${currentTool === "CARIES" ? "bg-slate-100 border-slate-500 text-slate-900 font-bold" : "hover:bg-gray-50"}`}>⚫ Lesión / Caries</button>
          <button onClick={() => setCurrentTool("RESTAURACION")} className={`p-2 text-sm rounded border text-left ${currentTool === "RESTAURACION" ? "bg-blue-50 border-blue-500 text-blue-700 font-bold" : "hover:bg-gray-50"}`}>🔵 Restauración</button>
          <button onClick={() => setCurrentTool("SELLANTE")} className={`p-2 text-sm rounded border text-left ${currentTool === "SELLANTE" ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold" : "hover:bg-gray-50"}`}>🟢 Preventivo</button>
          <button onClick={() => setCurrentTool("FRACTURA")} className={`p-2 text-sm rounded border text-left ${currentTool === "FRACTURA" ? "bg-red-50 border-red-500 text-red-700 font-bold" : "hover:bg-gray-50"}`}>🔴 Fractura</button>
          <button onClick={() => setCurrentTool("SANO")} className={`p-2 text-sm rounded border text-left ${currentTool === "SANO" ? "bg-gray-200 border-gray-500 text-gray-700 font-bold" : "hover:bg-gray-50"}`}>⚪ Sano (Borrar)</button>
        </div>
        
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="mt-8 w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        >
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex-1 overflow-x-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-700">Estado Dental</h3>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setIsChildView(false)} className={`px-3 py-1 text-xs font-bold rounded-md ${!isChildView ? 'bg-white shadow' : 'text-gray-500'}`}>Adulto</button>
            <button onClick={() => setIsChildView(true)} className={`px-3 py-1 text-xs font-bold rounded-md ${isChildView ? 'bg-white shadow' : 'text-gray-500'}`}>Niño</button>
          </div>
        </div>

        <div className="min-w-max flex flex-col items-center gap-10">
          <div className="flex gap-2">
            <div className="flex gap-0.5 border-r-2 border-gray-100 pr-2">
              {(!isChildView ? c1 : t1).map(id => (
                <Tooth key={id} number={id} condition={odontogramaState[id].condition} surfaces={odontogramaState[id].surfaces} onSurfaceClick={(s) => handleSurfaceClick(id, s)} onRootClick={() => handleRootClick(id)}/>
              ))}
            </div>
            <div className="flex gap-0.5">
              {(!isChildView ? c2 : t2).map(id => (
                <Tooth key={id} number={id} condition={odontogramaState[id].condition} surfaces={odontogramaState[id].surfaces} onSurfaceClick={(s) => handleSurfaceClick(id, s)} onRootClick={() => handleRootClick(id)}/>
              ))}
            </div>
          </div>

          <div className="w-full h-px bg-gray-100"></div>

          <div className="flex gap-2">
            <div className="flex gap-0.5 border-r-2 border-gray-100 pr-2">
              {(!isChildView ? c3 : t3).map(id => (
                <Tooth key={id} number={id} condition={odontogramaState[id].condition} surfaces={odontogramaState[id].surfaces} invert={true} onSurfaceClick={(s) => handleSurfaceClick(id, s)} onRootClick={() => handleRootClick(id)}/>
              ))}
            </div>
            <div className="flex gap-0.5">
              {(!isChildView ? c4 : t4).map(id => (
                <Tooth key={id} number={id} condition={odontogramaState[id].condition} surfaces={odontogramaState[id].surfaces} invert={true} onSurfaceClick={(s) => handleSurfaceClick(id, s)} onRootClick={() => handleRootClick(id)}/>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}