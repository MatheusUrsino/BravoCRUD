"use client"

import { JSX, useEffect, useMemo, useState } from "react";
import { Models } from "appwrite";
import { toast } from "react-toastify";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { 
  FiCalendar, FiCheck, FiClock, FiFileText, FiTrendingUp, 
  FiX, FiFilter, FiBell, FiBarChart2, FiPieChart, FiMapPin,
  FiDollarSign, FiLayers, FiUsers, FiHome, FiSettings
} from "react-icons/fi";
import Head from "next/head";
import { formatDate } from "../utils/formatters";
import { AuthService, RegistersService } from "../service";
import { AvailableField, Filter } from "@/types/registros";
import { RegistrosFilters } from "@/components/registros";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel } from "@mui/material";

// Carregamento dinâmico para melhor performance
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

type KPIKey = "total" | "active" | "pending" | "overdue" | "revenue" | "branches" | "taxValue";
type ChartType = "status" | "revenue" | "municipality" | "state" | "aliquota" | "monthlyComparison";

export default function DashboardPage() {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    overdue: 0,
    revenue: 0,
    branches: 0,
    taxValue: 0
  });
  const [selectedKPIs, setSelectedKPIs] = useState<KPIKey[]>(["total", "active", "pending", "overdue", "revenue"]);
  const [selectedCharts, setSelectedCharts] = useState<ChartType[]>(["status", "revenue", "municipality"]);
  const [showAlert, setShowAlert] = useState(false);
  const [chartTheme, setChartTheme] = useState<"light" | "dark">("light");
  const [groupBy, setGroupBy] = useState<"month" | "quarter" | "year">("month");
  const [showDataLabels, setShowDataLabels] = useState(false);
  const [showTrendLine, setShowTrendLine] = useState(true);

  // Filtros
  const [filters, setFilters] = useState<Filter[]>([]);
  const [newFilterValue, setNewFilterValue] = useState("");
  const [newFilterField, setNewFilterField] = useState("all");
  const [newFilterType, setNewFilterType] = useState("text");
  const [dateFilterValue, setDateFilterValue] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const authService = AuthService.getInstance();
  const registersService = RegistersService.getInstance();

  const availableFields: AvailableField[] = [
    { value: "all", label: "Todos os campos", type: "text" },
    { value: "empresa", label: "Empresa", type: "text" },
    { value: "loja", label: "Loja", type: "text" },
    { value: "municipio", label: "Município", type: "text" },
    { value: "estado", label: "Estado", type: "text" },
    { value: "status_empresa", label: "Status Empresa", type: "text" },
    { value: "status", label: "Status", type: "text" },
    { value: "vcto_guias_iss_proprio", label: "Vencimento ISS", type: "date" },
    { value: "data_emissao", label: "Data Emissão", type: "date" },
    { value: "aliquota", label: "Alíquota", type: "text" },
    { value: "faturamento", label: "Faturamento", type: "text" },
  ];

  const fetchData = async () => {
    try {
      const account = await authService.getAccount();
      setUser(account);

      const teamId = account.teamId;
      if (!teamId) throw new Error("Usuário não está em nenhum time");

      const docs = await registersService.getDocumentsByTeam(teamId);
      setAllDocuments(docs.documents || []);

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
    const taxValue = docs.reduce((sum, doc) => sum + (doc.vl_issqn || 0), 0);
    const uniqueBranches = new Set(docs.map(doc => doc.loja)).size;

    setStats({
      total: docs.length,
      active,
      pending,
      overdue,
      revenue,
      branches: uniqueBranches,
      taxValue
    });

    setShowAlert(pending > 0 || overdue > 0);
  };

  // Filtro avançado
  const filteredDocs = useMemo(() => {
    if (filters.length === 0) return allDocuments;

    return allDocuments.filter((doc) => {
      return filters.every(filter => {
        if (filter.type !== "date") {
          const searchTerm = filter.value.toLowerCase();
          if (filter.field === "all") {
            return Object.values(doc).some(value => {
              const safeValue = String(value ?? '').toLowerCase();
              return safeValue.includes(searchTerm);
            });
          } else {
            let fieldValue = String(doc[filter.field] ?? '');
            return fieldValue.toLowerCase().includes(searchTerm);
          }
        } else {
          const filterDate = new Date(filter.value);
          if (isNaN(filterDate.getTime())) return false;

          const docDateValue = doc[filter.field];
          if (!docDateValue) return false;

          const docDate = new Date(docDateValue);
          if (isNaN(docDate.getTime())) return false;

          return (
            docDate.getFullYear() === filterDate.getFullYear() &&
            docDate.getMonth() === filterDate.getMonth() &&
            docDate.getDate() === filterDate.getDate()
          );
        }
      });
    });
  }, [allDocuments, filters]);

  useEffect(() => {
    fetchData();
  }, []);

  // Configurações de tema para os gráficos
  const chartThemeConfig = {
    light: {
      textColor: '#374151',
      background: '#ffffff',
      gridColor: '#e5e7eb',
      axisColor: '#6b7280'
    },
    dark: {
      textColor: '#f3f4f6',
      background: '#1f2937',
      gridColor: '#4b5563',
      axisColor: '#9ca3af'
    }
  };

  const currentTheme = chartThemeConfig[chartTheme];

  // Gráfico de status das empresas (donut)
  const statusChartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      background: currentTheme.background,
      foreColor: currentTheme.textColor
    },
    labels: ['Ativas', 'Inativas', 'Suspensas', 'Outros'],
    colors: ['#10B981', '#EF4444', '#F59E0B', '#6B7280'],
    legend: {
      position: 'bottom',
      labels: {
        colors: currentTheme.textColor
      }
    },
    dataLabels: {
      enabled: showDataLabels,
      style: {
        colors: [currentTheme.background]
      },
      dropShadow: {
        enabled: false
      }
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Empresas',
              color: currentTheme.textColor,
              formatter: () => stats.total.toString()
            }
          }
        }
      }
    },
    tooltip: {
      theme: chartTheme,
      y: {
        formatter: (value) => `${value} (${Math.round((value / stats.total) * 100)}%)`
      }
    }
  };

  const statusChartSeries = [
    filteredDocs.filter(doc => doc.status_empresa === 'Ativa').length,
    filteredDocs.filter(doc => doc.status_empresa === 'Inativa').length,
    filteredDocs.filter(doc => doc.status_empresa === 'Suspensa').length,
    filteredDocs.filter(doc => !['Ativa', 'Inativa', 'Suspensa'].includes(doc.status_empresa)).length
  ];

  // Gráfico de faturamento por período
  const getGroupedDates = () => {
    const groupedData: { [key: string]: number } = {};
    
    filteredDocs.forEach(doc => {
      if (doc.data_emissao && doc.faturamento) {
        const date = new Date(doc.data_emissao);
        let key;
        
        if (groupBy === "month") {
          key = date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
        } else if (groupBy === "quarter") {
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `T${quarter} ${date.getFullYear()}`;
        } else {
          key = date.getFullYear().toString();
        }
        
        groupedData[key] = (groupedData[key] || 0) + doc.faturamento;
      }
    });
    
    return groupedData;
  };

  const faturamentoPorPeriodo = getGroupedDates();
  const faturamentoPeriodoLabels = Object.keys(faturamentoPorPeriodo).sort((a, b) => {
    // Ordenação personalizada para garantir a ordem cronológica
    if (groupBy === "month") {
      return new Date(a).getTime() - new Date(b).getTime();
    } else if (groupBy === "quarter") {
      const [q1, y1] = a.split(' ');
      const [q2, y2] = b.split(' ');
      if (y1 !== y2) return parseInt(y1) - parseInt(y2);
      return parseInt(q1.substring(1)) - parseInt(q2.substring(1));
    } else {
      return parseInt(a) - parseInt(b);
    }
  });
  
  const faturamentoPeriodoData = faturamentoPeriodoLabels.map(period => faturamentoPorPeriodo[period]);

  const faturamentoOptions: ApexOptions = {
    chart: { 
      type: 'line',
      background: currentTheme.background,
      foreColor: currentTheme.textColor,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      }
    },
    xaxis: { 
      categories: faturamentoPeriodoLabels,
      labels: {
        style: {
          colors: currentTheme.textColor
        }
      },
      axisBorder: {
        show: true,
        color: currentTheme.axisColor
      },
      axisTicks: {
        show: true,
        color: currentTheme.axisColor
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: currentTheme.textColor
        },
        formatter: (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      }
    },
    stroke: { 
      curve: 'smooth',
      width: 3
    },
    colors: ['#6366F1', '#10B981'],
    dataLabels: { 
      enabled: showDataLabels,
      style: {
        colors: [currentTheme.background]
      },
      formatter: (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
    },
    title: { 
      text: 'Evolução do Faturamento', 
      align: 'left',
      style: {
        color: currentTheme.textColor,
        fontSize: '16px'
      }
    },
    grid: {
      borderColor: currentTheme.gridColor,
      strokeDashArray: 4
    },
    markers: {
      size: 5,
      hover: {
        size: 7
      }
    },
    annotations: showTrendLine ? {
      yaxis: [{
        y: stats.revenue / filteredDocs.length,
        borderColor: '#F59E0B',
        label: {
          borderColor: '#F59E0B',
          style: {
            color: currentTheme.textColor,
            background: currentTheme.background
          },
          text: `Média: ${(stats.revenue / filteredDocs.length).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
        }
      }]
    } : undefined,
    tooltip: {
      theme: chartTheme,
      y: {
        formatter: (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      }
    }
  };

  // Gráfico de distribuição por município (pizza)
  const municipios: { [key: string]: number } = {};
  filteredDocs.forEach(doc => {
    if (doc.municipio) {
      municipios[doc.municipio] = (municipios[doc.municipio] || 0) + 1;
    }
  });
  
  // Pegar os top 5 municípios e agrupar o restante como "Outros"
  const sortedMunicipios = Object.entries(municipios)
    .sort((a, b) => b[1] - a[1]);
  
  const topMunicipios = sortedMunicipios.slice(0, 5);
  const otherCount = sortedMunicipios.slice(5).reduce((sum, [, count]) => sum + count, 0);
  
  const municipioLabels = [
    ...topMunicipios.map(([municipio]) => municipio),
    ...(otherCount > 0 ? ['Outros'] : [])
  ];
  
  const municipioData = [
    ...topMunicipios.map(([, count]) => count),
    ...(otherCount > 0 ? [otherCount] : [])
  ];

  const municipioOptions: ApexOptions = {
    chart: { 
      type: 'pie',
      background: currentTheme.background,
      foreColor: currentTheme.textColor
    },
    labels: municipioLabels,
    colors: ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#A21CAF'],
    legend: { 
      position: 'bottom',
      labels: {
        colors: currentTheme.textColor
      }
    },
    dataLabels: {
      enabled: showDataLabels,
      style: {
        colors: [currentTheme.background]
      },
      formatter: (val, { seriesIndex }) => {
        return `${municipioLabels[seriesIndex]}: ${val} (${Math.round((Number(val) / filteredDocs.length) * 100)}%)`;
      }
    },
    title: { 
      text: 'Distribuição por Município', 
      align: 'left',
      style: {
        color: currentTheme.textColor,
        fontSize: '16px'
      }
    },
    tooltip: {
      theme: chartTheme,
      y: {
        formatter: (value) => `${value} filiais`
      }
    }
  };

  // Gráfico de distribuição por estado (barra horizontal)
  const estados: { [key: string]: number } = {};
  filteredDocs.forEach(doc => {
    if (doc.estado) {
      estados[doc.estado] = (estados[doc.estado] || 0) + 1;
    }
  });
  
  const stateChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      background: currentTheme.background,
      foreColor: currentTheme.textColor
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        distributed: true
      }
    },
    colors: ['#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF'],
    dataLabels: {
      enabled: showDataLabels,
      style: {
        colors: [currentTheme.background]
      }
    },
    xaxis: {
      categories: Object.keys(estados),
      labels: {
        style: {
          colors: currentTheme.textColor
        }
      },
      axisBorder: {
        show: true,
        color: currentTheme.axisColor
      },
      axisTicks: {
        show: true,
        color: currentTheme.axisColor
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: currentTheme.textColor
        }
      }
    },
    title: {
      text: 'Distribuição por Estado',
      align: 'left',
      style: {
        color: currentTheme.textColor,
        fontSize: '16px'
      }
    },
    tooltip: {
      theme: chartTheme
    }
  };

  // Gráfico de alíquota média por estado
  const aliquotaPorEstado: { [key: string]: { sum: number; count: number } } = {};
  filteredDocs.forEach(doc => {
    if (doc.estado && doc.aliquota) {
      const aliquota = parseFloat(doc.aliquota);
      if (!isNaN(aliquota)) {
        if (!aliquotaPorEstado[doc.estado]) {
          aliquotaPorEstado[doc.estado] = { sum: 0, count: 0 };
        }
        aliquotaPorEstado[doc.estado].sum += aliquota;
        aliquotaPorEstado[doc.estado].count += 1;
      }
    }
  });

  const estadosAliquota = Object.keys(aliquotaPorEstado);
  const mediaAliquotaData = estadosAliquota.map(estado => 
    Number((aliquotaPorEstado[estado].sum / aliquotaPorEstado[estado].count).toFixed(2))
  );

  const aliquotaOptions: ApexOptions = {
    chart: {
      type: 'bar',
      background: currentTheme.background,
      foreColor: currentTheme.textColor
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '70%',
      }
    },
    colors: ['#10B981'],
    dataLabels: {
      enabled: showDataLabels,
      style: {
        colors: [currentTheme.background]
      },
      formatter: (val) => `${val}%`
    },
    xaxis: {
      categories: estadosAliquota,
      labels: {
        style: {
          colors: currentTheme.textColor
        }
      },
      axisBorder: {
        show: true,
        color: currentTheme.axisColor
      },
      axisTicks: {
        show: true,
        color: currentTheme.axisColor
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: currentTheme.textColor
        },
        formatter: (val) => `${val}%`
      },
      max: 10 // Assumindo que a alíquota máxima é 10%
    },
    title: {
      text: 'Alíquota Média por Estado',
      align: 'left',
      style: {
        color: currentTheme.textColor,
        fontSize: '16px'
      }
    },
    tooltip: {
      theme: chartTheme,
      y: {
        formatter: (val) => `${val}%`
      }
    }
  };

  // Gráfico de comparação mensal (ano atual vs ano anterior)
  const currentYear = new Date().getFullYear();
  const monthlyComparisonData = () => {
    const currentYearData: number[] = Array(12).fill(0);
    const previousYearData: number[] = Array(12).fill(0);
    
    filteredDocs.forEach(doc => {
      if (doc.data_emissao && doc.faturamento) {
        const date = new Date(doc.data_emissao);
        const month = date.getMonth();
        const year = date.getFullYear();
        const faturamento = doc.faturamento;
        
        if (year === currentYear) {
          currentYearData[month] += faturamento;
        } else if (year === currentYear - 1) {
          previousYearData[month] += faturamento;
        }
      }
    });
    
    return {
      currentYear: currentYearData,
      previousYear: previousYearData
    };
  };

  const comparisonData = monthlyComparisonData();
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const monthlyComparisonOptions: ApexOptions = {
    chart: {
      type: 'bar',
      background: currentTheme.background,
      foreColor: currentTheme.textColor,
      stacked: false,
      toolbar: {
        show: true
      }
    },
    colors: ['#3B82F6', '#10B981'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%'
      },
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: monthNames,
      labels: {
        style: {
          colors: currentTheme.textColor
        }
      },
      axisBorder: {
        show: true,
        color: currentTheme.axisColor
      },
      axisTicks: {
        show: true,
        color: currentTheme.axisColor
      }
    },
    yaxis: {
      title: {
        text: 'Faturamento',
        style: {
          color: currentTheme.textColor
        }
      },
      labels: {
        style: {
          colors: currentTheme.textColor
        },
        formatter: (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
      }
    },
    fill: {
      opacity: 1
    },
    tooltip: {
      theme: chartTheme,
      y: {
        formatter: (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      }
    },
    title: {
      text: `Comparativo Mensal ${currentYear} vs ${currentYear - 1}`,
      align: 'left',
      style: {
        color: currentTheme.textColor,
        fontSize: '16px'
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'center',
      labels: {
        colors: currentTheme.textColor
      }
    }
  };

  // KPIs disponíveis
  const kpiList: { key: KPIKey, label: string, icon: JSX.Element, color: string, formatter?: (value: number) => string }[] = [
    { key: "total", label: "Total de Registros", icon: <FiFileText />, color: "bg-blue-100 text-blue-800" },
    { key: "active", label: "Empresas Ativas", icon: <FiCheck />, color: "bg-green-100 text-green-800" },
    { key: "pending", label: "Pendentes", icon: <FiClock />, color: "bg-yellow-100 text-yellow-800" },
    { key: "overdue", label: "Vencidos", icon: <FiCalendar />, color: "bg-red-100 text-red-800" },
    { 
      key: "revenue", 
      label: "Faturamento Total", 
      icon: <FiTrendingUp />, 
      color: "bg-indigo-100 text-indigo-800",
      formatter: (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    { key: "branches", label: "Filiais Únicas", icon: <FiHome />, color: "bg-purple-100 text-purple-800" },
    { 
      key: "taxValue", 
      label: "Valor Total de ISS", 
      icon: <FiDollarSign />, 
      color: "bg-cyan-100 text-cyan-800",
      formatter: (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }
  ];

  // Tipos de gráficos disponíveis
  const chartTypes: { key: ChartType, label: string, icon: JSX.Element }[] = [
    { key: "status", label: "Status das Empresas", icon: <FiPieChart /> },
    { key: "revenue", label: "Evolução do Faturamento", icon: <FiTrendingUp /> },
    { key: "municipality", label: "Distribuição por Município", icon: <FiMapPin /> },
    { key: "state", label: "Distribuição por Estado", icon: <FiMapPin /> },
    { key: "aliquota", label: "Alíquota Média", icon: <FiBarChart2 /> },
    { key: "monthlyComparison", label: "Comparativo Mensal", icon: <FiLayers /> }
  ];

  // Próximos vencimentos (ordenados)
  const upcomingDueDates = filteredDocs
    .filter(doc => doc.vcto_guias_iss_proprio)
    .map(doc => ({
      id: doc.$id,
      empresa: doc.empresa,
      loja: doc.loja,
      date: doc.vcto_guias_iss_proprio,
      status: new Date(doc.vcto_guias_iss_proprio) < new Date() ? 'overdue' : 'upcoming',
      valor: doc.vl_issqn || 0
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // Notificação visual (toast/badge)
  useEffect(() => {
    if (showAlert) {
      toast.warn(
        <div>
          <p className="font-medium">Alerta de Pendências!</p>
          <p>Há {stats.pending} registros pendentes e {stats.overdue} vencidos</p>
          <Link href="/registros?status=Pendente" className="text-blue-600 underline">Ver detalhes</Link>
        </div>,
        { autoClose: 10000 }
      );
    }
  }, [showAlert]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${chartTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Head>
        <title>Dashboard Avançado - Gestão de Filiais</title>
        <meta name="description" content="Painel de controle avançado para gestão de filiais e registros fiscais" />
      </Head>

      <header className={`bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg ${chartTheme === 'dark' ? 'border-b border-gray-700' : ''}`}>
        <DashboardHeader />
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Configurações do Dashboard */}
        <div className={`p-4 rounded-lg mb-6 ${chartTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${chartTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <FiSettings /> Configurações do Dashboard
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormControl fullWidth>
              <InputLabel>Tema dos Gráficos</InputLabel>
              <Select
                value={chartTheme}
                onChange={(e) => setChartTheme(e.target.value as "light" | "dark")}
                label="Tema dos Gráficos"
              >
                <MenuItem value="light">Claro</MenuItem>
                <MenuItem value="dark">Escuro</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Agrupar por</InputLabel>
              <Select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as "month" | "quarter" | "year")}
                label="Agrupar por"
              >
                <MenuItem value="month">Mês</MenuItem>
                <MenuItem value="quarter">Trimestre</MenuItem>
                <MenuItem value="year">Ano</MenuItem>
              </Select>
            </FormControl>
            
            <div className="flex flex-col gap-2">
              <FormControlLabel
                control={
                  <Switch
                    checked={showDataLabels}
                    onChange={() => setShowDataLabels(!showDataLabels)}
                    color="primary"
                  />
                }
                label="Mostrar valores nos gráficos"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showTrendLine}
                    onChange={() => setShowTrendLine(!showTrendLine)}
                    color="primary"
                  />
                }
                label="Mostrar linha de tendência"
              />
            </div>
          </div>
        </div>

        {/* Alertas e Notificações */}
        {showAlert && (
          <div className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${chartTheme === 'dark' ? 'bg-yellow-900 text-yellow-200 border-yellow-700' : 'bg-yellow-100 text-yellow-800 border-yellow-500'} border-l-4`}>
            <FiBell size={20} />
            <div>
              <p className="font-medium">Atenção!</p>
              <p>Há {stats.pending} registros pendentes e {stats.overdue} vencidos. <Link href="/registros?status=Pendente" className="underline">Ver detalhes</Link></p>
            </div>
          </div>
        )}

        {/* Filtro Avançado de Registros */}
        <div className={`p-6 rounded-xl shadow-sm border mb-8 ${chartTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${chartTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
            <FiFilter /> Filtros Avançados
          </h2>
          <RegistrosFilters
            filters={filters}
            newFilterField={newFilterField}
            newFilterValue={newFilterValue}
            newFilterType={newFilterType}
            dateFilterValue={dateFilterValue}
            availableFields={availableFields}
            onAddFilter={() => {
              if (newFilterType !== "date" && !newFilterValue.trim()) {
                toast.error("Por favor, insira um valor para filtrar");
                return;
              }
              if (newFilterType === "date" && !dateFilterValue) {
                toast.error("Por favor, selecione uma data");
                return;
              }
              const newFilter: Filter = {
                id: Date.now().toString(),
                value: newFilterType === "date"
                  ? new Date(dateFilterValue).toISOString().split('T')[0]
                  : newFilterValue.toLowerCase(),
                field: newFilterField,
                type: newFilterType
              };
              setFilters([...filters, newFilter]);
              setNewFilterValue("");
              setDateFilterValue("");
              setDatePickerOpen(false);
            }}
            onRemoveFilter={id => setFilters(filters.filter(f => f.id !== id))}
            onFieldChange={value => {
              setNewFilterField(value);
              const fieldType = availableFields.find(f => f.value === value)?.type || "text";
              setNewFilterType(fieldType);
              if (fieldType === "date") {
                setDatePickerOpen(true);
              } else {
                setDatePickerOpen(false);
              }
            }}
            onValueChange={setNewFilterValue}
            onDateChange={date => {
              if (date) {
                date.setDate(date.getDate() + 1);
                const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                setDateFilterValue(formatted);
              } else {
                setDateFilterValue("");
              }
            }}
            onClearValue={() => {
              setNewFilterValue("");
              setDateFilterValue("");
              setDatePickerOpen(false);
            }}
            datePickerOpen={datePickerOpen}
            setDatePickerOpen={setDatePickerOpen}
          />
        </div>

        {/* KPIs Personalizáveis */}
        <div className="mb-8">
          <h2 className={`text-lg font-medium mb-2 flex items-center gap-2 ${chartTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
            <FiBarChart2 /> Indicadores (KPIs)
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {kpiList.map(kpi => (
              <label key={kpi.key} className={`flex items-center gap-1 cursor-pointer ${chartTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                <input
                  type="checkbox"
                  checked={selectedKPIs.includes(kpi.key)}
                  onChange={() => {
                    setSelectedKPIs(prev =>
                      prev.includes(kpi.key)
                        ? prev.filter(k => k !== kpi.key)
                        : [...prev, kpi.key]
                    );
                  }}
                  className="accent-blue-600"
                />
                <span className="text-sm">{kpi.label}</span>
              </label>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiList.filter(kpi => selectedKPIs.includes(kpi.key)).map(kpi => (
              <div key={kpi.key} className={`flex items-center gap-4 p-4 rounded-xl shadow-sm border ${kpi.color} ${chartTheme === 'dark' ? 'border-gray-700' : ''}`}>
                <div className="text-2xl">{kpi.icon}</div>
                <div>
                  <div className="text-lg font-bold">
                    {kpi.formatter ? kpi.formatter(stats[kpi.key]) : stats[kpi.key]}
                  </div>
                  <div className="text-xs">{kpi.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seleção de Gráficos */}
        <div className={`p-4 rounded-lg mb-6 ${chartTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${chartTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${chartTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
            <FiBarChart2 /> Gráficos Disponíveis
          </h2>
          <div className="flex flex-wrap gap-2">
            {chartTypes.map(chart => (
              <label key={chart.key} className={`flex items-center gap-1 cursor-pointer ${chartTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                <input
                  type="checkbox"
                  checked={selectedCharts.includes(chart.key)}
                  onChange={() => {
                    setSelectedCharts(prev =>
                      prev.includes(chart.key)
                        ? prev.filter(c => c !== chart.key)
                        : [...prev, chart.key]
                    );
                  }}
                  className="accent-blue-600"
                />
                <span className="text-sm">{chart.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Gráficos Avançados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Status */}
          {selectedCharts.includes("status") && (
            <div className={`p-6 rounded-xl shadow-sm border ${chartTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${chartTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                <FiPieChart /> Status das Empresas
              </h2>
              {typeof window !== 'undefined' && (
                <Chart
                  options={statusChartOptions}
                  series={statusChartSeries}
                  type="donut"
                  height={350}
                />
              )}
            </div>
          )}

          {/* Gráfico de Faturamento por Período */}
          {selectedCharts.includes("revenue") && (
            <div className={`p-6 rounded-xl shadow-sm border ${chartTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${chartTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                <FiTrendingUp /> Evolução do Faturamento
              </h2>
              {typeof window !== 'undefined' && (
                <Chart
                  options={faturamentoOptions}
                  series={[{ name: "Faturamento", data: faturamentoPeriodoData }]}
                  type="line"
                  height={350}
                />
              )}
            </div>
          )}

          {/* Gráfico de Distribuição por Município */}
          {selectedCharts.includes("municipality") && municipioLabels.length > 0 && (
            <div className={`p-6 rounded-xl shadow-sm border ${chartTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${chartTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                <FiMapPin /> Distribuição por Município
              </h2>
              {typeof window !== 'undefined' ? (
                <Chart
                  options={municipioOptions}
                  series={municipioData}
                  type="pie"
                  height={350}
                />
              ) : (
                <div className={`text-sm ${chartTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Sem dados suficientes para exibir o gráfico.</div>
              )}
            </div>
          )}

          {/* Gráfico de Distribuição por Estado */}
          {selectedCharts.includes("state") && Object.keys(estados).length > 0 && (
            <div className={`p-6 rounded-xl shadow-sm border ${chartTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${chartTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                <FiMapPin /> Distribuição por Estado
              </h2>
              {typeof window !== 'undefined' ? (
                <Chart
                  options={stateChartOptions}
                  series={[{ name: "Filiais", data: Object.values(estados) }]}
                  type="bar"
                  height={350}
                />
              ) : (
                <div className={`text-sm ${chartTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Sem dados suficientes para exibir o gráfico.</div>
              )}
            </div>
          )}

          {/* Gráfico de Alíquota Média */}
          {selectedCharts.includes("aliquota") && estadosAliquota.length > 0 && (
            <div className={`p-6 rounded-xl shadow-sm border ${chartTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${chartTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                <FiBarChart2 /> Alíquota Média por Estado
              </h2>
              {typeof window !== 'undefined' ? (
                <Chart
                  options={aliquotaOptions}
                  series={[{ name: "Alíquota Média", data: mediaAliquotaData }]}
                  type="bar"
                  height={350}
                />
              ) : (
                <div className={`text-sm ${chartTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Sem dados suficientes para exibir o gráfico.</div>
              )}
            </div>
          )}

          {/* Gráfico de Comparação Mensal */}
          {selectedCharts.includes("monthlyComparison") && (
            <div className={`p-6 rounded-xl shadow-sm border ${chartTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} lg:col-span-2`}>
              <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${chartTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                <FiLayers /> Comparativo Mensal {currentYear} vs {currentYear - 1}
              </h2>
              {typeof window !== 'undefined' ? (
                <Chart
                  options={monthlyComparisonOptions}
                  series={[
                    { name: currentYear.toString(), data: comparisonData.currentYear },
                    { name: (currentYear - 1).toString(), data: comparisonData.previousYear }
                  ]}
                  type="bar"
                  height={350}
                />
              ) : (
                <div className={`text-sm ${chartTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Sem dados suficientes para exibir o gráfico.</div>
              )}
            </div>
          )}
        </div>

        {/* Alertas de Vencimento */}
        <div className={`p-6 rounded-xl shadow-sm border mb-8 ${chartTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${chartTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
            <FiCalendar /> Próximos Vencimentos
          </h2>
          <div className="space-y-3">
            {upcomingDueDates.length > 0 ? (
              upcomingDueDates.map((item) => (
                <div key={item.id} className="flex items-start">
                  <div className={`flex-shrink-0 p-2 rounded-lg ${item.status === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    <FiCalendar size={20} />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between">
                      <p className={`font-medium ${chartTheme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                        {item.empresa} {item.loja && `- ${item.loja}`}
                      </p>
                      <span className={`text-sm ${item.status === 'overdue' ? 'text-red-600' : chartTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatDate(item.date)} {item.status === 'overdue' && '(Vencido)'}
                      </span>
                    </div>
                    <p className={`text-sm ${chartTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Valor ISS: {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className={`text-sm ${chartTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Nenhum vencimento próximo</p>
            )}
          </div>
        </div>

        {/* Últimas Atividades */}
        <div className={`p-6 rounded-xl shadow-sm border ${chartTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-lg font-medium mb-4 ${chartTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Últimas Atividades</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={`${chartTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${chartTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Empresa</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${chartTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Localidade</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${chartTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Ação</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${chartTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Responsável</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${chartTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Datas</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${chartTheme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {filteredDocs
                  .sort((a, b) => new Date(b.$updatedAt).getTime() - new Date(a.$updatedAt).getTime())
                  .slice(0, 5)
                  .map((doc) => (
                    <tr key={doc.$id} className={`${chartTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`font-medium ${chartTheme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{doc.empresa || '-'}</div>
                        <div className={`text-sm ${chartTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{doc.loja || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`font-medium ${chartTheme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{doc.estado || '-'}</div>
                        <div className={`text-sm ${chartTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{doc.municipio || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${chartTheme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                          {doc.$createdAt === doc.$updatedAt ? 'Criado' : 'Atualizado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${chartTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{doc.responsavel || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${chartTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          <span>
                            Emissão: {doc.data_emissao
                              ? formatDate(
                                (() => {
                                  const d = new Date(doc.data_emissao);
                                  d.setDate(d.getDate());
                                  return d.toLocaleDateString('pt-BR');
                                })()
                              )
                              : '-'}
                          </span>
                          <br />
                          <span>
                            Vencimento: {doc.vcto_guias_iss_proprio ? formatDate(doc.vcto_guias_iss_proprio) : '-'}
                          </span>
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