import { FiMapPin, FiDollarSign, FiCalendar, FiUser } from "react-icons/fi";
import { formatCNPJ, formatCurrency, formatDate } from "@/utils/formatters";
import { Models } from "appwrite";

interface RegistrosTableExpandedRowProps {
  data: Models.Document;
  userNames: Record<string, string>;
}

export const RegistrosTableExpandedRow = ({ 
  data, 
  userNames 
}: RegistrosTableExpandedRowProps) => {
  return (
    <tr className="bg-blue-50">
      <td colSpan={7} className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <FiMapPin /> Informações Básicas
            </h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Empresa:</span> {data.empresa || '-'}</p>
              <p><span className="font-medium">Loja:</span> {data.loja || '-'}</p>
              <p><span className="font-medium">Município/UF:</span> {data.municipio || '-'} / {data.estado || '-'}</p>
              <p><span className="font-medium">CNPJ:</span> {data.cnpj ? formatCNPJ(data.cnpj) : '-'}</p>
              <p><span className="font-medium">I.M:</span> {data.im || '-'}</p>
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

          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <FiDollarSign /> Dados Financeiros
            </h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Faturamento:</span> {data.faturamento ? formatCurrency(data.faturamento) : '-'}</p>
              <p><span className="font-medium">Base Cálculo:</span> {data.base_calculo ? formatCurrency(data.base_calculo) : '-'}</p>
              <p><span className="font-medium">Alíquota:</span> {data.aliquota ? `${data.aliquota}%` : '-'}</p>
              <p><span className="font-medium">Valor ISSQN:</span> {data.vl_issqn ? formatCurrency(data.vl_issqn) : '-'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <FiCalendar /> Outras Informações
            </h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Data Emissão:</span> {data.data_emissao ? formatDate(data.data_emissao) : '-'}</p>
              <p><span className="font-medium">Quantidade:</span> {data.qtd || '-'}</p>
              <p><span className="font-medium">Histórico:</span> {data.historico || '-'}</p>
              <p className="flex items-center gap-1">
                <FiUser size={14} />
                <span className="font-medium">Responsável:</span> {data.responsavel || '-'}
              </p>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};