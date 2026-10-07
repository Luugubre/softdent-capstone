"use client"

import { SurfaceStatus, ToothSurfaces, ToothCondition } from "@/types/clinical"

interface AdvancedToothProps {
  number: number;
  surfaces: ToothSurfaces;
  condition: ToothCondition;
  invert?: boolean; // Nuevo prop para invertir solo el dibujo
  onSurfaceClick?: (surface: keyof ToothSurfaces) => void;
  onRootClick?: () => void;
  onNumberClick?: () => void;
  // Opcionales para odontogramas de tratamientos: color por cara, pieza seleccionada y marca de pieza completa
  fillFor?: (surface: keyof ToothSurfaces) => string | undefined;
  selected?: boolean;
  markerColor?: string;
}

export function Tooth({ number, surfaces, condition, invert = false, onSurfaceClick, onRootClick, onNumberClick, fillFor, selected = false, markerColor }: AdvancedToothProps) {
  const screenLeft = (number >= 11 && number <= 18) || (number >= 41 && number <= 48) || (number >= 51 && number <= 55) || (number >= 81 && number <= 85);
  const faceLeft = screenLeft ? 'distal' : 'mesial';
  const faceRight = screenLeft ? 'mesial' : 'distal';

  const getFill = (status: SurfaceStatus, surface?: keyof ToothSurfaces) => {
    const override = surface && fillFor ? fillFor(surface) : undefined;
    if (override) return override;
    switch (status) {
      case "CARIES": return "#0f172a"; 
      case "RESTAURACION": return "#3b82f6"; 
      case "SELLANTE": return "#10b981"; 
      case "FRACTURA": return "#ef4444"; 
      default: return "white";
    }
  }

  const paths = { 
    vestibular: "M 16 16 A 48 48 0 0 1 84 16 L 64 36 A 20 20 0 0 0 36 36 Z", 
    palatine: "M 84 84 A 48 48 0 0 1 16 84 L 36 64 A 20 20 0 0 0 64 64 Z", 
    left: "M 16 84 A 48 48 0 0 1 16 16 L 36 36 A 20 20 0 0 0 36 64 Z", 
    right: "M 84 16 A 48 48 0 0 1 84 84 L 64 64 A 20 20 0 0 0 64 36 Z" 
  };

  const getRootPath = (n: number) => {
    const x = n % 10;
    if (x < 3) return "M 35 15 Q 50 5 65 15 L 75 60 Q 80 90 75 105 L 25 105 Q 20 90 25 60 Z"; 
    if (x === 3) return "M 35 15 Q 50 5 65 15 L 75 50 Q 80 75 50 95 Q 20 75 25 50 Z"; 
    return "M 20 15 Q 30 0 45 15 L 50 45 L 55 15 Q 70 0 80 15 L 85 60 Q 95 90 80 110 Q 50 115 20 110 Q 5 90 15 60 Z"; 
  }

  const isAusente = condition === "AUSENTE" || condition === "EXTRACCION_INDICADA";

  return (
    // NOTA: Si está invertido (inferior), usamos flex-col-reverse para que el número quede abajo de la raíz.
    <div className={`flex items-center gap-1 group relative w-10 transition-all duration-300 ${invert ? 'flex-col-reverse' : 'flex-col'} ${isAusente ? 'opacity-40' : 'hover:scale-105'} ${selected ? 'ring-2 ring-blue-500 rounded-lg bg-blue-50' : ''}`}>
      
      {/* El SVG de la raíz recibe la clase rotate-180 si invert es true */}
      <div className={`relative w-9 h-11 cursor-pointer drop-shadow-sm ${invert ? 'rotate-180' : ''}`} onClick={onRootClick}>
        <svg viewBox="-10 -10 120 140" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={`grad-${number}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isAusente ? "#f8fafc" : "#ffffff"} />
              <stop offset="100%" stopColor={isAusente ? "#f1f5f9" : "#f1f5f9"} />
            </linearGradient>
          </defs>
          
          <path 
            d={getRootPath(number)} 
            fill={`url(#grad-${number})`} 
            stroke={isAusente ? "#e2e8f0" : "#cbd5e1"} 
            strokeWidth="4" 
            strokeLinejoin="round" 
          />
          
          {isAusente && (
            <g stroke="#0f172a" strokeWidth="12" strokeLinecap="round" opacity="0.8">
              <line x1="10" y1="20" x2="90" y2="100" />
              <line x1="90" y1="20" x2="10" y2="100" />
            </g>
          )}
        </svg>
      </div>
      
      {/* El número ya no se rota, siempre se queda derecho */}
      <span onClick={onNumberClick} className={`text-[10px] font-black italic group-hover:text-blue-500 cursor-pointer transition-colors flex items-center gap-0.5 ${selected ? 'text-blue-600' : 'text-gray-400'}`}>
        {number}
        {markerColor && <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: markerColor }} />}
      </span>
      
      {/* El SVG de las caras recibe la clase rotate-180 si invert es true */}
      <div className={isAusente ? 'pointer-events-none' : ''}>
        <svg viewBox="0 0 100 100" className={`w-7 h-7 drop-shadow-sm ${invert ? 'rotate-180' : ''}`}>
          <path d={paths.vestibular} fill={getFill(surfaces.vestibular, 'vestibular')} stroke="#cbd5e1" strokeWidth="3" className="hover:opacity-70 cursor-pointer transition-colors" onClick={() => onSurfaceClick?.('vestibular')} />
          <path d={paths.palatine} fill={getFill(surfaces.palatine, 'palatine')} stroke="#cbd5e1" strokeWidth="3" className="hover:opacity-70 cursor-pointer transition-colors" onClick={() => onSurfaceClick?.('palatine')} />
          <path d={paths.left} fill={getFill(surfaces[faceLeft as keyof ToothSurfaces], faceLeft as keyof ToothSurfaces)} stroke="#cbd5e1" strokeWidth="3" className="hover:opacity-70 cursor-pointer transition-colors" onClick={() => onSurfaceClick?.(faceLeft as keyof ToothSurfaces)} />
          <path d={paths.right} fill={getFill(surfaces[faceRight as keyof ToothSurfaces], faceRight as keyof ToothSurfaces)} stroke="#cbd5e1" strokeWidth="3" className="hover:opacity-70 cursor-pointer transition-colors" onClick={() => onSurfaceClick?.(faceRight as keyof ToothSurfaces)} />
          <circle cx="50" cy="50" r="20" fill={getFill(surfaces.oclusal, 'oclusal')} stroke="#cbd5e1" strokeWidth="3" className="hover:opacity-70 cursor-pointer transition-colors" onClick={() => onSurfaceClick?.('oclusal')} />
        </svg>
      </div>
    </div>
  )
}