import { useTheme } from "@/context/ThemeContext";
import { Filter } from "@/types/registros";
import { FiFilter, FiX } from "react-icons/fi";

interface AvailableField {
  value: string;
  label: string;
  type: string;
  options?: { value: string; label: string }[];
}

interface RegistrosFiltersProps {
  filters: Filter[];
  newFilterField: string;
  newFilterValue: string;
  newFilterType: string;
  dateFilterValue: string;
  availableFields: AvailableField[];
  onAddFilter: () => void;
  onRemoveFilter: (id: string) => void;
  onFieldChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onDateChange: (date: Date | undefined) => void;
  onClearValue: () => void;
  datePickerOpen: boolean;
  setDatePickerOpen: (open: boolean) => void;
}

function DatePicker({ value, onChange, open, setOpen }: any) {
  // Placeholder para seu componente real de DatePicker
  return (
    <input
      type="date"
      value={value}
      onChange={e => onChange(e.target.value ? new Date(e.target.value) : undefined)}
      className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  );
}

export function RegistrosFilters({
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
  datePickerOpen,
  setDatePickerOpen,
}: RegistrosFiltersProps) {
  const { theme } = useTheme();

  const handleFieldSelection = (value: string) => {
    onFieldChange(value);
    // O tipo será determinado pelo campo selecionado
  };

  const selectedField = availableFields.find(field => field.value === newFilterField);
  const hasOptions = selectedField && Array.isArray(selectedField.options);

  return (
    <div className={theme === "dark" ? "bg-gray-900 p-4 rounded-lg shadow mb-6" : "bg-white p-4 rounded-lg shadow mb-6"}>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Campo */}
        <div className="flex-1">
          <label htmlFor="filter-field" className={theme === "dark" ? "block text-sm font-medium text-gray-200 mb-1" : "block text-sm font-medium text-gray-700 mb-1"}>
            Campo
          </label>
          <select
            id="filter-field"
            value={newFilterField}
            onChange={(e) => handleFieldSelection(e.target.value)}
            className={theme === "dark"
              ? "w-full rounded-md border border-gray-700 bg-gray-800 text-gray-100 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              : "w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"}
          >
            <option value="all">Todos os campos</option>
            {availableFields.map((field) => (
              <option key={field.value} value={field.value}>
                {field.label}
              </option>
            ))}
          </select>
        </div>

        {/* Valor */}
        <div className="flex-1">
          <label htmlFor="filter-input" className={theme === "dark" ? "block text-sm font-medium text-gray-200 mb-1" : "block text-sm font-medium text-gray-700 mb-1"}>
            Valor
          </label>
          {newFilterType === "date" ? (
            <DatePicker
              value={dateFilterValue}
              onChange={onDateChange}
              open={datePickerOpen}
              setOpen={setDatePickerOpen}
            />
          ) : newFilterType === "month" ? (
            <input
              id="filter-month"
              type="month"
              value={newFilterValue}
              onChange={e => onValueChange(e.target.value)}
              className={theme === "dark"
                ? "w-full rounded-md border border-gray-700 bg-gray-800 text-gray-100 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                : "w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"}
              placeholder="Selecione o mês/ano"
            />
          ) : hasOptions ? (
            <select
              id="filter-select"
              value={newFilterValue}
              onChange={(e) => onValueChange(e.target.value)}
              className={theme === "dark"
                ? "w-full rounded-md border border-gray-700 bg-gray-800 text-gray-100 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                : "w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"}
            >
              <option value="">Selecione...</option>
              {selectedField?.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <div className="relative">
              <input
                id="filter-input"
                type="text"
                value={newFilterValue}
                onChange={(e) => onValueChange(e.target.value)}
                className={theme === "dark"
                  ? "w-full rounded-md border border-gray-700 bg-gray-800 text-gray-100 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  : "w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"}
                placeholder="Digite o valor para filtrar..."
              />
              {newFilterValue && (
                <button
                  onClick={onClearValue}
                  className={theme === "dark" ? "absolute right-2 top-2 text-gray-400 hover:text-gray-200" : "absolute right-2 top-2 text-gray-500 hover:text-gray-700"}
                  type="button"
                >
                  <FiX size={18} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Botão adicionar */}
        <div className="flex items-end">
          <button
            onClick={onAddFilter}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center gap-2"
            type="button"
          >
            <FiFilter size={16} />
            Adicionar Filtro
          </button>
        </div>
      </div>

      {filters.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((filter) => {
            const fieldLabel = availableFields.find(f => f.value === filter.field)?.label || filter.field;
            let displayValue = filter.value;
            if (filter.type === "date") {
              try {
                const date = new Date(filter.value);
                displayValue = !isNaN(date.getTime())
                  ? `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`
                  : filter.value;
              } catch {
                displayValue = filter.value;
              }
            } else if (
              availableFields.find(f => f.value === filter.field)?.options
            ) {
              const opt = availableFields
                .find(f => f.value === filter.field)
                ?.options?.find(o => o.value === filter.value);
              if (opt) displayValue = opt.label;
            }

            return (
              <div
                key={filter.id}
                className={
                  theme === "dark"
                    ? "bg-blue-950 border border-blue-900 rounded-full px-3 py-1 text-sm flex items-center gap-2 transition-transform duration-300 hover:animate-wiggle"
                    : "bg-blue-100 border border-blue-200 rounded-full px-3 py-1 text-sm flex items-center gap-2 transition-transform duration-300 hover:animate-wiggle"
                }
              >
                <span className={theme === "dark" ? "font-medium text-blue-200" : "font-medium text-blue-900"}>
                  {fieldLabel}:
                </span>
                <span className={theme === "dark" ? "text-blue-300" : "text-blue-800"}>
                  {displayValue}
                </span>
                <button
                  onClick={() => onRemoveFilter(filter.id)}
                  className={theme === "dark" ? "ml-1 text-blue-400 hover:text-blue-200" : "ml-1 text-blue-700 hover:text-blue-900"}
                  type="button"
                >
                  <FiX size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}