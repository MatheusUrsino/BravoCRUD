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
import { formatCNPJ } from "@/utils/formatters";
import { toast } from "react-toastify";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FiX } from "react-icons/fi";
import { DatePicker } from "@/components/ui/date-picker";

export default function RegistrosPage() {
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

  const storage = new Storage(client);
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;
  const account = new AppwriteAccount(client);

  const availableFields: AvailableField[] = [
    { value: "all", label: "Todos os campos", type: "text" },
    { value: "empresa", label: "Empresa", type: "text" },
    { value: "municipio", label: "Município", type: "text" },
    { value: "loja", label: "Loja", type: "text" },
    { value: "cnpj", label: "CNPJ", type: "text" },
    { value: "status", label: "Status", type: "text" },
    { value: "vcto_guias_iss_proprio", label: "Vencimento ISS", type: "date" },
    { value: "data_emissao", label: "Data Emissão", type: "date" },
  ];
  const handleSelectForDeletion = (id: string) => {
    setSelectedId(id);
    setShowConfirm(true);
  };
  const authService = AuthService.getInstance();
  const registersService = RegistersService.getInstance();

  const adjustTimezone = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return new Date(date.getTime() + (date.getTimezoneOffset() * 60000)).toISOString();
    } catch {
      return '';
    }
  };

  const formatDateBr = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  };

  const fetchUserNames = async (userIds: string[]) => {
    const names: Record<string, string> = {};

    for (const userId of userIds) {
      try {
        const user = await account.get(userId);
        names[userId] = user.name || user.email;
      } catch (error) {
        console.error(`Erro ao buscar usuário ${userId}:`, error);
        names[userId] = "Usuário desconhecido";
      }
    }

    setUserNames(names);
  };

  const downloadPdf = async (fileId: string, fileName: string) => {
    try {
      if (!bucketId) throw new Error("Bucket ID não configurado");
      const fileUrl = storage.getFileView(bucketId, fileId);
      const response = await fetch(fileUrl.toString());
      const blob = await response.blob();
      saveAs(blob, fileName || `documento_${Date.now()}.pdf`);
      toast.success("Download iniciado!");
    } catch (error) {
      console.error("Erro ao baixar arquivo:", error);
      toast.error("Erro ao baixar arquivo");
    }
  };

  const exportToExcel = () => {
    const dataToExport = filteredDocuments.map((item) => ({
      Empresa: item.empresa || '',
      Loja: item.loja || '',
      DocumentoSAP: item.docSap || '',
      CNPJ: item.cnpj || '',
      InscricaoMunicipal: item.im || '',
      Municipio: item.municipio || '',
      StatusEmpresa: item.status_empresa || '',
      Estado: item.estado || '',
      Faturamento: item.faturamento ?? '',
      BaseCalculo: item.base_calculo ?? '',
      Aliquota: item.aliquota ?? '',
      Multa: item.multa ?? '',
      Juros: item.juros ?? '',
      Taxa: item.taxa ?? '',
      ValorISSQN: item.vl_issqn ?? '',
      Historico: item.historico || '',
      Status: item.status || '',
      VencimentoISS: item.vcto_guias_iss_proprio || '',
      DataEmissao: item.data_emissao || '',
      Quantidade: item.qtd ?? '',
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

  const fetchData = async () => {
    try {
      const accountData = await authService.getAccount();
      setUser(accountData);
      const teamId = accountData.teamId;
      if (!teamId) throw new Error("Usuário não está em nenhum time");

      const docs = await registersService.getDocumentsByTeam(teamId);
      setDocuments(docs.documents || []);

      const uniqueResponsaveis = [...new Set(docs.documents.map(doc => doc.responsavel).filter(Boolean)),];
      if (uniqueResponsaveis.length > 0) {
        await fetchUserNames(uniqueResponsaveis);
      }
    } catch (err) {
      console.error("Erro ao carregar registros:", err);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await registersService.delete(selectedId);
      setDocuments((prev) => prev.filter((doc) => doc.$id !== selectedId));
      toast.success("Registro deletado com sucesso!");
    } catch (error) {
      toast.error("Erro ao deletar registro");
      console.error("Erro ao deletar:", error);
    } finally {
      setShowConfirm(false);
      setSelectedId(null);
    }
  };

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

  const removeFilter = (id: string) => {
    setFilters(filters.filter(filter => filter.id !== id));
  };

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedDocuments = useMemo(() => {
    if (!sortConfig) return documents;
    return [...documents].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? '';
      const bValue = b[sortConfig.key] ?? '';
      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [documents, sortConfig]);

  const filteredDocuments = useMemo(() => {
    if (filters.length === 0) return sortedDocuments;

    return sortedDocuments.filter((doc) => {
      return filters.every(filter => {
        if (filter.type !== "date") {
          const searchTerm = filter.value.toLowerCase();
          if (filter.field === "all") {
            return Object.values(doc).some(value => {
              const safeValue = String(value ?? '').toLowerCase();
              return safeValue.includes(searchTerm);
            });
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

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  // Função para importar registros do Excel
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet);

      for (const row of json) {
        const payload: any = {
          empresa: row['Empresa'] || '',
          loja: row['Loja'] ? Number(row['Loja']) : null,
          docSap: row['DocumentoSAP'] || '',
          cnpj: row['CNPJ']?.toString().replace(/\D/g, '') || '',
          im: row['InscricaoMunicipal'] || '',
          municipio: row['Municipio'] || '',
          status_empresa: row['StatusEmpresa'] || '',
          estado: row['Estado']?.toString().toUpperCase() || '',
          faturamento: parseFormValue(row['Faturamento']?.toString() || ''),
          base_calculo: parseFormValue(row['BaseCalculo']?.toString() || ''),
          aliquota: parseFormValue(row['Aliquota']?.toString() || ''),
          multa: parseFormValue(row['Multa']?.toString() || ''),
          juros: parseFormValue(row['Juros']?.toString() || ''),
          taxa: parseFormValue(row['Taxa']?.toString() || ''),
          vl_issqn: parseFormValue(row['ValorISSQN']?.toString() || ''),
          historico: row['Historico'] || null,
          status: row['Status'] || null,
          vcto_guias_iss_proprio: parseDate(row['VencimentoISS']),
          data_emissao: parseDate(row['DataEmissao']),
          qtd: row['Quantidade'] ? parseInt(row['Quantidade']) : null,
          responsavel: row['Responsavel'] || user?.$id || '',
          teamId: row['TeamId'] || user?.teamId || '',
        };

        try {
          await registersService.AddRegister(payload);
        } catch (err) {
          console.error("Erro ao importar linha:", row, err);
        }
      }

      toast.success("Importação concluída!");
      fetchData();
    } catch (err) {
      toast.error("Erro ao importar Excel");
      console.error(err);
    }
  };


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
            onFieldChange={(value) => {
              setNewFilterField(value);
              const fieldType = availableFields.find(f => f.value === value)?.type || "text";
              setNewFilterType(fieldType);
              if (fieldType === "date") {
                setDatePickerOpen(true);
              } else {
                setDatePickerOpen(false);
              }
            }}
            onValueChange={setNewFilterValue}
            onDateChange={(date) => {
              if (date) {
                date.setDate(date.getDate() + 1);
                const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                setDateFilterValue(formatted);
              } else {
                setDateFilterValue("");
              }
            }}
            onClearValue={() => {
              setNewFilterValue("");
              setDateFilterValue("");
              setDatePickerOpen(false);
            }}
            datePickerOpen={datePickerOpen}
            setDatePickerOpen={setDatePickerOpen}
          />
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
            filteredDocuments={filteredDocuments}
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