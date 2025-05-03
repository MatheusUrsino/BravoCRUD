import Link from "next/link";
import { FiBarChart2 } from "react-icons/fi";

export const DashboardHeader = () => (
  <header className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 shadow-xl ">
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
      <div className="flex items-center gap-4 mb-4 sm:mb-0">
        <div className="bg-white rounded-full p-3 shadow-md">
          <FiBarChart2 size={32} className="text-indigo-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">Dashboard de Filiais</h1>
          <p className="text-white/80 text-sm mt-1">Visão geral e indicadores das filiais</p>
        </div>
      </div>
      <div>
        <Link
          href="/registros"
          className="flex items-center gap-2 bg-white text-blue-700 px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-50 transition-colors"
        >
          Ver Registros
        </Link>
      </div>
    </div>
  </header>
);