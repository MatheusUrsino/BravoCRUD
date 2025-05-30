import { FiMapPin, FiDollarSign, FiCalendar, FiUser, FiFileText } from "react-icons/fi";
import { Models } from "appwrite";
import { useTheme } from "@/context/ThemeContext";

interface RegistrosTableExpandedRowProps {
  data: Models.Document;
  userNames: Record<string, string>;
}

const statusOptions = [
  { value: "", label: "Selecione..." },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "ERRO_SISTEMA", label: "Erro de Sistema" },
  { value: "ERRO_LOGIN", label: "Erro de login" },
  { value: "MODULO_NAO_HABILITADO", label: "Módulo de escrituração não habilitado" },
  { value: "SEM_ACESSO", label: "Sem acesso" },
  { value: "SEM_MOVIMENTO", label: "Sem movimento" },
  { value: "PENDENCIA", label: "Pendência" },
];

// Função para buscar o label do status
const getStatusLabel = (statusValue: string) => {
  const status = statusOptions.find(option => option.value === statusValue);
  return status ? status.label : statusValue;
};

/**
 * Formata um CNPJ (adiciona pontuação)
 * @param cnpj - String contendo o CNPJ (com ou sem formatação)
 * @returns CNPJ formatado (00.000.000/0000-00)
 */
const formatCNPJ = (cnpj: string): string => {
  if (!cnpj) return "";
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
};

/**
 * Formata competência para MM/YYYY ou YYYY-MM
 */
const formatCompetencia = (competencia: string): string => {
  if (!competencia) return "";
  // Aceita formatos "2024-06-01T00:00:00.000Z" ou "2024-06"
  const match = competencia.match(/^(\d{4})-(\d{2})/);
  if (!match) return competencia;
  return `${match[2]}/${match[1]}`; // MM/YYYY
};

/**
 * Formata valores monetários
 * @param value - Valor numérico ou string
 * @returns Valor formatado (R$ 1.234,56)
 */
const formatCurrency = (value: number | string): string => {
  if (value === null || value === undefined || value === '') return '';

  const num = typeof value === 'string'
    ? parseFloat(value.replace(/[^\d]/g, '')) / 100
    : value;

  if (isNaN(num)) return '';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(num);
};

/**
 * Formata datas para o padrão brasileiro (dd/mm/aaaa)
 * @param dateString - Data em formato ISO ou string reconhecível
 * @returns Data formatada
 */
const formatDateToBR = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('pt-BR');
};

/**
 * Formata valores percentuais
 * @param value - Valor numérico ou string
 * @returns Valor formatado (ex: "12,34%")
 */
const formatPercentage = (value: number | string): string => {
  if (!value && value !== 0) return '';
  let num = typeof value === 'string'
    ? parseFloat(value.replace(/[^\d.,-]/g, '').replace(',', '.'))
    : value;
  if (isNaN(num)) return '';
  if (Math.abs(num) < 1) num = num * 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: num % 1 !== 0 ? 2 : 0
  }).format(num / 100);
};

export const RegistrosTableExpandedRow = ({
  data,
  userNames
}: RegistrosTableExpandedRowProps) => {
  const { theme } = useTheme();
  return (
    <tr>
      <td
        colSpan={9}
        style={{
          padding: 0,
          background: theme === "dark" ? "#18181b" : "#f4f6fa"
        }}
      >
        <div
          style={{
            padding: "32px",
            background:
              theme === "dark"
                ? "linear-gradient(135deg, #1e293b 60%, #0f172a 100%)"
                : "linear-gradient(135deg, #e0e7ff 60%, #f0f6ff 100%)",
            borderRadius: "16px",
            margin: "1px 0",
            boxShadow: theme === "dark"
              ? "0 4px 24px 0 rgba(30,58,138,0.18)"
              : "0 4px 24px 0 rgba(59,130,246,0.08)",
            border: theme === "dark" ? "1px solid #334155" : "1px solid #c7d2fe"
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "40px",
              justifyContent: "space-between"
            }}
          >
            {/* Seção Informações Básicas */}
            <div style={{
              minWidth: 240,
              background: theme === "dark" ? "#1e293b" : "#f8fafc",
              borderRadius: 12,
              padding: "20px",
              boxShadow: theme === "dark"
                ? "0 2px 8px 0 rgba(59,130,246,0.10)"
                : "0 2px 8px 0 rgba(59,130,246,0.04)",
              flex: "1 1 240px"
            }}>
              <h4 style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
                color: theme === "dark" ? "#60a5fa" : "#1e40af",
                fontWeight: 700,
                fontSize: 18
              }}>
                <FiMapPin color={theme === "dark" ? "#60a5fa" : "#2563eb"} /> Informações Básicas
              </h4>
              <ul style={{ fontSize: 15, color: theme === "dark" ? "#bae6fd" : "#1e293b", listStyle: "none", padding: 0, margin: 0 }}>
                <li><span style={{ fontWeight: 500 }}>Empresa:</span> {data.empresa}</li>
                <li><span style={{ fontWeight: 500 }}>Loja:</span> {data.loja}</li>
                <li><span style={{ fontWeight: 500 }}>Doc SAP:</span> {data.docSap}</li>
                <li><span style={{ fontWeight: 500 }}>Competência:</span> {formatCompetencia(data.competencia)}</li>
                <li><span style={{ fontWeight: 500 }}>Tipo Registro:</span> {data.tipo_registro}</li>
                <li><span style={{ fontWeight: 500 }}>Status Empresa:</span> {getStatusLabel(data.status_empresa)}</li>
              </ul>
            </div>

            {/* Seção Tomador */}
            <div style={{
              minWidth: 240,
              background: theme === "dark" ? "#1e293b" : "#f8fafc",
              borderRadius: 12,
              padding: "20px",
              boxShadow: theme === "dark"
                ? "0 2px 8px 0 rgba(59,130,246,0.10)"
                : "0 2px 8px 0 rgba(59,130,246,0.04)",
              flex: "1 1 240px"
            }}>
              <h4 style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
                color: theme === "dark" ? "#818cf8" : "#1e40af",
                fontWeight: 700,
                fontSize: 18
              }}>
                <FiUser color={theme === "dark" ? "#818cf8" : "#6366f1"} /> Dados do Tomador
              </h4>
              <ul style={{ fontSize: 15, color: theme === "dark" ? "#bae6fd" : "#1e293b", listStyle: "none", padding: 0, margin: 0 }}>
                <li><span style={{ fontWeight: 500 }}>CNPJ:</span> {formatCNPJ(data.cnpj_tomador)}</li>
                <li><span style={{ fontWeight: 500 }}>Município:</span> {data.municipio_tomador}</li>
                <li><span style={{ fontWeight: 500 }}>Estado:</span> {data.estado_tomador}</li>
                <li><span style={{ fontWeight: 500 }}>I.M:</span> {data.im_tomador}</li>
              </ul>
            </div>

            {/* Seção Prestador */}
            <div style={{
              minWidth: 240,
              background: theme === "dark" ? "#1e293b" : "#f8fafc",
              borderRadius: 12,
              padding: "20px",
              boxShadow: theme === "dark"
                ? "0 2px 8px 0 rgba(59,130,246,0.10)"
                : "0 2px 8px 0 rgba(59,130,246,0.04)",
              flex: "1 1 240px"
            }}>
              <h4 style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
                color: theme === "dark" ? "#5eead4" : "#1e40af",
                fontWeight: 700,
                fontSize: 18
              }}>
                <FiUser color={theme === "dark" ? "#5eead4" : "#14b8a6"} /> Dados do Prestador
              </h4>
              <ul style={{ fontSize: 15, color: theme === "dark" ? "#bae6fd" : "#1e293b", listStyle: "none", padding: 0, margin: 0 }}>
                <li><span style={{ fontWeight: 500 }}>CNPJ:</span> {formatCNPJ(data.cnpj_prestador)}</li>
                <li><span style={{ fontWeight: 500 }}>Município:</span> {data.municipio_prestador}</li>
                <li><span style={{ fontWeight: 500 }}>Estado:</span> {data.estado_prestador}</li>
                <li><span style={{ fontWeight: 500 }}>I.M:</span> {data.im_prestador}</li>
              </ul>
            </div>

            {/* Seção Nota Fiscal */}
            <div style={{
              minWidth: 240,
              background: theme === "dark" ? "#1e293b" : "#f8fafc",
              borderRadius: 12,
              padding: "20px",
              boxShadow: theme === "dark"
                ? "0 2px 8px 0 rgba(59,130,246,0.10)"
                : "0 2px 8px 0 rgba(59,130,246,0.04)",
              flex: "1 1 240px"
            }}>
              <h4 style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
                color: theme === "dark" ? "#38bdf8" : "#1e40af",
                fontWeight: 700,
                fontSize: 18
              }}>
                <FiFileText color={theme === "dark" ? "#38bdf8" : "#2563eb"} /> Dados da Nota
              </h4>
              <ul style={{ fontSize: 15, color: theme === "dark" ? "#bae6fd" : "#1e293b", listStyle: "none", padding: 0, margin: 0 }}>
                <li><span style={{ fontWeight: 500 }}>Número:</span> {data.numero_nota}</li>
                <li><span style={{ fontWeight: 500 }}>Data:</span> {formatDateToBR(data.data_nota)}</li>
                <li><span style={{ fontWeight: 500 }}>Código Serviço:</span> {data.codigo_servico}</li>
                <li><span style={{ fontWeight: 500 }}>ISS Retido:</span> {data.iss_retido ? "Sim" : "Não"}</li>
                <li><span style={{ fontWeight: 500 }}>Quantidade:</span> {data.qtd}</li>
              </ul>
            </div>

            {/* Seção Financeiro */}
            <div style={{
              minWidth: 240,
              background: theme === "dark" ? "#1e293b" : "#f8fafc",
              borderRadius: 12,
              padding: "20px",
              boxShadow: theme === "dark"
                ? "0 2px 8px 0 rgba(59,130,246,0.10)"
                : "0 2px 8px 0 rgba(59,130,246,0.04)",
              flex: "1 1 240px"
            }}>
              <h4 style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
                color: theme === "dark" ? "#f472b6" : "#1e40af",
                fontWeight: 700,
                fontSize: 18
              }}>
                <FiDollarSign color={theme === "dark" ? "#f472b6" : "#db2777"} /> Dados Financeiros
              </h4>
              <ul style={{ fontSize: 15, color: theme === "dark" ? "#bae6fd" : "#1e293b", listStyle: "none", padding: 0, margin: 0 }}>
                <li><span style={{ fontWeight: 500 }}>Faturamento:</span> {formatCurrency(data.faturamento)}</li>
                <li><span style={{ fontWeight: 500 }}>Base Cálculo:</span> {formatCurrency(data.base_calculo)}</li>
                <li><span style={{ fontWeight: 500 }}>Alíquota:</span> {formatPercentage(data.aliquota)}</li>
                <li><span style={{ fontWeight: 500 }}>Multa:</span> {formatCurrency(data.multa)}</li>
                <li><span style={{ fontWeight: 500 }}>Juros:</span> {formatCurrency(data.juros)}</li>
                <li><span style={{ fontWeight: 500 }}>Taxa:</span> {formatCurrency(data.taxa)}</li>
                <li><span style={{ fontWeight: 500 }}>Valor ISSQN:</span> {formatCurrency(data.vl_issqn)}</li>
              </ul>
            </div>

            {/* Seção Outras Informações */}
            <div style={{
              minWidth: 240,
              background: theme === "dark" ? "#1e293b" : "#f8fafc",
              borderRadius: 12,
              padding: "20px",
              boxShadow: theme === "dark"
                ? "0 2px 8px 0 rgba(59,130,246,0.10)"
                : "0 2px 8px 0 rgba(59,130,246,0.04)",
              flex: "1 1 240px"
            }}>
              <h4 style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
                color: theme === "dark" ? "#60a5fa" : "#1e40af",
                fontWeight: 700,
                fontSize: 18
              }}>
                <FiCalendar color={theme === "dark" ? "#60a5fa" : "#2563eb"} /> Outras Informações
              </h4>
              <ul style={{ fontSize: 15, color: theme === "dark" ? "#bae6fd" : "#1e293b", listStyle: "none", padding: 0, margin: 0 }}>
                <li><span style={{ fontWeight: 500 }}>Vencimento:</span> {formatDateToBR(data.vcto_guias_iss_proprio)}</li>
                <li><span style={{ fontWeight: 500 }}>Emissão:</span> {formatDateToBR(data.data_emissao)}</li>
                <li><span style={{ fontWeight: 500 }}>Status:</span> {getStatusLabel(data.status)}</li>
                <li><span style={{ fontWeight: 500 }}>Histórico:</span> {data.historico}</li>
                <li style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <FiUser size={16} color={theme === "dark" ? "#60a5fa" : "#2563eb"} />
                  <span style={{ fontWeight: 500 }}>Responsável:</span>
                  {userNames[data.$updatedBy] ?? data.$createdBy ?? data.responsavel}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};