"use client"

import { JSX, useEffect, useMemo, useState } from "react";
import { Models } from "appwrite";
import { toast } from "react-toastify";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import {
  FiCalendar, FiCheck, FiClock, FiFileText, FiTrendingUp,
  FiX, FiFilter, FiBell, FiBarChart2, FiPieChart, FiSettings, FiMap, FiLayers,
  FiActivity
} from "react-icons/fi";
import { MdCloudOff, MdError, MdNoAccounts, MdOutlineDoNotDisturbAlt } from "react-icons/md";
import { BsFillExclamationTriangleFill } from "react-icons/bs";
import Head from "next/head";
import { formatDate } from "../utils/formatters";
import { AuthService, RegistersService } from "../service";
import { AvailableField, Filter } from "@/types/registros";
import { RegistrosFilters } from "@/components/registros";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel, Tooltip, Avatar } from "@mui/material";
import { StatusDonutChart } from "@/components/charts/StatusDonutChart";
import { StatusBarChart } from "@/components/charts/StatusBarChart";
import { AliquotaHistogramChart } from "@/components/charts/AliquotaHistogramChart";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { RevenueTreemapChart } from "@/components/charts/RevenueTreemapChart";
import { StatusTimelineChart } from "@/components/charts/StatusTimelineChart";
import { StateMapChart } from "@/components/charts/StateMapChart";
import { getStateData } from "@/components/charts/getStateData";
import { useTheme } from "@/context/ThemeContext";

// Tipos e constantes
type KPIKey = "total" | "concluido" | "erro_login" | "erro_sistema" | "modulo_nao_habilitado" | "sem_acesso" | "pendencia" | "sem_movimento" | "revenue";
type ChartType = "status" | "revenue" | "state" | "treemap" | "timeline" | "histogram";

const STATUS_LABELS = [
  { key: "concluido", label: "Concluído", color: "#32CD32", icon: <FiCheck /> },
  { key: "erro_login", label: "Erro de login", color: "#FF4500", icon: <MdNoAccounts /> },
  { key: "erro_sistema", label: "Erro de Sistema", color: "#FF4500", icon: <MdNoAccounts /> },
  { key: "modulo_nao_habilitado", label: "Módulo não habilitado", color: "#6366F1", icon: <FiSettings /> },
  { key: "sem_acesso", label: "Sem acesso", color: "#3B82F6", icon: <FiX /> },
  { key: "pendencia", label: "Pendência", color: "#FF0000", icon: <BsFillExclamationTriangleFill /> },
  { key: "sem_movimento", label: "Sem movimento", color: "#778899", icon: <MdOutlineDoNotDisturbAlt /> },
];


export default function DashboardPage() {
  const { theme } = useTheme();
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedKPIs] = useState<KPIKey[]>(["total", "concluido", "erro_login", "erro_sistema", "modulo_nao_habilitado", "sem_acesso", "pendencia", "sem_movimento", "revenue"]);
  const [showAlert, setShowAlert] = useState(false);
  const [groupBy, setGroupBy] = useState<"month" | "quarter" | "year">("month");
  const [showDataLabels, setShowDataLabels] = useState(false);
  const [showTrendLine, setShowTrendLine] = useState(true);
  const [activeChart, setActiveChart] = useState<ChartType>("status");

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
    { value: "empresa", label: "Empresa", type: "text" },
    { value: "loja", label: "Loja", type: "text" },
    { value: "docSap", label: "Doc SAP", type: "text" },
    { value: "competencia", label: "Competência (Mês/Ano)", type: "month" },
    {
      value: "tipo_registro",
      label: "Tipo de Registro",
      type: "select",
      options: [
        { value: "TOMADO", label: "Tomado" },
        { value: "PRESTADO", label: "Prestado" }
      ]
    },
    { value: "cnpj_tomador", label: "CNPJ Tomador", type: "text" },
    { value: "municipio_tomador", label: "Município Tomador", type: "text" },
    { value: "estado_tomador", label: "Estado Tomador", type: "text" },
    { value: "im_tomador", label: "IM Tomador", type: "text" },
    { value: "cnpj_prestador", label: "CNPJ Prestador", type: "text" },
    { value: "municipio_prestador", label: "Município Prestador", type: "text" },
    { value: "estado_prestador", label: "Estado Prestador", type: "text" },
    { value: "im_prestador", label: "IM Prestador", type: "text" },
    { value: "numero_nota", label: "Número da Nota", type: "text" },
    { value: "data_nota", label: "Data da Nota", type: "date" },
    { value: "codigo_servico", label: "Código do Serviço", type: "text" },
    { value: "faturamento", label: "Faturamento", type: "text" },
    { value: "base_calculo", label: "Base de Cálculo", type: "text" },
    { value: "aliquota", label: "Alíquota", type: "text" },
    { value: "multa", label: "Multa", type: "text" },
    { value: "juros", label: "Juros", type: "text" },
    { value: "taxa", label: "Taxa", type: "text" },
    { value: "vl_issqn", label: "VL. ISSQN", type: "text" },
    {
      value: "iss_retido",
      label: "ISS Retido",
      type: "select",
      options: [
        { value: "Sim", label: "Sim" },
        { value: "Não", label: "Não" }
      ]
    },
    {
      value: "status_empresa",
      label: "Status Empresa",
      type: "select",
      options: [
        { value: "Ativa", label: "Ativa" },
        { value: "Inativa", label: "Inativa" },
        { value: "Suspensa", label: "Suspensa" }
      ]
    },
    {
      value: "status",
      label: "Status Registro",
      type: "select",
      options: [
        { value: "CONCLUIDO", label: "Concluído" },
        { value: "PENDENTE", label: "Pendente" },
        { value: "ERRO_SISTEMA", label: "Erro de Sistema" },
        { value: "ERRO_LOGIN", label: "Erro de login" },
        { value: "MODULO_NAO_HABILITADO", label: "Módulo não habilitado" },
        { value: "SEM_ACESSO", label: "Sem acesso" },
        { value: "SEM_MOVIMENTO", label: "Sem movimento" },
        { value: "PENDENCIA", label: "Pendência" }
      ]
    },
    { value: "historico", label: "Observação", type: "text" },
    { value: "vcto_guias_iss_proprio", label: "Vencimento da Guia", type: "date" },
    { value: "data_emissao", label: "Data de Emissão", type: "date" },
    { value: "qtd", label: "Quantidade de Nota", type: "text" },
    { value: "responsavel", label: "Responsável", type: "text" }
  ];

  const fetchData = async () => {
    try {
      const account = await authService.getAccount();
      setUser(account);

      const teamId = account.teamId;
      if (!teamId) throw new Error("Usuário não está em nenhum time");

      const docs = await registersService.getDocumentsByTeam(teamId);
      setAllDocuments(docs.documents || []);

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

  // KPIs e stats baseados no filtro
  const stats = useMemo(() => {
    const concluido = filteredDocs.filter(doc => doc.status === 'CONCLUIDO').length;
    const erro_login = filteredDocs.filter(doc => doc.status === 'ERRO_LOGIN').length;
    const erro_sistema = filteredDocs.filter(doc => doc.status === 'ERRO_SISTEMA').length;
    const modulo_nao_habilitado = filteredDocs.filter(doc => doc.status === 'MODULO_NAO_HABILITADO').length;
    const sem_acesso = filteredDocs.filter(doc => doc.status === 'SEM_ACESSO').length;
    const pendencia = filteredDocs.filter(doc => doc.status === 'PENDENCIA').length;
    const sem_movimento = filteredDocs.filter(doc => doc.status === 'SEM_MOVIMENTO').length;
    const revenue = filteredDocs.reduce((sum, doc) => sum + (doc.faturamento || 0), 0);

    return {
      total: filteredDocs.length,
      concluido,
      erro_login,
      erro_sistema,
      modulo_nao_habilitado,
      sem_acesso,
      pendencia,
      sem_movimento,
      revenue
    };
  }, [filteredDocs]);


  // Atualiza alerta de pendência conforme filtro
  useEffect(() => {
    setShowAlert(stats.pendencia > 0);
  }, [stats.pendencia]);

  // Agrupar dados para o gráfico de faturamento
  const getGroupedDates = () => {
    const groupedData: { [key: string]: number } = {};

    filteredDocs.forEach(doc => {
      if (doc.competencia && doc.faturamento) {
        let key = doc.competencia.slice(0, 7); // YYYY-MM

        if (groupBy === "quarter") {
          const [year, month] = key.split('-').map(Number);
          const quarter = Math.floor(((month || 1) - 1) / 3) + 1;
          key = `T${quarter} ${year}`;
        } else if (groupBy === "year") {
          key = key.slice(0, 4); // YYYY
        }
        // groupBy === "month" já está em YYYY-MM

        groupedData[key] = (groupedData[key] || 0) + doc.faturamento;
      }
    });

    return groupedData;
  };

  // Dados para gráficos

  const faturamentoPorPeriodo = getGroupedDates();
  const faturamentoPeriodoLabels = Object.keys(faturamentoPorPeriodo).sort((a, b) => {
    if (groupBy === "month" || groupBy === "year") {
      return a.localeCompare(b); // YYYY-MM ou YYYY ordena corretamente como string
    } else if (groupBy === "quarter") {
      // Exemplo de key: T1 2024
      const [qa, ya] = a.split(' ');
      const [qb, yb] = b.split(' ');
      if (ya !== yb) return parseInt(ya) - parseInt(yb);
      return parseInt(qa.substring(1)) - parseInt(qb.substring(1));
    }
    return 0;
  });

  const faturamentoPeriodoData = faturamentoPeriodoLabels.map(period => faturamentoPorPeriodo[period]);
  const averageRevenue =
    faturamentoPeriodoData.length > 0
      ? faturamentoPeriodoData.reduce((a, b) => a + b, 0) / faturamentoPeriodoData.length
      : 0;
  // Dados para mapa de estados
  const stateData = useMemo(() => {
    const stateCount: Record<string, number> = {};
    filteredDocs.forEach(doc => {
      let estado = "";
      if (doc.tipo_registro === "TOMADO") {
        estado = doc.estado_tomador || "";
      } else if (doc.tipo_registro === "PRESTADO") {
        estado = doc.estado_prestador || "";
      }
      if (estado) {
        estado = estado.toUpperCase();
        stateCount[estado] = (stateCount[estado] || 0) + 1;
      }
    });
    return Object.entries(stateCount).map(([estado, count]) => ({
      estado,
      count
    }));
  }, [filteredDocs]);

  // Dados para treemap de faturamento por empresa
  const revenueByCompany = useMemo(() => {
    const companyRevenue: Record<string, number> = {};
    filteredDocs.forEach(doc => {
      if (doc.empresa && doc.faturamento) {
        companyRevenue[doc.empresa] = (companyRevenue[doc.empresa] || 0) + doc.faturamento;
      }
    });
    return Object.entries(companyRevenue).map(([empresa, revenue]) => ({
      x: empresa,
      y: revenue
    }));
  }, [filteredDocs]);

  // Dados para timeline de status
  const statusTimelineData = useMemo(() => {
    const timeline: Record<string, Record<string, number>> = {};

    filteredDocs.forEach(doc => {
      if (doc.competencia && doc.status) {
        // doc.competencia deve estar no formato YYYY-MM ou YYYY-MM-DD
        let key = doc.competencia.slice(0, 7); // YYYY-MM

        if (groupBy === "quarter") {
          const [year, month] = key.split('-').map(Number);
          const quarter = Math.floor(((month || 1) - 1) / 3) + 1;
          key = `T${quarter} ${year}`;
        } else if (groupBy === "year") {
          key = key.slice(0, 4); // YYYY
        }
        // groupBy === "month" já está em YYYY-MM

        if (!timeline[key]) timeline[key] = {};
        timeline[key][doc.status] = (timeline[key][doc.status] || 0) + 1;
      }
    });

    return Object.entries(timeline)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, statusCounts]) => ({
        period,
        ...statusCounts
      }));
  }, [filteredDocs, groupBy]);

  // Dados para histograma de alíquotas
  const aliquotaData = useMemo(() => {
    const aliquotes = filteredDocs
      .filter(doc => doc.aliquota)
      .map(doc => parseFloat(doc.aliquota));

    if (aliquotes.length === 0) return [];

    const min = Math.min(...aliquotes);
    const max = Math.max(...aliquotes);
    const step = (max - min) / 5;

    const bins: Record<string, number> = {};
    for (let i = 0; i < 5; i++) {
      const lower = min + (i * step);
      const upper = lower + step;
      bins[`${lower.toFixed(2)}-${upper.toFixed(2)}`] = 0;
    }

    aliquotes.forEach(value => {
      for (const range in bins) {
        const [lower, upper] = range.split('-').map(parseFloat);
        if (value >= lower && value < upper) {
          bins[range]++;
          break;
        }
      }
    });

    return Object.entries(bins).map(([range, count]) => ({
      range,
      count
    }));
  }, [filteredDocs]);

  useEffect(() => {
    fetchData();
  }, []);

  // KPIs disponíveis
  const kpiList: {
    key: KPIKey;
    label: string;
    icon: JSX.Element;
    color: string;
    formatter?: (value: number) => string;
  }[] = [
      { key: "total", label: "Total de Registros", icon: <FiFileText />, color: "bg-pink-100 text-pink-800" },
      { key: "concluido", label: "Concluídos", icon: <FiCheck />, color: "bg-green-100 text-green-800" },
      { key: "pendencia", label: "Pendência", icon: <BsFillExclamationTriangleFill />, color: "bg-red-100 text-red-800" },
      { key: "erro_login", label: "Erro de login", icon: <MdNoAccounts />, color: "bg-orange-100 text-orange-800" },
      { key: "erro_sistema", label: "Erro de Sistema", icon: <MdCloudOff />, color: "bg-yellow-200 text-yellow-800" },
      { key: "modulo_nao_habilitado", label: "Módulo não habilitado", icon: <FiSettings />, color: "bg-indigo-100 text-indigo-800" },
      { key: "sem_movimento", label: "Sem movimento", icon: <MdOutlineDoNotDisturbAlt />, color: "bg-gray-100 text-gray-800" },
      { key: "sem_acesso", label: "Sem acesso", icon: <FiX />, color: "bg-cyan-100 text-cyan-800" },
      {
        key: "revenue",
        label: "Faturamento Total",
        icon: <FiTrendingUp />,
        color: "bg-green-100 text-green-800",
        formatter: (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      }
    ];

  // Notificação visual
  useEffect(() => {
    if (showAlert) {
      toast.warn(
        <div>
          <p className="font-medium">Alerta de Pendências!</p>
          <p>Há {stats.pendencia} registros pendentes</p>
          <Link href="/registros?status=PENDENTE" className="text-blue-600 underline">Ver detalhes</Link>
        </div>,
        { autoClose: 1000 }
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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Head>
        <title>Dashboard Avançado - Gestão de Filiais</title>
        <meta name="description" content="Painel de controle avançado para gestão de filiais e registros fiscais" />
      </Head>

      <header className={`bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg ${theme === 'dark' ? 'border-b border-gray-700' : ''}`}>
        <DashboardHeader />
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Alertas e Notificações */}
        {showAlert && (
          <div className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${theme === 'dark' ? 'bg-yellow-900 text-yellow-200 border-yellow-700' : 'bg-yellow-100 text-yellow-800 border-yellow-500'} border-l-4`}>
            <FiBell size={20} />
            <div>
              <p className="font-medium">Atenção!</p>
              <p>Há {stats.pendencia} registros pendentes. <Link href="/registros?status=PENDENTE" className="underline">Ver detalhes</Link></p>
            </div>
          </div>
        )}

        {/* Configurações do Dashboard */}
        <div
          className={`p-4 rounded-lg mb-6 shadow-sm border
    ${theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
            }`
          }
        >
          <h2 className={`text-lg font-medium mb-4 flex items-center gap-2
    ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
            <FiSettings /> Configurações do Dashboard
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormControl fullWidth>
              <InputLabel
                sx={{
                  color: theme === 'dark' ? '#e5e7eb' : undefined,
                  '&.Mui-focused': { color: theme === 'dark' ? '#60a5fa' : undefined }
                }}
              >
                Agrupar por
              </InputLabel>
              <Select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as "month" | "quarter" | "year")}
                label="Agrupar por"
                sx={{
                  color: theme === 'dark' ? '#e5e7eb' : undefined,
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: theme === 'dark' ? '#374151' : undefined
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme === 'dark' ? '#60a5fa' : undefined
                  },
                  background: theme === 'dark' ? '#1f2937' : undefined
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: theme === 'dark' ? '#1f2937' : '#fff',
                      color: theme === 'dark' ? '#e5e7eb' : '#111'
                    }
                  }
                }}
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
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: theme === 'dark' ? '#60a5fa' : undefined
                      }
                    }}
                  />
                }
                label={
                  <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}>
                    Mostrar valores nos gráficos
                  </span>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showTrendLine}
                    onChange={() => setShowTrendLine(!showTrendLine)}
                    color="primary"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: theme === 'dark' ? '#60a5fa' : undefined
                      }
                    }}
                  />
                }
                label={
                  <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}>
                    Mostrar linha de tendência
                  </span>
                }
              />
            </div>
          </div>
        </div>

        {/* Filtro Avançado de Registros */}
        <div className={`p-6 rounded-xl shadow-sm border mb-8 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
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
          <h2 className={`text-lg font-medium mb-2 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
            <FiBarChart2 /> Indicadores (KPIs)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiList.filter(kpi => selectedKPIs.includes(kpi.key)).map(kpi => (
              <div key={kpi.key} className={`flex items-center gap-4 p-4 rounded-xl shadow-sm border ${kpi.color} ${theme === 'dark' ? 'border-gray-700' : ''}`}>
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

        {/* Navegação de Gráficos */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActiveChart("status")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeChart === "status" ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            <FiPieChart /> Status
          </button>
          <button
            onClick={() => setActiveChart("revenue")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeChart === "revenue" ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            <FiTrendingUp /> Faturamento
          </button>
          <button
            onClick={() => setActiveChart("state")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeChart === "state" ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            <FiMap /> Estados
          </button>
          <button
            onClick={() => setActiveChart("treemap")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeChart === "treemap" ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            <FiLayers /> Empresas
          </button>
          <button
            onClick={() => setActiveChart("timeline")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeChart === "timeline" ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            <FiClock /> Timeline
          </button>
          <button
            onClick={() => setActiveChart("histogram")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeChart === "histogram" ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            <FiBarChart2 /> Alíquotas
          </button>
        </div>

        {/* Gráficos Dinâmicos */}
        {activeChart === "status" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className={`p-6 rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <StatusDonutChart
                key={JSON.stringify(stats) + theme + showDataLabels}
                stats={stats}
                theme={theme}
                showDataLabels={showDataLabels}
              />
            </div>
            <div className={`p-6 rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <StatusBarChart
                key={JSON.stringify(stats) + theme + showDataLabels}
                stats={stats}
                theme={theme}
                showDataLabels={showDataLabels}
              />
            </div>
          </div>
        )}

        {activeChart === "revenue" && (
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className={`p-6 rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <RevenueChart
                key={
                  JSON.stringify(faturamentoPeriodoLabels) +
                  JSON.stringify(faturamentoPeriodoData) +
                  theme +
                  showDataLabels +
                  showTrendLine
                }
                data={{
                  labels: faturamentoPeriodoLabels,
                  values: faturamentoPeriodoData
                }}
                theme={theme}
                showDataLabels={showDataLabels}
                showTrendLine={showTrendLine}
                averageRevenue={averageRevenue}
              />
            </div>
          </div>
        )}

        {activeChart === "state" && (
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className={`p-6 rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <StateMapChart
                key={JSON.stringify(stateData) + theme}
                data={stateData}
                theme={theme}
              />
            </div>
          </div>
        )}

        {activeChart === "treemap" && (
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className={`p-6 rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <RevenueTreemapChart
                key={JSON.stringify(revenueByCompany) + theme}
                data={revenueByCompany}
                theme={theme}
              />
            </div>
          </div>
        )}

        {activeChart === "timeline" && (
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className={`p-6 rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <StatusTimelineChart
                key={JSON.stringify(statusTimelineData) + theme + groupBy}
                data={statusTimelineData}
                theme={theme}
                groupBy={groupBy}
              />
            </div>
          </div>
        )}

        {activeChart === "histogram" && (
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className={`p-6 rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <AliquotaHistogramChart
                data={aliquotaData}
                theme={theme}
              />
            </div>
          </div>
        )}

        {/* Últimas Atividades */}
        <div className="mb-8">
          <h2 className={`text-lg font-semibold mb-6 flex items-center gap-2 
    ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            <FiActivity className="text-blue-500" /> Últimas Atividades
          </h2>
          <div className={`
    rounded-2xl shadow border
    ${theme === 'dark'
              ? 'bg-[#181a20] border-[#232c3b]'
              : 'bg-white border-[#e5e7eb]'}
    p-0
  `}>
            {recentActivities.length === 0 ? (
              <div className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} text-center py-12`}>
                Nenhuma atividade recente encontrada.
              </div>
            ) : (
              <ul>
                {recentActivities.map((activity) => (
                  <li
                    key={activity.$id}
                    className={`
              flex flex-col sm:flex-row items-start sm:items-center gap-4 px-6 py-5 border-b last:border-b-0
              ${theme === 'dark'
                        ? 'border-[#232c3b] hover:bg-[#232c3b]'
                        : 'border-[#f1f5f9] hover:bg-blue-50'}
              transition
            `}
                  >
                    {/* Status Icon */}
                    <Tooltip title={activity.status || "Sem status"}>
                      <span
                        className="rounded-full p-2 flex items-center justify-center shadow"
                        style={{
                          background: (STATUS_LABELS.find(s => s.key === (activity.status?.toLowerCase() || ""))?.color || "#cbd5e1") + "22"
                        }}
                      >
                        {STATUS_LABELS.find(s => s.key === (activity.status?.toLowerCase() || ""))?.icon || <FiFileText />}
                      </span>
                    </Tooltip>
                    {/* Empresa e detalhes */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`font-semibold text-base truncate max-w-[180px] 
                  ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {activity.empresa || "Empresa desconhecida"}
                        </span>
                        {activity.loja && (
                          <span className={`text-xs px-2 py-0.5 rounded 
                    ${theme === 'dark' ? 'bg-[#232c3b] text-gray-300' : 'bg-[#f1f5f9] text-gray-600'}`}>
                            {`Loja: ${activity.loja}`}
                          </span>
                        )}
                        {activity.municipio && (
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>
                            {activity.municipio}
                          </span>
                        )}
                      </div>
                      <div className={`flex flex-wrap items-center gap-4 text-xs 
                ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {activity.status && (
                          <span>
                            <span className="font-medium">Status:</span>{" "}
                            {STATUS_LABELS.find(s => s.key.toLowerCase() === activity.status.toLowerCase())?.label || activity.status}
                          </span>
                        )}
                        {activity.faturamento && (
                          <span>
                            <span className="font-medium">Faturamento:</span>{" "}
                            {Number(activity.faturamento).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Responsável */}
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: "#2563eb",
                          fontSize: 16,
                          fontWeight: 700,
                        }}
                        src={activity.responsavelFoto || undefined}
                      >
                        {activity.responsavel
                          ? activity.responsavel.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                          : "?"}
                      </Avatar>
                      <div className="flex flex-col">
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Responsável</span>
                        <span className={`font-medium text-sm truncate max-w-[90px] 
                  ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                          {activity.responsavel || "Não informado"}
                        </span>
                      </div>
                    </div>
                    {/* Data */}
                    <div className={`text-xs whitespace-nowrap min-w-[90px] 
              ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {activity.$updatedAt ? formatDate(activity.$updatedAt) : ""}
                    </div>
                    {/* Botão Ver detalhes */}
                    <Link
                      href={`/registros/edit/${activity.$id}`}
                      className={`
                flex items-center gap-2 px-4 py-1.5 rounded-full
                font-semibold text-xs shadow-sm ml-auto transition
                ${theme === 'dark'
                          ? 'bg-blue-600 text-white hover:bg-blue-500 border border-blue-500'
                          : 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-500'}
              `}
                      style={{ minWidth: 120, justifyContent: 'center' }}
                    >
                      <FiFileText size={15} />
                      Ver detalhes
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}