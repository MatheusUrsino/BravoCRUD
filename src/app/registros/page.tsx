"use client";
import { RegistrosHeader } from "@/components/registros/RegistrosHeader";
import { RegistrosFilters } from "@/components/registros/RegistrosFilters";
import { RegistrosTable } from "@/components/registros/RegistrosTable";
import { useTheme } from "@/context/ThemeContext";
import { useRegistros } from "./hooks/useRegistros";
import { FiX, FiChevronLeft, FiChevronRight, FiTrash2 } from "react-icons/fi";
import { DeleteConfirmationModal } from "@/components/registros";

export default function RegistrosPage() {
    const { theme } = useTheme();
    const registros = useRegistros(theme);

    if (registros.loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const totalPages = Math.max(1, Math.ceil(registros.filteredDocuments.length / registros.pageSize));
    const canPrev = registros.currentPage > 1;
    const canNext = registros.currentPage < totalPages;

    return (
        <div className={theme === "dark" ? "min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" : "min-h-screen bg-gray-50"}>
            <RegistrosHeader
                onExport={registros.exportToExcel}
                hasData={registros.filteredDocuments.length > 0}
                onImport={registros.handleImport}
            />

            <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex justify-end mb-4">
                    <button
                        onClick={registros.handleDeleteAll}
                        disabled={registros.deletingAll || registros.documents.length === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold shadow-sm transition
                        ${theme === "dark"
                                ? "bg-red-700 text-white hover:bg-red-800 disabled:bg-gray-700"
                                : "bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300"}
                        `}
                        title="Deletar todos os registros"
                    >
                        <FiTrash2 />
                        {registros.deletingAll ? "Deletando..." : "Deletar todos"}
                    </button>
                </div>

                <div className={theme === "dark" ? "bg-gray-800 rounded-lg shadow-md p-4 mb-6" : "bg-white rounded-lg shadow-md p-4 mb-6"}>
                    <RegistrosFilters
                        filters={registros.filters}
                        newFilterField={registros.newFilterField}
                        newFilterValue={registros.newFilterValue}
                        newFilterType={registros.newFilterType}
                        dateFilterValue={registros.dateFilterValue}
                        availableFields={registros.availableFields}
                        onAddFilter={registros.addFilter}
                        onRemoveFilter={registros.removeFilter}
                        onFieldChange={registros.handleFieldChange}
                        onValueChange={registros.setNewFilterValue}
                        onDateChange={(date: Date | undefined) => registros.setDateFilterValue(date ? date.toISOString().split('T')[0] : "")}
                        onClearValue={() => registros.setNewFilterValue("")}
                        datePickerOpen={registros.datePickerOpen}
                        setDatePickerOpen={registros.setDatePickerOpen}
                    />
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <div className="flex items-center gap-2">
                        <label className="mr-2 font-medium">Registros por página:</label>
                        <select
                            value={registros.pageSize}
                            onChange={e => {
                                registros.setPageSize(Number(e.target.value));
                                registros.setCurrentPage(1);
                            }}
                            className={theme === "dark"
                                ? "border border-gray-700 rounded-lg px-3 py-2 bg-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-150 text-gray-100 font-medium hover:border-indigo-500"
                                : "border border-gray-400 rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150 text-gray-700 font-medium hover:border-blue-500"}
                        >
                            {[10, 30, 50, 100].map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => registros.setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={!canPrev}
                            className={`p-2 rounded border ${canPrev
                                ? (theme === "dark"
                                    ? "hover:bg-indigo-900 text-indigo-400 border-gray-700"
                                    : "hover:bg-blue-100 text-blue-700 border-gray-300")
                                : (theme === "dark"
                                    ? "text-gray-600 border-gray-700 cursor-not-allowed"
                                    : "text-gray-400 border-gray-300 cursor-not-allowed")}`}
                            title="Página anterior"
                        >
                            <FiChevronLeft size={18} />
                        </button>
                        <span className={theme === "dark" ? "font-medium text-gray-100" : "font-medium text-gray-700"}>
                            Página {registros.currentPage} de {totalPages}
                        </span>
                        <button
                            onClick={() => registros.setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={!canNext}
                            className={`p-2 rounded border ${canNext
                                ? (theme === "dark"
                                    ? "hover:bg-indigo-900 text-indigo-400 border-gray-700"
                                    : "hover:bg-blue-100 text-blue-700 border-gray-300")
                                : (theme === "dark"
                                    ? "text-gray-600 border-gray-700 cursor-not-allowed"
                                    : "text-gray-400 border-gray-300 cursor-not-allowed")}`}
                            title="Próxima página"
                        >
                            <FiChevronRight size={18} />
                        </button>
                    </div>
                </div>

                <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className={theme === "dark" ? "text-sm text-gray-300" : "text-sm text-gray-600"}>
                        {registros.filteredDocuments.length} {registros.filteredDocuments.length === 1 ? 'registro' : 'registros'} encontrados
                    </div>
                    {registros.filters.length > 0 && (
                        <button
                            onClick={() => registros.setFilters([])}
                            className={theme === "dark"
                                ? "text-sm text-red-400 hover:text-red-600 flex items-center gap-1"
                                : "text-sm text-red-600 hover:text-red-800 flex items-center gap-1"}
                        >
                            <FiX size={14} /> Limpar todos os filtros
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <RegistrosTable
                        filteredDocuments={registros.paginatedDocuments}
                        filters={registros.filters}
                        sortConfig={registros.sortConfig}
                        expandedRow={registros.expandedRow}
                        userNames={registros.userNames}
                        onRequestSort={registros.requestSort}
                        onExpandRow={id => registros.setExpandedRow(registros.expandedRow === id ? null : id)}
                        onSelectForDeletion={registros.handleSelectForDeletion}
                        onClearFilters={() => registros.setFilters([])}
                        onDownloadPdf={registros.downloadPdf}
                    />
                </div>
            </main>

            <DeleteConfirmationModal
                isOpen={registros.showConfirm}
                onCancel={() => registros.setShowConfirm(false)}
                onConfirm={registros.handleDelete}
            />
        </div>
    );
}