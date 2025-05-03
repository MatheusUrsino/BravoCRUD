import Link from "next/link";
import { FiEdit2, FiTrash2, FiCheck, FiClock } from "react-icons/fi";
import { formatCNPJ, formatCurrency, formatDate, formatPercentage } from "@/utils/formatters";
import { Models } from "appwrite";
import { FaFilePdf } from "react-icons/fa";

interface RegistrosTableRowProps {
  data: Models.Document & {
    pdf_anexo1_id?: string;
    pdf_anexo2_id?: string;
  };
  isExpanded: boolean;
  onExpand: (id: string) => void;
  onSelectForDeletion: (id: string) => void;
  onDownloadPdf: (fileId: string, fileName: string) => void;
}

// Função auxiliar para converter para número e tratar como centavos
const parseToCents = (value: number | string | undefined): number | null => {
  if (value === undefined || value === null || value === '') return null;
  
  const num = typeof value === 'string' 
    ? parseFloat(value.replace(',', '.')) 
    : value;
  
  return isNaN(num) ? null : num / 100;
};

export const RegistrosTableRow = ({
  data,
  onExpand,
  onSelectForDeletion,
  onDownloadPdf,
}: RegistrosTableRowProps) => {
  return (
    <tr
      key={data.$id}
      className="hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => onExpand(data.$id)}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Empresa</span>
          <span className="font-medium text-gray-900">{data.empresa || '-'}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Loja</span>
          <span className="text-gray-900">{data.loja || '-'}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">I.M</span>
          <span className="text-gray-900">{data.im || '-'}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Município</span>
          <span className="text-gray-900">{data.municipio || '-'}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Base Cálculo</span>
          <span className="text-gray-900">{data.base_calculo ? formatCurrency(parseToCents(data.base_calculo)!) : '-'}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Alíquota</span>
          <span className="text-gray-900">{data.aliquota ? formatPercentage(data.aliquota) : '-'}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Valor ISSQN</span>
          <span className="text-gray-900">{data.vl_issqn ? formatCurrency(parseToCents(data.vl_issqn)!) : '-'}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Vencimento</span>
          <span className="text-gray-900">
            {data.vcto_guias_iss_proprio ? formatDate(data.vcto_guias_iss_proprio) : '-'}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Status</span>
          <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${data.status === 'Concluído'
              ? 'bg-green-200 text-green-800'
              : 'bg-red-200 text-red-800'
            }`}>
            {data.status === 'Concluído' ? (
              <FiCheck size={14} />
            ) : (
              <FiClock size={14} />
            )}
            {data.status === 'Concluído' ? 'Concluído' : 'Pendente'}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end space-x-2">
          {(data.pdf_anexo1_id || data.pdf_anexo2_id) && (
            <div className="flex items-center space-x-1 border-r border-gray-200 pr-2">
              {data.pdf_anexo1_id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadPdf(data.pdf_anexo1_id!, `Anexo1_${data.empresa}.pdf`);
                  }}
                  className="text-orange-600 hover:text-orange-800 transition-colors p-1"
                  title="Baixar Guia de Recolhimento"
                >
                  <FaFilePdf size={16} />
                </button>
              )}
              {data.pdf_anexo2_id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadPdf(data.pdf_anexo2_id!, `Anexo2_${data.empresa}.pdf`);
                  }}
                  className="text-orange-600 hover:text-orange-800 transition-colors p-1"
                  title="Baixar protocolo"
                >
                  <FaFilePdf size={16} />
                </button>
              )}
            </div>
          )}
          <Link
            href={`/registros/edit/${data.$id}`}
            className="text-blue-600 hover:text-blue-900 transition-colors p-1"
            title="Editar"
            onClick={(e) => e.stopPropagation()}
          >
            <FiEdit2 size={18} />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectForDeletion(data.$id);
            }}
            className="text-red-600 hover:text-red-900 transition-colors p-1"
            title="Excluir"
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};