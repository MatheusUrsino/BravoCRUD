import { FiX, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { RegistrosTableRow } from "./RegistrosTableRow";
import { RegistrosTableExpandedRow } from "./RegistrosTableExpandedRow";
import { Filter } from "@/types/registros";
import React from "react";
import { useTheme } from "@/context/ThemeContext";

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

// Função para comparar valores para ordenação
const compareValues = (a: any, b: any, key: string, direction: 'ascending' | 'descending') => {
  // Tratamento especial para valores monetários e numéricos
  const numericFields = ['faturamento', 'base_calculo', 'aliquota', 'multa', 'juros', 'taxa', 'vl_issqn', 'qtd'];

  let valueA = a[key];
  let valueB = b[key];

  if (numericFields.includes(key)) {
    valueA = parseFloat(String(valueA || 0).replace(',', '.'));
    valueB = parseFloat(String(valueB || 0).replace(',', '.'));
  } else if (key.includes('data') || key.includes('vcto') || key.includes('emissao')) {
    // Para campos de data
    valueA = valueA ? new Date(valueA).getTime() : 0;
    valueB = valueB ? new Date(valueB).getTime() : 0;
  } else {
    // Para strings
    valueA = String(valueA || '').toLowerCase();
    valueB = String(valueB || '').toLowerCase();
  }

  if (valueA < valueB) {
    return direction === 'ascending' ? -1 : 1;
  }
  if (valueA > valueB) {
    return direction === 'ascending' ? 1 : -1;
  }
  return 0;
};

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
    if (!sortConfig) return null;
    if (sortConfig.key !== key) return null;

    return sortConfig.direction === 'ascending'
      ? <FiChevronUp className="ml-1 inline" />
      : <FiChevronDown className="ml-1 inline" />;
  };

  // Ordena os documentos conforme a configuração
  const sortedDocuments = React.useMemo(() => {
    if (!sortConfig) return filteredDocuments;

    return [...filteredDocuments].sort((a, b) => {
      return compareValues(a, b, sortConfig.key, sortConfig.direction);
    });
  }, [filteredDocuments, sortConfig]);
  const { theme } = useTheme();
  return (
    <div className={theme === "dark"
      ? "bg-gray-900 shadow-lg rounded-xl overflow-hidden border border-gray-800"
      : "bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200"}
    >
      <div className="overflow-x-auto">
        <table className={theme === "dark" ? "min-w-full divide-y divide-gray-800" : "min-w-full divide-y divide-gray-200"}>
          <thead className={theme === "dark" ? "bg-gray-800" : "bg-gray-50"}>
            <tr>
              <th
                className={theme === "dark"
                  ? "px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900"
                  : "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"}
                onClick={() => onRequestSort('empresa')}
              >
                Empresa {getSortIcon('empresa')}
              </th>
              <th
                className={theme === "dark"
                  ? "px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900"
                  : "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"}
                onClick={() => onRequestSort('loja')}
              >
                Loja {getSortIcon('loja')}
              </th>
              <th
                className={theme === "dark"
                  ? "px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900"
                  : "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"}
                onClick={() => onRequestSort('tipo_registro')}
              >
                Tipo {getSortIcon('tipo_registro')}
              </th>
              <th
                className={theme === "dark"
                  ? "px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900"
                  : "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"}
                onClick={() => onRequestSort('cnpj_tomador')}
              >
                CNPJ Tomador {getSortIcon('cnpj_tomador')}
              </th>
              <th
                className={theme === "dark"
                  ? "px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900"
                  : "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"}
                onClick={() => onRequestSort('cnpj_tomador')}
              >
                CNPJ Prestador {getSortIcon('cnpj_tomador')}
              </th>
              <th
                className={theme === "dark"
                  ? "px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900"
                  : "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"}
                onClick={() => onRequestSort('numero_nota')}
              >
                Nº Nota {getSortIcon('numero_nota')}
              </th>
              <th
                className={theme === "dark"
                  ? "px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900"
                  : "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"}
                onClick={() => onRequestSort('vl_issqn')}
              >
                Valor ISSQN {getSortIcon('vl_issqn')}
              </th>
              <th
                className={theme === "dark"
                  ? "px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900"
                  : "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"}
                onClick={() => onRequestSort('status')}
              >
                Status {getSortIcon('status')}
              </th>
              <th className={theme === "dark"
                ? "px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider"
                : "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"}
              >
                Ações
              </th>
            </tr>
          </thead>

          <tbody className={theme === "dark" ? "bg-gray-900 divide-y divide-gray-800" : "bg-white divide-y divide-gray-200"}>
            {sortedDocuments.map((data) => (
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

      {sortedDocuments.length === 0 && (
        <div className={theme === "dark" ? "text-center py-12 bg-gray-900" : "text-center py-12"}>
          <h3 className={theme === "dark" ? "text-lg font-medium text-gray-100" : "text-lg font-medium text-gray-900"}>
            {filters.length > 0 ? "Nenhum registro encontrado com os filtros aplicados" : "Nenhum registro encontrado"}
          </h3>
          <p className={theme === "dark" ? "text-sm text-gray-400 mt-2" : "text-sm text-gray-500 mt-2"}>
            {filters.length > 0 ? (
              <button
                onClick={onClearFilters}
                className={theme === "dark" ? "text-blue-400 hover:underline" : "text-blue-600 hover:underline"}
              >
                <FiX className="inline mr-1" /> Limpar filtros
              </button>
            ) : (
              "Adicione uma nova filial para começar"
            )}
          </p>
        </div>
      )}
    </div>
  );
};