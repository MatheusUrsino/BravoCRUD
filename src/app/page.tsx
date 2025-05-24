"use client"

import { JSX, useEffect, useMemo, useState } from "react";
import { Models } from "appwrite";
import { toast } from "react-toastify";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import {
  FiCalendar, FiCheck, FiClock, FiFileText, FiTrendingUp,
  FiX, FiFilter, FiBell, FiBarChart2, FiPieChart, FiSettings, FiPieChart as FiPie, FiBarChart, FiActivity
} from "react-icons/fi";
import { MdNoAccounts, MdOutlineDoNotDisturbAlt } from "react-icons/md";
import { BsFillExclamationTriangleFill } from "react-icons/bs";
import Head from "next/head";
import { formatDate } from "../utils/formatters";
import { AuthService, RegistersService } from "../service";
import { AvailableField, Filter } from "@/types/registros";
import { RegistrosFilters } from "@/components/registros";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel, Tooltip, Avatar } from "@mui/material";

// Carregamento dinâmico para melhor performance
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

type KPIKey = "total" | "concluido" | "erro_login" | "modulo_nao_habilitado" | "sem_acesso" | "pendencia" | "sem_movimento" | "revenue";
type ChartType = "status" | "revenue";

const STATUS_LABELS = [
  { key: "concluido", label: "Concluído", color: "#32CD32", icon: <FiCheck /> },
  { key: "erro_login", label: "Erro de login", color: "#FF4500", icon: <MdNoAccounts /> },
  { key: "modulo_nao_habilitado", label: "Módulo não habilitado", color: "#6366F1", icon: <FiSettings /> },
  { key: "sem_acesso", label: "Sem acesso", color: "#3B82F6", icon: <FiX /> },
  { key: "pendencia", label: "Pendência", color: "#FF0000", icon: <BsFillExclamationTriangleFill /> },
  { key: "sem_movimento", label: "Sem movimento", color: "#778899", icon: <MdOutlineDoNotDisturbAlt /> },
];

export default function DashboardPage() {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    total: 0,
    concluido: 0,
    erro_login: 0,
    modulo_nao_habilitado: 0,
    sem_acesso: 0,
    pendencia: 0,
    sem_movimento: 0,
    revenue: 0
  });
  const [selectedKPIs] = useState<KPIKey[]>(["total", "concluido", "erro_login", "modulo_nao_habilitado", "sem_acesso", "pendencia", "sem_movimento", "revenue"]);
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

  // Atividades recentes
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

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

      // Atividades recentes (últimos 8 registros modificados)
      setRecentActivities(
        (docs.documents || [])
          .sort((a, b) => new Date(b.$updatedAt).getTime() - new Date(a.$updatedAt).getTime())
          .slice(0, 8)
      );
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      toast.error("Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (docs: any[]) => {
    const concluido = docs.filter(doc => doc.status === 'CONCLUIDO').length;
    const erro_login = docs.filter(doc => doc.status === 'ERRO_LOGIN').length;
    const modulo_nao_habilitado = docs.filter(doc => doc.status === 'MODULO_NAO_HABILITADO').length;
    const sem_acesso = docs.filter(doc => doc.status === 'SEM_ACESSO').length;
    const pendencia = docs.filter(doc => doc.status === 'PENDENCIA').length;
    const sem_movimento = docs.filter(doc => doc.status === 'SEM_MOVIMENTO').length;
    const revenue = docs.reduce((sum, doc) => sum + (doc.faturamento || 0), 0);

    setStats({
      total: docs.length,
      concluido,
      erro_login,
      modulo_nao_habilitado,
      sem_acesso,
      pendencia,
      sem_movimento,
      revenue
    });

    setShowAlert(pendencia > 0);
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
    // eslint-disable-next-line
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

  // Gráfico de status dos registros (donut + barra horizontal)
  const statusChartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      background: currentTheme.background,
      foreColor: currentTheme.textColor,
      toolbar: { show: false }
    },
    labels: STATUS_LABELS.map(s => s.label),
    colors: STATUS_LABELS.map(s => s.color),
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
              label: 'Total',
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
        formatter: (value) => `${value} (${stats.total ? Math.round((value / stats.total) * 100) : 0}%)`
      }
    }
  };

  const statusChartSeries = [
    stats.concluido,
    stats.erro_login,
    stats.modulo_nao_habilitado,
    stats.sem_acesso,
    stats.pendencia,
    stats.sem_movimento
  ];

  // Gráfico de barras horizontal para status
  const statusBarOptions: ApexOptions = {
    chart: {
      type: 'bar',
      background: currentTheme.background,
      foreColor: currentTheme.textColor,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        barHeight: '60%',
        distributed: true,
      }
    },
    colors: STATUS_LABELS.map(s => s.color),
    dataLabels: {
      enabled: showDataLabels,
      style: {
        colors: [currentTheme.textColor]
      }
    },
    xaxis: {
      categories: STATUS_LABELS.map(s => s.label),
      labels: {
        style: { colors: currentTheme.textColor }
      },
      title: { text: "Quantidade", style: { color: currentTheme.textColor } }
    },
    yaxis: {
      labels: { style: { colors: currentTheme.textColor } }
    },
    grid: {
      borderColor: currentTheme.gridColor,
      strokeDashArray: 4
    },
    tooltip: {
      theme: chartTheme,
      y: {
        formatter: (value) => `${value} registro${value === 1 ? "" : "s"}`
      }
    }
  };

  // Gráfico de faturamento por período (linha + área)
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
      type: 'area',
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
    fill: {
      type: "gradient",
      gradient: {
        shade: chartTheme === "dark" ? "dark" : "light",
        type: "vertical",
        shadeIntensity: 0.2,
        gradientToColors: [chartTheme === "dark" ? "#6366F1" : "#10B981"],
        inverseColors: false,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 100]
      }
    },
    colors: ['#10B981'],
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
        y: stats.revenue / (filteredDocs.length || 1),
        borderColor: '#F59E0B',
        label: {
          borderColor: '#F59E0B',
          style: {
            color: currentTheme.textColor,
            background: currentTheme.background
          },
          text: `Média: ${(stats.revenue / (filteredDocs.length || 1)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
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

  // KPIs disponíveis
  const kpiList: { key: KPIKey, label: string, icon: JSX.Element, color: string, formatter?: (value: number) => string }[] = [
    { key: "total", label: "Total de Registros", icon: <FiFileText />, color: "bg-pink-100 text-pink-800" },
    { key: "concluido", label: "Concluídos", icon: <FiCheck />, color: "bg-green-100 text-green-800" },
    { key: "pendencia", label: "Pendência", icon: <BsFillExclamationTriangleFill />, color: "bg-red-100 text-red-800" },
    { key: "erro_login", label: "Erro de login", icon: <MdNoAccounts />, color: "bg-orange-100 text-orange-800" },
    { key: "modulo_nao_habilitado", label: "Módulo não habilitado", icon: <FiSettings />, color: "bg-indigo-100 text-indigo-800" },
    { key: "sem_movimento", label: "Sem movimento", icon: <MdOutlineDoNotDisturbAlt />, color: "bg-gray-100 text-gray-800" },
    { key: "sem_acesso", label: "Sem acesso", icon: <FiX />, color: "bg-cyan-100 text-cyan-800" },
    {
      key: "revenue",
      label: "Faturamento Total",
      icon: <FiTrendingUp />,
      color: "bg-green-100 text-green-50", // Verde escuro de destaque
      formatter: (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }
  ];

  // Notificação visual (toast/badge)
  useEffect(() => {
    if (showAlert) {
      toast.warn(
        <div>
          <p className="font-medium">Alerta de Pendências!</p>
          <p>Há {stats.pendencia} registros pendentes</p>
          <Link href="/registros?status=PENDENTE" className="text-blue-600 underline">Ver detalhes</Link>
        </div>,
        { autoClose: 10000 }
      );
    }
  }, [showAlert, stats.pendencia]);

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
        {/* Alertas e Notificações */}
        {showAlert && (
          <div className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${chartTheme === 'dark' ? 'bg-yellow-900 text-yellow-200 border-yellow-700' : 'bg-yellow-100 text-yellow-800 border-yellow-500'} border-l-4`}>
            <FiBell size={20} />
            <div>
              <p className="font-medium">Atenção!</p>
              <p>Há {stats.pendencia} registros pendentes. <Link href="/registros?status=PENDENTE" className="underline">Ver detalhes</Link></p>
            </div>
          </div>
        )}

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

        {/* KPIs */}
        <div className="mb-8">
          <h2 className={`text-lg font-medium mb-2 flex items-center gap-2 ${chartTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
            <FiBarChart2 /> Indicadores (KPIs)
          </h2>
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

        {/* Gráficos Avançados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Status Donut */}
          <div className={`p-6 rounded-xl shadow-sm border ${chartTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${chartTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
              <FiPie /> Distribuição dos Status
            </h2>
            {typeof window !== 'undefined' && (
              <Chart
                options={statusChartOptions}
                series={statusChartSeries}
                type="donut"
                height={340}
              />
            )}
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {STATUS_LABELS.map((s, idx) => (
                <span key={s.key} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ background: s.color + "22", color: s.color }}>
                  <span className="text-base">{s.icon}</span>
                  <span className="font-medium">{s.label}</span>
                  <span className="ml-1 text-gray-500">{statusChartSeries[idx]}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Gráfico de Status em Barra */}
          <div className={`p-6 rounded-xl shadow-sm border ${chartTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${chartTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
              <FiBarChart /> Status por Quantidade
            </h2>
            {typeof window !== 'undefined' && (
              <Chart
                options={statusBarOptions}
                series={[{ data: statusChartSeries }]}
                type="bar"
                height={340}
              />
            )}
          </div>
        </div>

        {/* Gráfico de Faturamento */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className={`p-6 rounded-xl shadow-sm border ${chartTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${chartTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
              <FiTrendingUp /> Evolução do Faturamento
            </h2>
            {typeof window !== 'undefined' && (
              <Chart
                options={faturamentoOptions}
                series={[{ name: "Faturamento", data: faturamentoPeriodoData }]}
                type="area"
                height={380}
              />
            )}
          </div>
        </div>

        {/* Últimas Atividades */}
        <div className="mb-8">
          <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${chartTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
            <FiActivity /> Últimas Atividades
          </h2>
          <div className={`rounded-xl shadow-sm border ${chartTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4`}>
            {recentActivities.length === 0 && (
              <div className="text-gray-400 text-center py-8">Nenhuma atividade recente encontrada.</div>
            )}
            <ul className="divide-y divide-gray-200">
              {recentActivities.map((activity, idx) => (
                <li key={activity.$id} className="flex items-center py-3 gap-4">
                  <Tooltip title={activity.status || "Sem status"}>
                    <span className="rounded-full p-2" style={{ background: (STATUS_LABELS.find(s => s.key === (activity.status?.toLowerCase() || ""))?.color || "#e5e7eb") + "22" }}>
                      {STATUS_LABELS.find(s => s.key === (activity.status?.toLowerCase() || ""))?.icon || <FiFileText />}
                    </span>
                  </Tooltip>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{activity.empresa || "Empresa desconhecida"}</span>
                      <span className="text-xs text-gray-500">{activity.loja && `Loja: ${activity.loja}`}</span>
                      <span className="text-xs text-gray-400">{activity.municipio}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {activity.status && <span>Status: <span className="font-medium">{activity.status}</span></span>}
                      {activity.faturamento && (
                        <span className="ml-2">Faturamento: <span className="font-medium">{Number(activity.faturamento).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {activity.$updatedAt ? formatDate(activity.$updatedAt) : ""}
                  </div>
                  <Link
                    href={`/registros/edit/${activity.$id}`}
                    className="ml-2 text-blue-600 hover:text-blue-900 transition-colors text-xs underline"
                  >
                    Ver detalhes
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}