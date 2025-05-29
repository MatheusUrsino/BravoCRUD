import { FiMapPin, FiDollarSign, FiCalendar, FiUser, FiFileText } from "react-icons/fi";
import { Models } from "appwrite";

interface RegistrosTableExpandedRowProps {
  data: Models.Document;
  userNames: Record<string, string>;
}

// Função utilitária para remover o horário de uma data no formato ISO ou yyyy-mm-ddTHH:mm:ss
function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  // Aceita tanto yyyy-mm-dd quanto yyyy-mm-ddTHH:mm:ss
  return dateStr.split("T")[0];
}

export const RegistrosTableExpandedRow = ({
  data,
  userNames
}: RegistrosTableExpandedRowProps) => {
  return (
    <tr>
      <td colSpan={9} style={{ padding: 0, background: "#f4f6fa" }}>
        <div
          style={{
            padding: "32px",
            background: "linear-gradient(135deg, #f9fafb 60%, #e2e8f0 100%)",
            borderRadius: "16px",
            margin: "16px 0",
            boxShadow: "0 4px 24px 0 rgba(44,62,80,0.08)",
            border: "1px solid #e2e8f0"
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
              background: "#fff",
              borderRadius: 12,
              padding: "20px",
              boxShadow: "0 2px 8px 0 rgba(44,62,80,0.04)",
              flex: "1 1 240px"
            }}>
              <h4 style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
                color: "#2d3748",
                fontWeight: 700,
                fontSize: 18
              }}>
                <FiMapPin color="#3182ce" /> Informações Básicas
              </h4>
              <ul style={{ fontSize: 15, color: "#4a5568", listStyle: "none", padding: 0, margin: 0 }}>
                <li><span style={{ fontWeight: 500 }}>Empresa:</span> {data.empresa}</li>
                <li><span style={{ fontWeight: 500 }}>Loja:</span> {data.loja}</li>
                <li><span style={{ fontWeight: 500 }}>Doc SAP:</span> {data.docSap}</li>
                <li><span style={{ fontWeight: 500 }}>Tipo Registro:</span> {data.tipo_registro}</li>
                <li><span style={{ fontWeight: 500 }}>Status Empresa:</span> {data.status_empresa}</li>
              </ul>
            </div>

            {/* Seção Tomador */}
            <div style={{
              minWidth: 240,
              background: "#fff",
              borderRadius: 12,
              padding: "20px",
              boxShadow: "0 2px 8px 0 rgba(44,62,80,0.04)",
              flex: "1 1 240px"
            }}>
              <h4 style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
                color: "#2d3748",
                fontWeight: 700,
                fontSize: 18
              }}>
                <FiUser color="#805ad5" /> Dados do Tomador
              </h4>
              <ul style={{ fontSize: 15, color: "#4a5568", listStyle: "none", padding: 0, margin: 0 }}>
                <li><span style={{ fontWeight: 500 }}>CNPJ:</span> {data.cnpj_tomador}</li>
                <li><span style={{ fontWeight: 500 }}>Município:</span> {data.municipio_tomador}</li>
                <li><span style={{ fontWeight: 500 }}>Estado:</span> {data.estado_tomador}</li>
                <li><span style={{ fontWeight: 500 }}>I.M:</span> {data.im_tomador}</li>
              </ul>
            </div>

            {/* Seção Prestador */}
            <div style={{
              minWidth: 240,
              background: "#fff",
              borderRadius: 12,
              padding: "20px",
              boxShadow: "0 2px 8px 0 rgba(44,62,80,0.04)",
              flex: "1 1 240px"
            }}>
              <h4 style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
                color: "#2d3748",
                fontWeight: 700,
                fontSize: 18
              }}>
                <FiUser color="#38a169" /> Dados do Prestador
              </h4>
              <ul style={{ fontSize: 15, color: "#4a5568", listStyle: "none", padding: 0, margin: 0 }}>
                <li><span style={{ fontWeight: 500 }}>CNPJ:</span> {data.cnpj_prestador}</li>
                <li><span style={{ fontWeight: 500 }}>Município:</span> {data.municipio_prestador}</li>
                <li><span style={{ fontWeight: 500 }}>Estado:</span> {data.estado_prestador}</li>
                <li><span style={{ fontWeight: 500 }}>I.M:</span> {data.im_prestador}</li>
              </ul>
            </div>

            {/* Seção Nota Fiscal */}
            <div style={{
              minWidth: 240,
              background: "#fff",
              borderRadius: 12,
              padding: "20px",
              boxShadow: "0 2px 8px 0 rgba(44,62,80,0.04)",
              flex: "1 1 240px"
            }}>
              <h4 style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
                color: "#2d3748",
                fontWeight: 700,
                fontSize: 18
              }}>
                <FiFileText color="#e53e3e" /> Dados da Nota
              </h4>
              <ul style={{ fontSize: 15, color: "#4a5568", listStyle: "none", padding: 0, margin: 0 }}>
                <li><span style={{ fontWeight: 500 }}>Número:</span> {data.numero_nota}</li>
                <li><span style={{ fontWeight: 500 }}>Data:</span> {formatDate(data.data_nota)}</li>
                <li><span style={{ fontWeight: 500 }}>Código Serviço:</span> {data.codigo_servico}</li>
                <li><span style={{ fontWeight: 500 }}>ISS Retido:</span> {data.iss_retido}</li>
                <li><span style={{ fontWeight: 500 }}>Quantidade:</span> {data.qtd}</li>
              </ul>
            </div>

            {/* Seção Financeiro */}
            <div style={{
              minWidth: 240,
              background: "#fff",
              borderRadius: 12,
              padding: "20px",
              boxShadow: "0 2px 8px 0 rgba(44,62,80,0.04)",
              flex: "1 1 240px"
            }}>
              <h4 style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
                color: "#2d3748",
                fontWeight: 700,
                fontSize: 18
              }}>
                <FiDollarSign color="#d69e2e" /> Dados Financeiros
              </h4>
              <ul style={{ fontSize: 15, color: "#4a5568", listStyle: "none", padding: 0, margin: 0 }}>
                <li><span style={{ fontWeight: 500 }}>Faturamento:</span> {data.faturamento}</li>
                <li><span style={{ fontWeight: 500 }}>Base Cálculo:</span> {data.base_calculo}</li>
                <li><span style={{ fontWeight: 500 }}>Alíquota:</span> {data.aliquota}</li>
                <li><span style={{ fontWeight: 500 }}>Multa:</span> {data.multa}</li>
                <li><span style={{ fontWeight: 500 }}>Juros:</span> {data.juros}</li>
                <li><span style={{ fontWeight: 500 }}>Taxa:</span> {data.taxa}</li>
                <li><span style={{ fontWeight: 500 }}>Valor ISSQN:</span> {data.vl_issqn}</li>
              </ul>
            </div>

            {/* Seção Outras Informações */}
            <div style={{
              minWidth: 240,
              background: "#fff",
              borderRadius: 12,
              padding: "20px",
              boxShadow: "0 2px 8px 0 rgba(44,62,80,0.04)",
              flex: "1 1 240px"
            }}>
              <h4 style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
                color: "#2d3748",
                fontWeight: 700,
                fontSize: 18
              }}>
                <FiCalendar color="#3182ce" /> Outras Informações
              </h4>
              <ul style={{ fontSize: 15, color: "#4a5568", listStyle: "none", padding: 0, margin: 0 }}>
                <li><span style={{ fontWeight: 500 }}>Vencimento:</span> {formatDate(data.vcto_guias_iss_proprio)}</li>
                <li><span style={{ fontWeight: 500 }}>Emissão:</span> {formatDate(data.data_emissao)}</li>
                <li><span style={{ fontWeight: 500 }}>Status:</span> {data.status}</li>
                <li><span style={{ fontWeight: 500 }}>Histórico:</span> {data.historico}</li>
                <li style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <FiUser size={16} color="#2b6cb0" />
                  <span style={{ fontWeight: 500 }}>Responsável:</span> {userNames[data.responsavel] ?? data.responsavel}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};