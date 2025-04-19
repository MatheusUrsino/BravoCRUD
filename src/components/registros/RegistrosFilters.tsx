import { FiFilter, FiX } from "react-icons/fi";
import { Filter } from "@/types/registros";

interface RegistrosFiltersProps {
  filters: Filter[];
  newFilterField: string;
  newFilterValue: string;
  newFilterType: string;
  dateFilterValue: string;
  availableFields: { value: string; label: string; type: string }[];
  onAddFilter: () => void;
  onRemoveFilter: (id: string) => void;
  onFieldChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onClearValue: () => void;
}

export const RegistrosFilters = ({
  filters,
  newFilterField,
  newFilterValue,
  newFilterType,
  dateFilterValue,
  availableFields,
  onAddFilter,
  onRemoveFilter,
  onFieldChange,
  onValueChange,
  onDateChange,
  onClearValue,
}: RegistrosFiltersProps) => (
  <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
      <FiFilter /> Filtros Avançados
    </h2>

    {filters.length > 0 && (
      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map((filter) => (
          <div
            key={filter.id}
            className="flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm"
          >
            <span className="font-medium">
              {filter.field === "all" ? "Todos" : availableFields.find(f => f.value === filter.field)?.label}:
            </span>
            <span className="mx-1">"{filter.type === 'date' ? formatDateBr(filter.value) : filter.value}"</span>
            <button
              onClick={() => onRemoveFilter(filter.id)}
              className="text-blue-600 hover:text-blue-800 ml-1"
            >
              <FiX size={14} />
            </button>
          </div>
        ))}
      </div>
    )}

    <div className="flex flex-col md:flex-row gap-3">
      <div className="flex-grow">
        <label htmlFor="filterField" className="block text-sm font-medium text-gray-700 mb-1">
          Campo para filtrar
        </label>
        <select
          id="filterField"
          className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          value={newFilterField}
          onChange={(e) => onFieldChange(e.target.value)}
        >
          {availableFields.map((field) => (
            <option key={field.value} value={field.value}>
              {field.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-grow">
        <label htmlFor="filterValue" className="block text-sm font-medium text-gray-700 mb-1">
          {newFilterType === "date" ? "Data para filtrar (DD/MM/AAAA)" : "Valor do filtro"}
        </label>
        <div className="relative">
          {newFilterType === "date" ? (
            <input
              type="text"
              id="filterValue"
              placeholder="DD/MM/AAAA"
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={dateFilterValue}
              onChange={(e) => onDateChange(e.target.value)}
              maxLength={10}
            />
          ) : (
            <input
              type="text"
              id="filterValue"
              placeholder="Digite o valor para filtrar..."
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={newFilterValue}
              onChange={(e) => onValueChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onAddFilter()}
            />
          )}
          {(newFilterValue || dateFilterValue) && (
            <button
              onClick={onClearValue}
              className="absolute inset-y-0 right-8 flex items-center pr-2 text-gray-400 hover:text-gray-600"
            >
              <FiX />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-end">
        <button
          type="button"
          onClick={onAddFilter}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-[38px]"
        >
          Adicionar Filtro
        </button>
      </div>
    </div>
  </div>
);

// Função auxiliar para formatar data no padrão brasileiro
const formatDateBr = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    // Se for uma data ISO (YYYY-MM-DD)
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('T')[0].split('-');
      return `${day}/${month}/${year}`;
    }
    // Se já estiver no formato brasileiro, retorna sem alteração
    return dateString;
  } catch {
    return dateString;
  }
};