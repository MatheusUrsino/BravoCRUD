import Link from "next/link";
import { FiDownload, FiPlus } from "react-icons/fi";

interface RegistrosHeaderProps {
  onExport: () => void;
  hasData: boolean;
}

export const RegistrosHeader = ({ onExport, hasData }: RegistrosHeaderProps) => (
  <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-white">Gestão de Filiais</h1>
      <div className="flex items-center space-x-4">
        <button
          onClick={onExport}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
          disabled={!hasData}
        >
          <FiDownload size={18} /> Exportar Excel
        </button>
        <Link
          href="/registros/new"
          className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
        >
          <FiPlus /> Nova Filial
        </Link>
      </div>
    </div>
  </header>
);