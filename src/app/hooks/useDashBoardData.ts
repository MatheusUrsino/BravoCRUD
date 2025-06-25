import { useEffect, useMemo, useState } from "react";
import { AuthService, RegistersService } from "@/service";
import { Filter, AvailableField } from "@/types/registros";
import { Models } from "appwrite";
import { toast } from "react-toastify";

// Tipos auxiliares
type KPIKey = "total" | "concluido" | "erro_login" | "erro_sistema" | "modulo_nao_habilitado" | "sem_acesso" | "pendencia" | "sem_movimento" | "revenue";
type ChartType = "status" | "revenue" | "state" | "treemap" | "timeline" | "histogram";

export function useDashboardData() {
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
        groupedData[key] = (groupedData[key] || 0) + doc.faturamento;
      }
    });

    return groupedData;
  };

  // Dados para gráficos
  const faturamentoPorPeriodo = getGroupedDates();
  const faturamentoPeriodoLabels = Object.keys(faturamentoPorPeriodo).sort((a, b) => {
    if (groupBy === "month" || groupBy === "year") {
      return a.localeCompare(b);
    } else if (groupBy === "quarter") {
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

  const stateData = useMemo(() => {
    const stateCount: Record<string, number> = {};

    filteredDocs.forEach(doc => {
      const estados = [
        doc.estado_tomador,
        doc.estado_prestador
      ];

      estados.forEach(estado => {
        if (estado) {
          const uf = String(estado).trim().toUpperCase();
          if (uf) {
            stateCount[uf] = (stateCount[uf] || 0) + 1;
          }
        }
      });
    });

    return Object.entries(stateCount)
      .map(([estado, count]) => ({
        estado,
        count
      }))
      .sort((a, b) => a.estado.localeCompare(b.estado));
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
        let key = doc.competencia.slice(0, 7); // YYYY-MM

        if (groupBy === "quarter") {
          const [year, month] = key.split('-').map(Number);
          const quarter = Math.floor(((month || 1) - 1) / 3) + 1;
          key = `T${quarter} ${year}`;
        } else if (groupBy === "year") {
          key = key.slice(0, 4); // YYYY
        }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    user,
    loading,
    allDocuments,
    filteredDocs,
    stats,
    selectedKPIs,
    showAlert,
    setShowAlert,
    groupBy,
    setGroupBy,
    showDataLabels,
    setShowDataLabels,
    showTrendLine,
    setShowTrendLine,
    activeChart,
    setActiveChart,
    filters,
    setFilters,
    newFilterValue,
    setNewFilterValue,
    newFilterField,
    setNewFilterField,
    newFilterType,
    setNewFilterType,
    dateFilterValue,
    setDateFilterValue,
    datePickerOpen,
    setDatePickerOpen,
    availableFields,
    recentActivities,
    faturamentoPorPeriodo,
    faturamentoPeriodoLabels,
    faturamentoPeriodoData,
    averageRevenue,
    stateData,
    revenueByCompany,
    statusTimelineData,
    aliquotaData,
    fetchData
  };
}