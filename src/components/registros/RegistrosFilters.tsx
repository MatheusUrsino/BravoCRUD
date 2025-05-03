import { FiX, FiFilter, FiCalendar } from "react-icons/fi";
import { DatePicker } from "@/components/ui/date-picker";
import { AvailableField, Filter } from "@/types/registros";

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
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="filter-field" className="block text-sm font-medium text-gray-700 mb-1">
            Campo
          </label>
          <select
            id="filter-field"
            value={newFilterField}
            onChange={(e) => onFieldChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {availableFields.map((field) => (
              <option key={field.value} value={field.value}>
                {field.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label htmlFor="filter-input" className="block text-sm font-medium text-gray-700 mb-1">
            Valor
          </label>
          {newFilterType === "date" ? (
            <DatePicker
              value={dateFilterValue}
              onChange={onDateChange}
              open={datePickerOpen}
              setOpen={setDatePickerOpen}
            />
          ) : (
            <div className="relative">
              <input
                id="filter-input"
                type="text"
                value={newFilterValue}
                onChange={(e) => onValueChange(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Digite o valor para filtrar..."
              />
              {newFilterValue && (
                <button
                  onClick={onClearValue}
                  className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                >
                  <FiX size={18} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-end">
          <button
            onClick={onAddFilter}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center gap-2"
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
                displayValue = date.toLocaleDateString('pt-BR')
              } catch {
                displayValue = filter.value;
              }
            }

            return (
              <div
                key={filter.id}
                className="bg-cyan-100 rounded-full px-3 py-1 text-sm flex items-center gap-2 transition-transform duration-300 hover:animate-wiggle"
              >
                <span className="font-medium">{fieldLabel}:</span>
                <span>{displayValue}</span>
                <button
                  onClick={() => onRemoveFilter(filter.id)}
                  className="text-gray-500 hover:text-red-600"
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