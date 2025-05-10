import { LucideBuilding  } from "lucide-react";
import Link from "next/link";
import { FiDownload, FiPlus, FiUpload } from "react-icons/fi";

interface RegistrosHeaderProps {
  onExport: () => void;
  hasData: boolean;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const RegistrosHeader = ({ onExport, hasData, onImport }: RegistrosHeaderProps) => (
  <header className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 shadow-xl ">
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
      <div className="flex items-center gap-4 mb-4 sm:mb-0">
        <div className="bg-white rounded-full p-3 shadow-md">
          <LucideBuilding size={32} className="text-indigo-500" />

        </div>
        <div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">Gestão de Filiais</h1>
          <p className="text-white/80 text-sm mt-1">Gerencie e exporte seus registros facilmente</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
  <label className="flex items-center gap-2 px-5 py-2 rounded-lg font-semibold shadow bg-white text-indigo-700 hover:bg-indigo-50 cursor-pointer">
    <FiUpload size={20} />
    <input
      type="file"
      accept=".xlsx,.xls"
      className="hidden"
      onChange={onImport}
    />
    Importar Excel
  </label>
  <button
    onClick={onExport}
    className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold shadow transition-colors
      ${hasData
        ? "bg-white text-indigo-700 hover:bg-indigo-50"
        : "bg-white/50 text-gray-400 cursor-not-allowed"
      }`}
    disabled={!hasData}
  >
    <FiDownload size={20} /> Exportar Excel
  </button>
  <Link
          href="/registros/new"
          className="flex items-center gap-2 bg-white text-purple-700 px-5 py-2 rounded-lg font-semibold shadow hover:bg-purple-50 transition-colors"
        >
          <FiPlus /> Nova Filial
        </Link>
</div>
    </div>
  </header>
);