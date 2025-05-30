"use client";

import { useState, useEffect, useMemo } from "react";
import { RegistrosHeader } from "@/components/registros/RegistrosHeader";
import { RegistrosFilters } from "@/components/registros/RegistrosFilters";
import { RegistrosTable } from "@/components/registros/RegistrosTable";
import { DeleteConfirmationModal } from "@/components/registros/DeleteConfirmationModal";
import { AuthService, RegistersService } from "@/service";
import { Storage, Account as AppwriteAccount } from 'appwrite';
import client from "@/config/appwrite.config";
import { Filter, AvailableField } from "@/types/registros";
import { toast } from "react-toastify";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function RegistrosPage() {
    // Estados principais
    const [user, setUser] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [filters, setFilters] = useState<Filter[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [newFilterValue, setNewFilterValue] = useState("");
    const [newFilterField, setNewFilterField] = useState("all");
    const [newFilterType, setNewFilterType] = useState("text");
    const [dateFilterValue, setDateFilterValue] = useState("");
    const [userNames, setUserNames] = useState<Record<string, string>>({});
    const [datePickerOpen, setDatePickerOpen] = useState(false);

    // Paginação
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Appwrite
    const storage = new Storage(client);
    const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;
    const registersService = RegistersService.getInstance();
    const authService = AuthService.getInstance();

    // Campos disponíveis para filtro
    const availableFields: AvailableField[] = [
        { value: "empresa", label: "Empresa", type: "text" },
        { value: "loja", label: "Loja", type: "text" },
        { value: "docSap", label: "Doc SAP", type: "text" },
        { value: "competencia", label: "Competência (Mês/Ano)", type: "month" },
        {
            value: "tipo_registro",
            label: "Tipo de Registro",
            type: "select",
            options: [
                { value: "TOMADO", label: "Tomado" },
                { value: "PRESTADO", label: "Prestado" }
            ]
        },
        { value: "cnpj_tomador", label: "CNPJ Tomador", type: "text" },
        { value: "municipio_tomador", label: "Município Tomador", type: "text" },
        { value: "estado_tomador", label: "Estado Tomador", type: "text" },
        { value: "im_tomador", label: "IM Tomador", type: "text" },
        { value: "cnpj_prestador", label: "CNPJ Prestador", type: "text" },
        { value: "municipio_prestador", label: "Município Prestador", type: "text" },
        { value: "estado_prestador", label: "Estado Prestador", type: "text" },
        { value: "im_prestador", label: "IM Prestador", type: "text" },
        { value: "numero_nota", label: "Número da Nota", type: "text" },
        { value: "data_nota", label: "Data da Nota", type: "date" },
        { value: "codigo_servico", label: "Código do Serviço", type: "text" },
        { value: "faturamento", label: "Faturamento", type: "text" },
        { value: "base_calculo", label: "Base de Cálculo", type: "text" },
        { value: "aliquota", label: "Alíquota", type: "text" },
        { value: "multa", label: "Multa", type: "text" },
        { value: "juros", label: "Juros", type: "text" },
        { value: "taxa", label: "Taxa", type: "text" },
        { value: "vl_issqn", label: "VL. ISSQN", type: "text" },
        {
            value: "iss_retido",
            label: "ISS Retido",
            type: "select",
            options: [
                { value: "Sim", label: "Sim" },
                { value: "Não", label: "Não" }
            ]
        },
        {
            value: "status_empresa",
            label: "Status Empresa",
            type: "select",
            options: [
                { value: "Ativa", label: "Ativa" },
                { value: "Inativa", label: "Inativa" },
                { value: "Suspensa", label: "Suspensa" }
            ]
        },
        {
            value: "status",
            label: "Status Registro",
            type: "select",
            options: [
                { value: "CONCLUIDO", label: "Concluído" },
                { value: "PENDENTE", label: "Pendente" },
                { value: "ERRO_SISTEMA", label: "Erro de Sistema" },
                { value: "ERRO_LOGIN", label: "Erro de login" },
                { value: "MODULO_NAO_HABILITADO", label: "Módulo não habilitado" },
                { value: "SEM_ACESSO", label: "Sem acesso" },
                { value: "SEM_MOVIMENTO", label: "Sem movimento" },
                { value: "PENDENCIA", label: "Pendência" }
            ]
        },
        { value: "historico", label: "Observação", type: "text" },
        { value: "vcto_guias_iss_proprio", label: "Vencimento da Guia", type: "date" },
        { value: "data_emissao", label: "Data de Emissão", type: "date" },
        { value: "qtd", label: "Quantidade de Nota", type: "text" },
        { value: "responsavel", label: "Responsável", type: "text" }
    ];

    // Ordenação
    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Função para tratar números corretamente (sem replace global)
    function parseNumber(value: any) {
        if (typeof value === "number") return value;
        if (!value) return 0;
        // Se vier string, tenta converter direto
        return Number(value);
    }

    // Ordena documentos
    const sortedDocuments = useMemo(() => {
        if (!sortConfig) return documents;
        return [...documents].sort((a: any, b: any) => {
            const numericFields = ['faturamento', 'base_calculo', 'aliquota', 'multa', 'juros', 'taxa', 'vl_issqn', 'qtd'];
            let valueA = a[sortConfig.key];
            let valueB = b[sortConfig.key];
            if (numericFields.includes(sortConfig.key)) {
                valueA = parseNumber(valueA);
                valueB = parseNumber(valueB);
            } else if (sortConfig.key.includes('data') || sortConfig.key.includes('vcto') || sortConfig.key.includes('emissao')) {
                valueA = valueA ? new Date(valueA).getTime() : 0;
                valueB = valueB ? new Date(valueB).getTime() : 0;
            } else {
                valueA = String(valueA || '').toLowerCase();
                valueB = String(valueB || '').toLowerCase();
            }
            if (valueA < valueB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valueA > valueB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }, [documents, sortConfig]);

    // Filtra documentos
    const filteredDocuments = useMemo(() => {
        if (filters.length === 0) return sortedDocuments;
        return sortedDocuments.filter((doc: any) => {
            return filters.every(filter => {
                if (filter.type === "month") {
                    // Valor salvo: "2024-06", valor no doc: "2024-06-01T00:00:00.000Z"
                    const docValue = doc[filter.field];
                    if (!docValue) return false;
                    // Extrai "YYYY-MM" do valor salvo
                    const docMonth = docValue.slice(0, 7);
                    return docMonth === filter.value;
                }
                if (filter.type !== "date") {
                    const searchTerm = filter.value.toLowerCase();
                    if (filter.field === "all") {
                        return Object.values(doc).some(value => String(value ?? '').toLowerCase().includes(searchTerm));
                    } else {
                        let fieldValue;
                        if (filter.field === "responsavel") {
                            fieldValue = userNames[doc.responsavel] || doc.responsavel || '';
                        } else {
                            fieldValue = String(doc[filter.field] ?? '');
                        }
                        return fieldValue.toLowerCase().includes(searchTerm);
                    }
                } else {
                    const filterDate = new Date(filter.value);
                    if (isNaN(filterDate.getTime())) return false;
                    const docDateValue = doc[filter.field];
                    if (!docDateValue) return false;
                    const docDate = new Date(docDateValue);
                    if (isNaN(docDate.getTime())) return false;
                    return (
                        docDate.getFullYear() === filterDate.getFullYear() &&
                        docDate.getMonth() === filterDate.getMonth() &&
                        docDate.getDate() === filterDate.getDate()
                    );
                }
            });
        });
    }, [sortedDocuments, filters, userNames]);

    // Paginação
    const paginatedDocuments = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredDocuments.slice(start, start + pageSize);
    }, [filteredDocuments, currentPage, pageSize]);

    // Volta para página 1 ao mudar filtros ou pageSize
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, pageSize]);

    // Busca nomes dos responsáveis
    const fetchUserNames = async (userIds: string[]) => {
        const names: Record<string, string> = {};
        for (const userId of userIds) {
            try {
                const account = new AppwriteAccount(client);
                const user = await account.get(userId);
                names[userId] = user.name || user.email;
            } catch {
                names[userId] = "Usuário desconhecido";
            }
        }
        setUserNames(names);
    };

    // Download PDF
    const downloadPdf = async (fileId: string, fileName: string) => {
        try {
            if (!bucketId) throw new Error("Bucket ID não configurado");
            const fileUrl = storage.getFileView(bucketId, fileId);
            const response = await fetch(fileUrl.toString());
            const blob = await response.blob();
            saveAs(blob, fileName || `documento_${Date.now()}.pdf`);
            toast.success("Download iniciado!");
        } catch (error) {
            toast.error("Erro ao baixar arquivo");
        }
    };

    // Exporta para Excel
    const exportToExcel = () => {
        const dataToExport = filteredDocuments.map((item: any) => ({
            Empresa: item.empresa || '',
            Loja: item.loja || '',
            DocSAP: item.docSap || '',
            Competencia: item.competencia ? item.competencia.slice(0, 7) : '',
            TipoRegistro: item.tipo_registro || '',
            CNPJTomador: item.cnpj_tomador || '',
            MunicipioTomador: item.municipio_tomador || '',
            EstadoTomador: item.estado_tomador || '',
            IMTomador: item.im_tomador || '',
            CNPJPrestador: item.cnpj_prestador || '',
            MunicipioPrestador: item.municipio_prestador || '',
            EstadoPrestador: item.estado_prestador || '',
            IMPrestador: item.im_prestador || '',
            NumeroNota: item.numero_nota || '',
            DataNota: item.data_nota || '',
            CodigoServico: item.codigo_servico || '',
            Faturamento: item.faturamento ?? '',
            BaseCalculo: item.base_calculo ?? '',
            Aliquota: item.aliquota ?? '',
            Multa: item.multa ?? '',
            Juros: item.juros ?? '',
            Taxa: item.taxa ?? '',
            ValorISSQN: item.vl_issqn ?? '',
            ISSRetido: item.iss_retido || '',
            StatusEmpresa: item.status_empresa || '',
            StatusRegistro: item.status || '',
            Observacao: item.historico || '',
            VencimentoGuia: item.vcto_guias_iss_proprio || '',
            DataEmissao: item.data_emissao || '',
            QuantidadeNota: item.qtd ?? '',
            Responsavel: item.responsavel || '',
            TeamId: item.teamId || '',
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(data, `registros_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Utilitários
    function parseDate(value: any) {
        if (!value) return '';
        const date = new Date(value);
        return isNaN(date.getTime()) ? '' : date.toISOString();
    }
    function parseFormValue(value: string) {
        if (!value) return null;
        const num = Number(value.toString().replace(',', '.'));
        return isNaN(num) ? null : num;
    }

    // Busca dados iniciais
    const fetchData = async () => {
        try {
            const accountData = await authService.getAccount();
            setUser(accountData);
            const docs = await registersService.getAllDocuments();
            setDocuments(docs.documents || []);
            const uniqueResponsaveis = [...new Set(docs.documents.map((doc: any) => doc.responsavel).filter(Boolean))];
            if (uniqueResponsaveis.length > 0) {
                await fetchUserNames(uniqueResponsaveis as string[]);
            }
        } catch {
            toast.error("Erro ao carregar dados");
        } finally {
            setLoading(false);
        }
    };

    // Deletar registro
    const handleDelete = async () => {
        if (!selectedId) return;
        try {
            await registersService.delete(selectedId);
            setDocuments((prev) => prev.filter((doc: any) => doc.$id !== selectedId));
            toast.success("Registro deletado com sucesso!");
        } catch {
            toast.error("Erro ao deletar registro");
        } finally {
            setShowConfirm(false);
            setSelectedId(null);
        }
    };

    // Filtros
    const addFilter = () => {
        if (newFilterType !== "date" && !newFilterValue.trim()) {
            toast.error("Por favor, insira um valor para filtrar");
            return;
        }
        if (newFilterType === "date" && !dateFilterValue) {
            toast.error("Por favor, selecione uma data");
            return;
        }
        const newFilter: Filter = {
            id: Date.now().toString(),
            value: newFilterType === "date"
                ? new Date(dateFilterValue).toISOString().split('T')[0]
                : newFilterValue.toLowerCase(),
            field: newFilterField,
            type: newFilterType
        };
        setFilters([...filters, newFilter]);
        setNewFilterValue("");
        setDateFilterValue("");
        setDatePickerOpen(false);
    };
    const removeFilter = (id: string) => setFilters(filters.filter(filter => filter.id !== id));
    const handleSelectForDeletion = (id: string) => { setSelectedId(id); setShowConfirm(true); };
    const handleFieldChange = (value: string) => {
        setNewFilterField(value);
        const selectedField = availableFields.find(field => field.value === value);
        if (selectedField) setNewFilterType(selectedField.type);
    };
    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: any[] = XLSX.utils.sheet_to_json(worksheet);
            for (const [index, row] of json.entries()) {
                try {
                    const payload = {
                        empresa: String(row['Empresa'] || ''),
                        loja: row['Loja'] ? Number(row['Loja']) : 0,
                        docSap: String(row['DocSAP'] || ''),
                        competencia: row['Competencia']
                            ? (row['Competencia'].length === 7
                                ? row['Competencia'] // já está no formato YYYY-MM
                                : row['Competencia'].length === 7 && row['Competencia'].includes('/')
                                    ? `${row['Competencia'].slice(3, 7)}-${row['Competencia'].slice(0, 2)}` // converte MM/YYYY para YYYY-MM
                                    : String(row['Competencia'])
                            )
                            : '',
                        tipo_registro: String(row['TipoRegistro'] || ''),
                        cnpj_tomador: String(row['CNPJTomador'] || ''),
                        municipio_tomador: String(row['MunicipioTomador'] || ''),
                        estado_tomador: String(row['EstadoTomador'] || ''),
                        im_tomador: String(row['IMTomador'] || ''),
                        cnpj_prestador: String(row['CNPJPrestador'] || ''),
                        municipio_prestador: String(row['MunicipioPrestador'] || ''),
                        estado_prestador: String(row['EstadoPrestador'] || ''),
                        im_prestador: String(row['IMPrestador'] || ''),
                        numero_nota: String(row['NumeroNota'] || ''),
                        data_nota: parseDate(row['DataNota']),
                        codigo_servico: String(row['CodigoServico'] || ''),
                        faturamento: parseFormValue(row['Faturamento']?.toString()) ?? undefined,
                        base_calculo: parseFormValue(row['BaseCalculo']?.toString()) ?? undefined,
                        aliquota: parseFormValue(row['Aliquota']?.toString()) ?? undefined,
                        multa: parseFormValue(row['Multa']?.toString()) ?? undefined,
                        juros: parseFormValue(row['Juros']?.toString()) ?? undefined,
                        taxa: parseFormValue(row['Taxa']?.toString()) ?? undefined,
                        vl_issqn: parseFormValue(row['ValorISSQN']?.toString()) ?? undefined,
                        iss_retido: String(row['ISSRetido'] || ''),
                        status_empresa: String(row['StatusEmpresa'] || ''),
                        status: row['StatusRegistro'] ? String(row['StatusRegistro']) : undefined,
                        historico: row['Observacao'] ? String(row['Observacao']) : undefined,
                        vcto_guias_iss_proprio: parseDate(row['VencimentoGuia']),
                        data_emissao: parseDate(row['DataEmissao']),
                        qtd: row['QuantidadeNota'] ? parseInt(row['QuantidadeNota']) : undefined,
                        responsavel: String(row['Responsavel'] || user?.$id || ''),
                        teamId: String(row['TeamId'] || user?.teamId || '')
                    };
                    await registersService.AddRegister(payload);
                } catch (err) {
                    toast.error(`Erro na linha ${index + 2}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
                }
            }
            toast.success("Importação concluída com sucesso!");
            fetchData();
        } catch (err) {
            toast.error(`Erro ao importar: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        } finally {
            if (e.target) e.target.value = '';
        }
    };

    useEffect(() => { fetchData(); }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // --- DESIGN MELHORADO DA PAGINAÇÃO ---
    const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / pageSize));
    const canPrev = currentPage > 1;
    const canNext = currentPage < totalPages;

    return (
        <div className="min-h-screen bg-gray-50">
            <RegistrosHeader
                onExport={exportToExcel}
                hasData={filteredDocuments.length > 0}
                onImport={handleImport}
            />

            <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <RegistrosFilters
                        filters={filters}
                        newFilterField={newFilterField}
                        newFilterValue={newFilterValue}
                        newFilterType={newFilterType}
                        dateFilterValue={dateFilterValue}
                        availableFields={availableFields}
                        onAddFilter={addFilter}
                        onRemoveFilter={removeFilter}
                        onFieldChange={handleFieldChange}
                        onValueChange={setNewFilterValue}
                        onDateChange={(date: Date | undefined) => setDateFilterValue(date ? date.toISOString().split('T')[0] : "")}
                        onClearValue={() => setNewFilterValue("")}
                        datePickerOpen={datePickerOpen}
                        setDatePickerOpen={setDatePickerOpen}
                    />
                </div>

                {/* Paginação melhorada */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <div className="flex items-center gap-2">
                        <label className="mr-2 font-medium">Registros por página:</label>
                        <select
                            value={pageSize}
                            onChange={e => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="border border-gray-400 rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150 text-gray-700 font-medium hover:border-blue-500"
                        >
                            {[10, 30, 50, 100].map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={!canPrev}
                            className={`p-2 rounded border ${canPrev ? 'hover:bg-blue-100 text-blue-700' : 'text-gray-400 cursor-not-allowed'}`}
                            title="Página anterior"
                        >
                            <FiChevronLeft size={18} />
                        </button>
                        <span className="font-medium text-gray-700">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={!canNext}
                            className={`p-2 rounded border ${canNext ? 'hover:bg-blue-100 text-blue-700' : 'text-gray-400 cursor-not-allowed'}`}
                            title="Próxima página"
                        >
                            <FiChevronRight size={18} />
                        </button>
                    </div>
                </div>

                <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="text-sm text-gray-600">
                        {filteredDocuments.length} {filteredDocuments.length === 1 ? 'registro' : 'registros'} encontrados
                    </div>
                    {filters.length > 0 && (
                        <button
                            onClick={() => setFilters([])}
                            className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                        >
                            <FiX size={14} /> Limpar todos os filtros
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <RegistrosTable
                        filteredDocuments={paginatedDocuments}
                        filters={filters}
                        sortConfig={sortConfig}
                        expandedRow={expandedRow}
                        userNames={userNames}
                        onRequestSort={requestSort}
                        onExpandRow={(id) => setExpandedRow(expandedRow === id ? null : id)}
                        onSelectForDeletion={handleSelectForDeletion}
                        onClearFilters={() => setFilters([])}
                        onDownloadPdf={downloadPdf}
                    />
                </div>
            </main>

            <DeleteConfirmationModal
                isOpen={showConfirm}
                onCancel={() => setShowConfirm(false)}
                onConfirm={handleDelete}
            />
        </div>
    );
}