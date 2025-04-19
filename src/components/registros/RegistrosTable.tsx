import { FiChevronDown, FiChevronUp, FiCalendar, FiX } from "react-icons/fi";
import { RegistrosTableRow } from "./RegistrosTableRow";
import { RegistrosTableExpandedRow } from "./RegistrosTableExpandedRow";
import { Filter } from "@/types/registros"; // Defina este tipo
import { Link } from "lucide-react";
import React from "react";

interface RegistrosTableProps {
  filteredDocuments: any[];
  filters: Filter[];
  sortConfig: { key: string; direction: 'ascending' | 'descending' } | null;
  expandedRow: string | null;
  userNames: Record<string, string>;
  onRequestSort: (key: string) => void;
  onExpandRow: (id: string) => void;
  onSelectForDeletion: (id: string) => void;
  onClearFilters: () => void;
  onDownloadPdf: (fileId: string, fileName: string) => void;
}

export const RegistrosTable = ({
  filteredDocuments,
  filters,
  sortConfig,
  expandedRow,
  userNames,
  onRequestSort,
  onExpandRow,
  onSelectForDeletion,
  onClearFilters,
  onDownloadPdf,
}: RegistrosTableProps) => {
  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <FiChevronDown className="opacity-30" />;
    return sortConfig.direction === 'ascending' ? <FiChevronUp /> : <FiChevronDown />;
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* Cabeçalho da tabela */}
          <thead className="bg-gray-50">
            <tr>
              {/* Colunas do cabeçalho */}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDocuments.map((data) => (
              <React.Fragment key={data.$id}>
                <RegistrosTableRow
                  data={data}
                  isExpanded={expandedRow === data.$id}
                  onExpand={onExpandRow}
                  onSelectForDeletion={onSelectForDeletion}
                  onDownloadPdf={onDownloadPdf}
                />
                {expandedRow === data.$id && (
                  <RegistrosTableExpandedRow
                    data={data}
                    userNames={userNames}
                  />
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">
            {filters.length > 0 ? "Nenhum registro encontrado com os filtros aplicados" : "Nenhum registro encontrado"}
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            {filters.length > 0 ? (
              <button
                onClick={onClearFilters}
                className="text-blue-600 hover:underline"
              >
                <FiX className="inline mr-1" /> Limpar filtros
              </button>
            ) : (
              <Link href="/registros/new" className="text-blue-600 hover:underline">
                Adicione uma nova filial para começar
              </Link>
            )}
          </p>
        </div>
      )}
    </div>
  );
};