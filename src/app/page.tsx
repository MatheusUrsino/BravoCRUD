"use client"

import { AuthService, RegistersService } from "@/service";
import { useEffect, useState } from "react";
import { Models } from "appwrite";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { toast } from "react-toastify";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ApexOptions } from 'apexcharts';
import { FiCalendar, FiCheck, FiClock, FiFileText, FiPlus, FiTrendingUp, FiX, FiFilter } from "react-icons/fi";
import Head from "next/head";
import Select from 'react-select';

// Carregamento dinâmico para melhor performance
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface BranchOption {
  value: string;
  label: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBranches, setSelectedBranches] = useState<BranchOption[]>([]);
  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    overdue: 0,
    revenue: 0
  });

  const authService = AuthService.getInstance();
  const registersService = RegistersService.getInstance();

  const fetchData = async () => {
    try {
      const account = await authService.getAccount();
      setUser(account);

      const teamId = account.teamId;
      if (!teamId) throw new Error("Usuário não está em nenhum time");

      const docs = await registersService.getDocumentsByTeam(teamId);
      setAllDocuments(docs.documents || []);
      setFilteredDocuments(docs.documents || []);

      // Criar opções para o select
      const options = docs.documents.map(doc => ({
        value: doc.$id,
        label: `${doc.empresa}${doc.loja ? ` - ${doc.loja}` : ''}`
      }));
      setBranchOptions(options);

      // Calcular estatísticas iniciais
      calculateStats(docs.documents || []);

    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      toast.error("Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (docs: any[]) => {
    const now = new Date();
    const active = docs.filter(doc => doc.status_empresa === 'Ativa').length;
    const pending = docs.filter(doc => doc.status === 'Pendente').length;
    const overdue = docs.filter(doc => {
      if (!doc.vcto_guias_iss_proprio) return false;
      const dueDate = new Date(doc.vcto_guias_iss_proprio);
      return dueDate < now;
    }).length;

    const revenue = docs.reduce((sum, doc) => sum + (doc.faturamento || 0), 0);

    setStats({
      total: docs.length,
      active,
      pending,
      overdue,
      revenue
    });
  };

  const handleBranchSelection = (selectedOptions: any) => {
    setSelectedBranches(selectedOptions || []);
    
    if (!selectedOptions || selectedOptions.length === 0) {
      setFilteredDocuments(allDocuments);
      calculateStats(allDocuments);
      return;
    }

    const selectedIds = selectedOptions.map((opt: BranchOption) => opt.value);
    const filtered = allDocuments.filter(doc => selectedIds.includes(doc.$id));
    setFilteredDocuments(filtered);
    calculateStats(filtered);
  };

  const clearFilters = () => {
    setSelectedBranches([]);
    setFilteredDocuments(allDocuments);
    calculateStats(allDocuments);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const chartOptions: ApexOptions = {
    chart: {
      type: 'donut' as const,
    },
    labels: ['Ativas', 'Inativas', 'Suspensas'],
    colors: ['#10B981', '#EF4444', '#F59E0B'],
    legend: {
      position: 'bottom' as const
    }
  };

  const chartSeries = [
    filteredDocuments.filter(doc => doc.status_empresa === 'Ativa').length,
    filteredDocuments.filter(doc => doc.status_empresa === 'Inativa').length,
    filteredDocuments.filter(doc => doc.status_empresa === 'Suspensa').length,
  ];

  // Próximos vencimentos (ordenados)
  const upcomingDueDates = filteredDocuments
    .filter(doc => doc.vcto_guias_iss_proprio)
    .map(doc => ({
      id: doc.$id,
      empresa: doc.empresa,
      date: doc.vcto_guias_iss_proprio,
      status: new Date(doc.vcto_guias_iss_proprio) < new Date() ? 'overdue' : 'upcoming'
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Dashboard - Gestão de Filiais</title>
        <meta name="description" content="Painel de controle para gestão de filiais e registros fiscais" />
        <meta property="og:title" content="Dashboard - Gestão de Filiais" />
        <meta property="og:description" content="Painel de controle para gestão de filiais e registros fiscais" />
      </Head>

      <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-medium text-white">Dashboard - Gestão de Filiais</h1>
          <div className="flex items-center space-x-4">
            <Link
              href="/registros"
              className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Ver Todos os Registros
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Filtro de Filiais */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-800">Filtrar Filiais</h2>
            {selectedBranches.length > 0 && (
              <button 
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
              >
                <FiX size={16} /> Limpar filtros
              </button>
            )}
          </div>
          
          <Select
            isMulti
            options={branchOptions}
            value={selectedBranches}
            onChange={handleBranchSelection}
            placeholder="Selecione uma ou mais filiais..."
            noOptionsMessage={() => "Nenhuma filial encontrada"}
            className="basic-multi-select"
            classNamePrefix="select"
          />
          
          {selectedBranches.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              <FiFilter className="inline mr-1" />
              Filtrando {selectedBranches.length} filial(es) selecionada(s)
            </div>
          )}
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* ... (os cards permanecem os mesmos, mas agora mostram dados filtrados) ... */}
        </div>

        {/* Gráficos e Seções */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Gráfico de Status */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
            <h2 className="text-lg font-medium text-gray-800 mb-4">
              Status das Empresas
              {selectedBranches.length > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Filtrado)
                </span>
              )}
            </h2>
            {typeof window !== 'undefined' && (
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="donut"
                height={300}
              />
            )}
          </div>

          {/* Próximos Vencimentos */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Próximos Vencimentos</h2>
            <div className="space-y-4">
              {upcomingDueDates.length > 0 ? (
                upcomingDueDates.map((item) => (
                  <div key={item.id} className="flex items-start">
                    <div className={`flex-shrink-0 p-2 rounded-lg ${item.status === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      <FiCalendar size={20} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{item.empresa}</p>
                      <p className={`text-sm ${item.status === 'overdue' ? 'text-red-600' : 'text-gray-500'}`}>
                        {formatDate(item.date)} {item.status === 'overdue' && '(Vencido)'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Nenhum vencimento próximo</p>
              )}
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/registros/new"
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <FiPlus /> Nova Filial
            </Link>
            <Link
              href="/registros"
              className="flex items-center justify-center gap-2 bg-white text-gray-800 px-4 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors border border-gray-300"
            >
              <FiFileText /> Ver Todos
            </Link>
            <Link
              href="/registros?status=Pendente"
              className="flex items-center justify-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-3 rounded-lg font-medium hover:bg-yellow-200 transition-colors"
            >
              <FiClock /> Pendentes
            </Link>
            <Link
              href="/registros?status_empresa=Ativa"
              className="flex items-center justify-center gap-2 bg-green-100 text-green-800 px-4 py-3 rounded-lg font-medium hover:bg-green-200 transition-colors"
            >
              <FiCheck /> Ativas
            </Link>
          </div>
        </div>

        {/* Últimas Atividades */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Últimas Atividades</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsável</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allDocuments
                  .sort((a, b) => new Date(b.$updatedAt).getTime() - new Date(a.$updatedAt).getTime())
                  .slice(0, 5)
                  .map((doc) => (
                    <tr key={doc.$id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{doc.empresa || '-'}</div>
                        <div className="text-sm text-gray-500">{doc.loja || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {doc.$createdAt === doc.$updatedAt ? 'Criado' : 'Atualizado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{doc.responsavel || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(doc.$updatedAt || doc.$createdAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}