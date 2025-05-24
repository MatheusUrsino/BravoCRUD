import { FiMapPin, FiDollarSign, FiCalendar, FiUser, FiFileText } from "react-icons/fi";
import { formatCNPJ, formatCurrency, formatDate } from "@/utils/formatters";
import { Models } from "appwrite";

interface RegistrosTableExpandedRowProps {
  data: Models.Document;
  userNames: Record<string, string>;
}

const adjustTimezone = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return new Date(date.getTime() + (date.getTimezoneOffset() * 60000)).toISOString();
  } catch {
    return '';
  }
};

const formatDateBr = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
};

const parseToCents = (value: number | string | undefined): number | null => {
  if (value === undefined || value === null || value === '') return null;
  
  const num = typeof value === 'string' 
    ? parseFloat(value.replace(',', '.')) 
    : value;
  
  return isNaN(num) ? null : num / 100;
};

export const RegistrosTableExpandedRow = ({ 
  data, 
  userNames
}: RegistrosTableExpandedRowProps) => {
  return (
    <tr className="bg-blue-50">
      <td colSpan={9} className="px-0 py-4">
        <div className="px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Seção Informações Básicas */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 flex items-center gap-2">
                <FiMapPin /> Informações Básicas
              </h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Empresa:</span> {data.empresa || '-'}</p>
                <p><span className="font-medium">Loja:</span> {data.loja || '-'}</p>
                <p><span className="font-medium">Doc SAP:</span> {data.docSap || '-'}</p>
                <p><span className="font-medium">Tipo Registro:</span> {data.tipo_registro || '-'}</p>
                <p><span className="font-medium">Status Empresa:</span>
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                    data.status_empresa === 'Ativa' ? 'bg-green-100 text-green-800' :
                    data.status_empresa === 'Inativa' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {data.status_empresa || '-'}
                  </span>
                </p>
              </div>
            </div>

            {/* Seção Tomador */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 flex items-center gap-2">
                <FiUser /> Dados do Tomador
              </h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">CNPJ:</span> {data.cnpj_tomador ? formatCNPJ(data.cnpj_tomador) : '-'}</p>
                <p><span className="font-medium">Município:</span> {data.municipio_tomador || '-'}</p>
                <p><span className="font-medium">Estado:</span> {data.estado_tomador || '-'}</p>
                <p><span className="font-medium">I.M:</span> {data.im_tomador || '-'}</p>
              </div>
            </div>

            {/* Seção Prestador */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 flex items-center gap-2">
                <FiUser /> Dados do Prestador
              </h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">CNPJ:</span> {data.cnpj_prestador ? formatCNPJ(data.cnpj_prestador) : '-'}</p>
                <p><span className="font-medium">Município:</span> {data.municipio_prestador || '-'}</p>
                <p><span className="font-medium">Estado:</span> {data.estado_prestador || '-'}</p>
                <p><span className="font-medium">I.M:</span> {data.im_prestador || '-'}</p>
              </div>
            </div>

            {/* Seção Nota Fiscal */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 flex items-center gap-2">
                <FiFileText /> Dados da Nota
              </h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Número:</span> {data.numero_nota || '-'}</p>
                <p><span className="font-medium">Data:</span> {data.data_nota ? formatDateBr(adjustTimezone(data.data_nota)) : '-'}</p>
                <p><span className="font-medium">Código Serviço:</span> {data.codigo_servico || '-'}</p>
                <p><span className="font-medium">ISS Retido:</span> {data.iss_retido || '-'}</p>
                <p><span className="font-medium">Quantidade:</span> {data.qtd || '-'}</p>
              </div>
            </div>

            {/* Seção Financeiro */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 flex items-center gap-2">
                <FiDollarSign /> Dados Financeiros
              </h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Faturamento:</span> {data.faturamento ? formatCurrency(parseToCents(data.faturamento)!) : '-'}</p>
                <p><span className="font-medium">Base Cálculo:</span> {data.base_calculo ? formatCurrency(parseToCents(data.base_calculo)!) : '-'}</p>
                <p><span className="font-medium">Alíquota:</span> {data.aliquota ? `${data.aliquota}%` : '-'}</p>
                <p><span className="font-medium">Multa:</span> {data.multa ? formatCurrency(parseToCents(data.multa)!) : '-'}</p>
                <p><span className="font-medium">Juros:</span> {data.juros ? formatCurrency(parseToCents(data.juros)!) : '-'}</p>
                <p><span className="font-medium">Taxa:</span> {data.taxa ? formatCurrency(parseToCents(data.taxa)!) : '-'}</p>
                <p><span className="font-medium">Valor ISSQN:</span> {data.vl_issqn ? formatCurrency(parseToCents(data.vl_issqn)!) : '-'}</p>
              </div>
            </div>

            {/* Seção Outras Informações */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 flex items-center gap-2">
                <FiCalendar /> Outras Informações
              </h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Vencimento:</span> {data.vcto_guias_iss_proprio ? formatDateBr(adjustTimezone(data.vcto_guias_iss_proprio)) : '-'}</p>
                <p><span className="font-medium">Emissão:</span> {data.data_emissao ? formatDateBr(adjustTimezone(data.data_emissao)) : '-'}</p>
                <p><span className="font-medium">Status:</span> {data.status || '-'}</p>
                <p><span className="font-medium">Histórico:</span> {data.historico || '-'}</p>
                <p className="flex items-center gap-1">
                  <FiUser size={14} />
                  <span className="font-medium">Responsável:</span> {userNames[data.responsavel] || data.responsavel || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};