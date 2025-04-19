"use client"

import { AuthService, RegistersService } from "@/service";
import { useEffect, useState } from "react";
import { Models } from "appwrite";
import { FiCalendar, FiDollarSign, FiPercent, FiCheck, FiClock, FiAlertTriangle, FiFileText, FiTrendingUp, FiUsers, FiPlus } from "react-icons/fi";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { toast } from "react-toastify";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ApexOptions } from 'apexcharts';


// Carregamento dinâmico para melhor performance
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function DashboardPage() {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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
      setDocuments(docs.documents || []);

      // Calcular estatísticas
      const now = new Date();
      const active = docs.documents.filter(doc => doc.status_empresa === 'Ativa').length;
      const pending = docs.documents.filter(doc => doc.status === 'Pendente').length;
      const overdue = docs.documents.filter(doc => {
        if (!doc.vcto_guias_iss_proprio) return false;
        const dueDate = new Date(doc.vcto_guias_iss_proprio);
        return dueDate < now;
      }).length;

      const revenue = docs.documents.reduce((sum, doc) => sum + (doc.faturamento || 0), 0);

      setStats({
        total: docs.documents.length,
        active,
        pending,
        overdue,
        revenue
      });

    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      toast.error("Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  const chartOptions: ApexOptions = {
    chart: {
      type: 'donut' as const, // Usamos 'as const' para fixar o tipo literal
    },
    labels: ['Ativas', 'Inativas', 'Suspensas'],
    colors: ['#10B981', '#EF4444', '#F59E0B'],
    legend: {
      position: 'bottom' as const
    }
  };

  const chartSeries = [
    documents.filter(doc => doc.status_empresa === 'Ativa').length,
    documents.filter(doc => doc.status_empresa === 'Inativa').length,
    documents.filter(doc => doc.status_empresa === 'Suspensa').length,
  ];

  // Próximos vencimentos (ordenados)
  const upcomingDueDates = documents
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
      {/* Meta tags para SEO - Adicionar no layout principal */}
      {/* <Head>
        <title>Dashboard - Gestão de Filiais</title>
        <meta name="description" content="Painel de controle para gestão de filiais e registros fiscais" />
        <meta property="og:title" content="Dashboard - Gestão de Filiais" />
        <meta property="og:description" content="Painel de controle para gestão de filiais e registros fiscais" />
      </Head> */}

      <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Dashboard - Gestão de Filiais</h1>
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
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total de Filiais</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <FiFileText size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Filiais Ativas</p>
                <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <FiCheck size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pendentes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                <FiClock size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Faturamento Total</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.revenue)}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                <FiTrendingUp size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos e Seções */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Gráfico de Status */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Status das Empresas</h2>
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
                {documents
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