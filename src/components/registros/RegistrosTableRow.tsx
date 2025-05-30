import Link from "next/link";
import {
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiClock,
  FiSettings,
  FiUserX,
  FiMinusCircle
} from "react-icons/fi";
import {
  MdCloudOff,
  MdNoAccounts,
  MdOutlineDoNotDisturbAlt
} from "react-icons/md";
import { BsFillExclamationTriangleFill } from "react-icons/bs";
import { FaFilePdf } from "react-icons/fa";
import { formatCNPJ, formatCurrency } from "@/utils/formatters";
import { Models } from "appwrite";
import { JSX } from "react";
import { useTheme } from "@/context/ThemeContext";

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

/**
 * Mapeamento de status para cores, ícones e labels
 */
const STATUS_CONFIG = {
  CONCLUIDO: {
    color: "bg-green-100 text-green-800",
    text: "Concluído",
    icon: <FiCheckCircle className="shrink-0" size={16} />,
  },
  PENDENTE: {
    color: "bg-yellow-100 text-yellow-800",
    text: "Pendente",
    icon: <FiClock className="shrink-0" size={16} />,
  },
  ERRO_LOGIN: {
    color: "bg-orange-100 text-orange-800",
    text: "Erro de login",
    icon: <MdNoAccounts className="shrink-0" size={16} />,
  },
  ERRO_SISTEMA: {
    color: "bg-yellow-200 text-yellow-800",
    text: "Erro de sistema",
    icon: <MdCloudOff className="shrink-0" size={16} />,
  },
  MODULO_NAO_HABILITADO: {
    color: "bg-gray-100 text-gray-800",
    text: "Módulo não habilitado",
    icon: <FiSettings className="shrink-0" size={16} />,
  },
  SEM_ACESSO: {
    color: "bg-red-100 text-red-800",
    text: "Sem acesso",
    icon: <FiUserX className="shrink-0" size={16} />,
  },
  PENDENCIA: {
    color: "bg-red-100 text-red-800",
    text: "Pendência",
    icon: <BsFillExclamationTriangleFill className="shrink-0" size={14} />,
  },
  SEM_MOVIMENTO: {
    color: "bg-orange-100 text-orange-800",
    text: "Sem movimento",
    icon: <MdOutlineDoNotDisturbAlt className="shrink-0" size={16} />,
  },
  DEFAULT: {
    color: "bg-gray-100 text-gray-800",
    text: "Desconhecido",
    icon: <FiMinusCircle className="shrink-0" size={16} />,
  },
} as const;

// Função para visualizar PDF em nova aba
async function handleViewPdf(fileId: string) {
  const res = await fetch(`/api/registros/download?fileId=${fileId}`);
  const data = await res.json();

  if (data.success && data.url) {
    window.open(data.url, '_blank');
  } else {
    alert('Erro ao visualizar arquivo');
  }
}

export const RegistrosTableRow = ({
  data,
  isExpanded,
  onExpand,
  onSelectForDeletion,
  onDownloadPdf,
}: RegistrosTableRowProps) => {
  const { theme } = useTheme();

  // Obtém a configuração do status ou usa o padrão
  const statusConfig = data.status
    ? STATUS_CONFIG[data.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DEFAULT
    : STATUS_CONFIG.DEFAULT;

  return (
    <tr
      className={`
      transition-colors cursor-pointer 
      ${theme === "dark"
          ? `hover:bg-gray-900 ${isExpanded ? "bg-gray-800" : ""}`
          : `hover:bg-gray-50 ${isExpanded ? "bg-blue-50" : ""}`
        }
    `}
      onClick={() => onExpand(data.$id)}
    >
      {/* Coluna Empresa */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className={theme === "dark" ? "text-xs text-gray-400" : "text-xs text-gray-500"}>Empresa</span>
          <span className={theme === "dark" ? "font-medium text-gray-100 truncate max-w-[180px]" : "font-medium text-gray-900 truncate max-w-[180px]"}>
            {data.empresa || "-"}
          </span>
        </div>
      </td>

      {/* Coluna Loja */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className={theme === "dark" ? "text-xs text-gray-400" : "text-xs text-gray-500"}>Loja</span>
          <span className={theme === "dark" ? "text-gray-100" : "text-gray-900"}>
            {data.loja || "-"}
          </span>
        </div>
      </td>

      {/* Coluna Tipo */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className={theme === "dark" ? "text-xs text-gray-400" : "text-xs text-gray-500"}>Tipo</span>
          <span className={theme === "dark" ? "text-gray-100" : "text-gray-900"}>
            {data.tipo_registro === "PRESTADO" ? "Prestado" :
              data.tipo_registro === "TOMADO" ? "Tomado" : "-"}
          </span>
        </div>
      </td>

      {/* Coluna CNPJ Tomador */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className={theme === "dark" ? "text-xs text-gray-400" : "text-xs text-gray-500"}>CNPJ Tomador</span>
          <span className={theme === "dark" ? "text-gray-100" : "text-gray-900"}>
            {data.cnpj_tomador ? formatCNPJ(data.cnpj_tomador) : "-"}
          </span>
        </div>
      </td>

      {/* Coluna CNPJ Prestador */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className={theme === "dark" ? "text-xs text-gray-400" : "text-xs text-gray-500"}>CNPJ Prestador</span>
          <span className={theme === "dark" ? "text-gray-100" : "text-gray-900"}>
            {data.cnpj_prestador ? formatCNPJ(data.cnpj_prestador) : "-"}
          </span>
        </div>
      </td>

      {/* Coluna Número da Nota */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className={theme === "dark" ? "text-xs text-gray-400" : "text-xs text-gray-500"}>Nº Nota</span>
          <span className={theme === "dark" ? "text-gray-100" : "text-gray-900"}>
            {data.numero_nota || "-"}
          </span>
        </div>
      </td>

      {/* Coluna Valor ISSQN */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className={theme === "dark" ? "text-xs text-gray-400" : "text-xs text-gray-500"}>Valor ISSQN</span>
          <span className={theme === "dark" ? "text-gray-100" : "text-gray-900"}>
            {data.vl_issqn !== undefined && data.vl_issqn !== null && data.vl_issqn !== ""
              ? formatCurrency(Number(data.vl_issqn))
              : "-"}
          </span>
        </div>
      </td>

      {/* Coluna Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className={theme === "dark" ? "text-xs text-gray-400" : "text-xs text-gray-500"}>Status</span>
          <span
            className={`
            px-2 py-1 text-xs rounded-full 
            flex items-center gap-1 w-fit
            ${statusConfig.color}
          `}
            title={statusConfig.text}
          >
            {statusConfig.icon}
            <span className="truncate max-w-[100px]">
              {statusConfig.text}
            </span>
          </span>
        </div>
      </td>

      {/* Coluna Ações */}
      <td
        className="px-6 py-4 whitespace-nowrap text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end items-center space-x-2">
          {/* Botões de PDF */}
          {(data.pdf_anexo1_id || data.pdf_anexo2_id) && (
            <div className={theme === "dark" ? "flex items-center space-x-1 border-r border-gray-700 pr-2" : "flex items-center space-x-1 border-r border-gray-200 pr-2"}>
              {data.pdf_anexo1_id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewPdf(data.pdf_anexo1_id!);
                  }}
                  className={theme === "dark" ? "text-orange-400 hover:text-orange-300 transition-colors p-1" : "text-orange-600 hover:text-orange-800 transition-colors p-1"}
                  aria-label="Visualizar Guia de Recolhimento"
                >
                  <FaFilePdf size={16} />
                </button>
              )}
              {data.pdf_anexo2_id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewPdf(data.pdf_anexo2_id!);
                  }}
                  className={theme === "dark" ? "text-orange-400 hover:text-orange-300 transition-colors p-1" : "text-orange-600 hover:text-orange-800 transition-colors p-1"}
                  aria-label="Visualizar protocolo"
                >
                  <FaFilePdf size={16} />
                </button>
              )}
            </div>
          )}

          {/* Botão Editar */}
          <Link
            href={`/registros/edit/${data.$id}`}
            className={theme === "dark" ? "text-blue-400 hover:text-blue-200 transition-colors p-1" : "text-blue-600 hover:text-blue-800 transition-colors p-1"}
            aria-label="Editar"
            onClick={(e) => e.stopPropagation()}
          >
            <FiEdit2 size={18} />
          </Link>

          {/* Botão Excluir */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectForDeletion(data.$id);
            }}
            className={theme === "dark" ? "text-red-400 hover:text-red-600 transition-colors p-1" : "text-red-600 hover:text-red-800 transition-colors p-1"}
            aria-label="Excluir"
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};