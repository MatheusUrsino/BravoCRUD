"use client"

import { Form } from "@/components";
import { AuthService, RegistersService } from "@/service";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Storage } from "appwrite";
import client from "@/config/appwrite.config";
import { formatCNPJ } from "@/utils/formatters";

interface FileUploadResult {
    field: string;
    fileId: string;
}

interface CurrentFile {
    id: string;
    name: string;
    url: string;
}

const EditRegisterPage = () => {
    const { id } = useParams<{ id: string }>();
    const registersService = RegistersService.getInstance();
    const authService = AuthService.getInstance();
    const [loading, setLoading] = useState<boolean>(false);
    const [registerLoading, setRegisterLoading] = useState<boolean>(true);
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const storage = new Storage(client);
    const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;

    if (!bucketId) {
        throw new Error("NEXT_PUBLIC_APPWRITE_BUCKET_ID não está configurado");
    }

    const [register, setRegister] = useState({
        empresa: "",
        loja: "",
        docSap: "",
        cnpj: "",
        im: "",
        municipio: "",
        status_empresa: "",
        estado: "",
        responsavel: "",
        faturamento: "",
        base_calculo: "",
        aliquota: "",
        multa: "",
        juros: "",
        taxa: "",
        vl_issqn: "",
        historico: "",
        status: "",
        vcto_guias_iss_proprio: "",
        data_emissao: "",
        qtd: "",
        pdf_anexo1_id: "",
        pdf_anexo2_id: ""
    });

    const [currentFiles, setCurrentFiles] = useState<{
        pdf_anexo1: CurrentFile | null;
        pdf_anexo2: CurrentFile | null;
    }>({
        pdf_anexo1: null,
        pdf_anexo2: null
    });

    // Modal de confirmação
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [fileToRemove, setFileToRemove] = useState<"pdf_anexo1" | "pdf_anexo2" | null>(null);

    // Função para formatar valores monetários
    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Função robusta para converter valores do formulário para número
    const parseFormValue = (value: string | null): number => {
        if (!value) return 0;
        return parseFloat(value
            .replace(/\./g, '')
            .replace(',', '.')
            .replace('%', '')
            .replace(/[^\d.-]/g, '')
        ) || 0;
    };

    // Cálculo completo do ISSQN
    const calculateVlIssqn = (currentValues: Partial<typeof register> = register) => {
        const base = parseFormValue(currentValues.base_calculo || '0');
        const aliquota = parseFormValue(currentValues.aliquota || '0');
        const multa = parseFormValue(currentValues.multa || '0');
        const juros = parseFormValue(currentValues.juros || '0');
        const taxa = parseFormValue(currentValues.taxa || '0');

        const vlIssqn = (base * (aliquota / 100)) + multa + juros + taxa;

        return {
            raw: vlIssqn,
            formatted: formatCurrency(vlIssqn)
        };
    };

    // Atualiza o cálculo sempre que os campos relevantes mudam
    useEffect(() => {
        const calculatedVlIssqn = calculateVlIssqn();
        setRegister(prev => ({
            ...prev,
            vl_issqn: calculatedVlIssqn.formatted
        }));
    }, [register.base_calculo, register.aliquota, register.multa, register.juros, register.taxa]);

    // Autocompletar data de emissão igual ao AddPage
    useEffect(() => {
        if (!register.data_emissao) {
            const now = new Date();
            // Ajusta para o fuso local e pega YYYY-MM-DD
            const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                .toISOString()
                .split('T')[0];
            setRegister(prev => ({
                ...prev,
                data_emissao: localISO
            }));
        }
    }, [register.data_emissao]);

    const handleSubmit = async (formData: FormData) => {
        if (!id) {
            toast.error("ID do registro não encontrado");
            return;
        }

        setLoading(true);

        try {
            // Validação de campos obrigatórios
            const requiredFields = [
                "empresa", "loja", "docSap", "cnpj", "im", "municipio",
                "status_empresa", "estado", "vcto_guias_iss_proprio", "data_emissao"
            ];

            for (const field of requiredFields) {
                if (!formData.get(field)) {
                    throw new Error(`Por favor, preencha o campo: ${field.toUpperCase()}`);
                }
            }

            // Cálculo FINAL com os valores mais recentes
            const finalCalculation = calculateVlIssqn({
                ...register,
                base_calculo: formData.get('base_calculo')?.toString() || '',
                aliquota: formData.get('aliquota')?.toString() || '',
                multa: formData.get('multa')?.toString() || '',
                juros: formData.get('juros')?.toString() || '',
                taxa: formData.get('taxa')?.toString() || '',
                faturamento: formData.get('faturamento')?.toString() || '',
                vl_issqn: ''
            });

            // Obter dados da conta
            const account = await authService.getAccount();
            const teamId = account.teamId;

            if (!teamId) {
                throw new Error("Usuário não está associado a nenhum time");
            }

            // Processamento de arquivos
            const pdfAnexo1 = formData.get("pdf_anexo1");
            const pdfAnexo2 = formData.get("pdf_anexo2");
            const hasFiles = (pdfAnexo1 instanceof File && pdfAnexo1.size > 0) ||
                (pdfAnexo2 instanceof File && pdfAnexo2.size > 0);

            const fileIds = {
                pdf_anexo1_id: register.pdf_anexo1_id,
                pdf_anexo2_id: register.pdf_anexo2_id
            };

            if (hasFiles) {
                const uploadFormData = new FormData();

                if (pdfAnexo1 instanceof File && pdfAnexo1.size > 0) {
                    uploadFormData.append('pdf_anexo1', pdfAnexo1);
                }
                if (pdfAnexo2 instanceof File && pdfAnexo2.size > 0) {
                    uploadFormData.append('pdf_anexo2', pdfAnexo2);
                }

                uploadFormData.append('registerId', id);

                const uploadResponse = await registersService.AddRegisterWithFiles(uploadFormData);

                if (uploadResponse.success && uploadResponse.results) {
                    uploadResponse.results.forEach((result: FileUploadResult) => {
                        if (result.field === 'pdf_anexo1') fileIds.pdf_anexo1_id = result.fileId;
                        if (result.field === 'pdf_anexo2') fileIds.pdf_anexo2_id = result.fileId;
                    });
                }
            }

            // Formatar data de vencimento
            const vctoDate = formData.get("vcto_guias_iss_proprio")?.toString();
            const formattedVctoDate = vctoDate ? `${vctoDate.split('T')[0]}T00:00:00` : null;

            // Criar payload com tipos corretos
            const payload = {
                empresa: formData.get("empresa")?.toString() || '',
                loja: Number(formData.get("loja")),
                docSap: formData.get("docSap")?.toString() || '',
                cnpj: formData.get("cnpj")?.toString().replace(/\D/g, '') || '',
                im: formData.get("im")?.toString() || '',
                municipio: formData.get("municipio")?.toString() || '',
                status_empresa: formData.get("status_empresa")?.toString() || '',
                estado: formData.get("estado")?.toString().toUpperCase() || '',
                faturamento: parseFormValue(formData.get("faturamento")?.toString() || ''),
                base_calculo: parseFormValue(formData.get("base_calculo")?.toString() || ''),
                aliquota: parseFormValue(formData.get("aliquota")?.toString() || ''),
                multa: parseFormValue(formData.get("multa")?.toString() || ''),
                juros: parseFormValue(formData.get("juros")?.toString() || ''),
                taxa: parseFormValue(formData.get("taxa")?.toString() || ''),
                vl_issqn: finalCalculation.raw, // Usa o valor calculado diretamente
                historico: formData.get("historico")?.toString() || null,
                status: formData.get("status")?.toString() || null,
                vcto_guias_iss_proprio: formattedVctoDate,
                data_emissao: new Date(formData.get("data_emissao")?.toString() || '').toISOString(),
                qtd: formData.get("qtd") ? parseInt(formData.get("qtd")?.toString() || '0') : null,
                responsavel: account.$id,
                teamId: teamId,
                ...fileIds
            };

            await registersService.update(id, payload);
            toast.success("Registro atualizado com sucesso!");
            router.push("/registros");

        } catch (err: any) {
            toast.error(err.message || "Ocorreu um erro ao atualizar o registro");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFile = async (field: 'pdf_anexo1' | 'pdf_anexo2') => {
        try {
            const fileId = field === 'pdf_anexo1' ? register.pdf_anexo1_id : register.pdf_anexo2_id;
            if (!fileId) return;

            // Remove do Appwrite Storage
            await storage.deleteFile(bucketId, fileId);

            setCurrentFiles(prev => ({
                ...prev,
                [field]: null
            }));

            setRegister(prev => ({
                ...prev,
                [`${field}_id`]: ""
            }));

            toast.success("Arquivo removido com sucesso!");
        } catch (error) {
            toast.error("Erro ao remover arquivo");
            console.error(error);
        }
    };

    useEffect(() => {
        const fetchUserAndRegister = async () => {
            try {
                const userData = await authService.getAccount();
                setUser(userData);

                if (id) {
                    const registerData = await registersService.getDocument(id);

                    const files = {
                        pdf_anexo1: null as CurrentFile | null,
                        pdf_anexo2: null as CurrentFile | null
                    };

                    if (registerData.pdf_anexo1_id) {
                        const fileDetails = await registersService.getFileDetails(registerData.pdf_anexo1_id);
                        const fileUrl = storage.getFileView(bucketId, registerData.pdf_anexo1_id);
                        files.pdf_anexo1 = {
                            id: registerData.pdf_anexo1_id,
                            name: fileDetails.name,
                            url: fileUrl.toString()
                        };
                    }

                    if (registerData.pdf_anexo2_id) {
                        const fileDetails = await registersService.getFileDetails(registerData.pdf_anexo2_id);
                        const fileUrl = storage.getFileView(bucketId, registerData.pdf_anexo2_id);
                        files.pdf_anexo2 = {
                            id: registerData.pdf_anexo2_id,
                            name: fileDetails.name,
                            url: fileUrl.toString()
                        };
                    }

                    // Calcular vl_issqn inicial
                    const initialVlIssqn = calculateVlIssqn({
                        ...registerData,
                        base_calculo: registerData.base_calculo?.toString() || '',
                        aliquota: registerData.aliquota?.toString() || '',
                        multa: registerData.multa?.toString() || '',
                        juros: registerData.juros?.toString() || '',
                        taxa: registerData.taxa?.toString() || ''
                    });

                    setRegister({
                        ...registerData,
                        empresa: registerData.empresa?.toString() || "",
                        loja: registerData.loja || "",
                        docSap: registerData.docSap || "",
                        cnpj: registerData.cnpj ? formatCNPJ(registerData.cnpj) : "",
                        im: registerData.im || "",
                        municipio: registerData.municipio || "",
                        status_empresa: registerData.status_empresa || "",
                        estado: registerData.estado || "",
                        responsavel: registerData.responsavel || "",
                        faturamento: registerData.faturamento?.toString() || "",
                        base_calculo: registerData.base_calculo?.toString() || "",
                        aliquota: registerData.aliquota?.toString() || "",
                        multa: registerData.multa?.toString() || "",
                        juros: registerData.juros?.toString() || "",
                        taxa: registerData.taxa?.toString() || "",
                        vl_issqn: initialVlIssqn.formatted,
                        historico: registerData.historico || "",
                        status: registerData.status || "",
                        vcto_guias_iss_proprio: registerData.vcto_guias_iss_proprio?.split('T')[0] || "",
                        data_emissao: registerData.data_emissao?.split('T')[0] || "",
                        qtd: registerData.qtd?.toString() || "",
                        pdf_anexo1_id: registerData.pdf_anexo1_id || "",
                        pdf_anexo2_id: registerData.pdf_anexo2_id || ""
                    });
                    setCurrentFiles(files);
                }
            } catch (err) {
                toast.error("Erro ao carregar dados");
                console.error(err);
            } finally {
                setRegisterLoading(false);
            }
        };

        fetchUserAndRegister();
    }, [id]);

    if (registerLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-2">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-base sm:text-lg font-medium text-gray-700">Carregando registro...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-2 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
                        Editar Registro
                    </h1>
                    <p className="text-base sm:text-lg text-gray-600">
                        Atualize os campos necessários para o registro #{id}
                    </p>
                </div>
    
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                    <div className="p-4 sm:p-8">
                        <div className="border-b border-gray-200 pb-4 mb-4">
                            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                                Edição de Registro
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Atualize as informações conforme necessário
                            </p>
                        </div>
                        {register ? (
                            <Form
                                loading={loading}
                                onSubmit={handleSubmit}
                                fields={[
                                    {
                                        name: "empresa",
                                        label: "EMPRESA",
                                        type: "text",
                                        value: register.empresa,
                                        required: true,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "loja",
                                        label: "LOJA",
                                        type: "text",
                                        value: register.loja,
                                        required: true,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "docSap",
                                        label: "DOC SAP",
                                        type: "text",
                                        value: register.docSap,
                                        required: true,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "cnpj",
                                        label: "CNPJ",
                                        type: "text",
                                        mask: "cnpj",
                                        value: register.cnpj,
                                        placeholder: "00.000.000/0000-00",
                                        required: true,
                                        maxLength: 18,
                                    },
                                    {
                                        name: "im",
                                        label: "I.M",
                                        type: "text",
                                        value: register.im,
                                        required: true,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "municipio",
                                        label: "Município",
                                        type: "text",
                                        value: register.municipio,
                                        required: true,
                                        containerClass: "col-span-1 sm:col-span-2"
                                    },
                                    {
                                        name: "status_empresa",
                                        label: "STATUS EMPRESA",
                                        type: "select",
                                        value: register.status_empresa,
                                        options: [
                                            { value: "Ativa", label: "Ativa" },
                                            { value: "Inativa", label: "Inativa" },
                                            { value: "Suspensa", label: "Suspensa" }
                                        ],
                                        required: true,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "estado",
                                        label: "Estado (UF)",
                                        type: "text",
                                        value: register.estado,
                                        maxLength: 2,
                                        placeholder: "Ex: SP",
                                        required: true,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "responsavel",
                                        label: "Responsável",
                                        type: "text",
                                        value: register.responsavel,
                                        readOnly: true,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "faturamento",
                                        label: "FATURAMENTO",
                                        type: "text",
                                        value: register.faturamento,
                                        placeholder: "0,00",
                                        mask: "currency",
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "base_calculo",
                                        label: "BASE DE CALCULO",
                                        type: "text",
                                        value: register.base_calculo,
                                        placeholder: "0,00",
                                        mask: "currency",
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "aliquota",
                                        label: "ALÍQUOTA",
                                        type: "text",
                                        value: register.aliquota,
                                        placeholder: "0,00%",
                                        mask: "percentage",
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "multa",
                                        label: "MULTA",
                                        type: "text",
                                        value: register.multa,
                                        placeholder: "0,00",
                                        mask: "currency",
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "juros",
                                        label: "JUROS",
                                        type: "text",
                                        value: register.juros,
                                        placeholder: "0,00",
                                        mask: "currency",
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "taxa",
                                        label: "TAXA",
                                        type: "text",
                                        value: register.taxa,
                                        placeholder: "0,00",
                                        mask: "currency",
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "vl_issqn",
                                        label: "VL. ISSQN",
                                        type: "text",
                                        value: register.vl_issqn,
                                        placeholder: "0,00",
                                        mask: "currency",
                                        readOnly: true,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "historico",
                                        label: "HISTÓRICO",
                                        type: "textarea",
                                        value: register.historico,
                                        containerClass: "col-span-2 sm:col-span-2"
                                    },
                                    {
                                        name: "status",
                                        label: "STATUS",
                                        type: "select",
                                        value: register.status,
                                        options: [
                                            { value: "", label: "Selecione..." },
                                            { value: "Concluído", label: "Concluído" },
                                            { value: "Pendente", label: "Pendente" }
                                        ],
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "vcto_guias_iss_proprio",
                                        label: "VCTO GUIAS ISS PRÓPRIO",
                                        type: "date",
                                        value: register.vcto_guias_iss_proprio,
                                        required: true,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "data_emissao",
                                        label: "DATA - EMISSÃO",
                                        type: "date",
                                        value: register.data_emissao,
                                        required: true,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "qtd",
                                        label: "QTD",
                                        type: "text",
                                        value: register.qtd,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "pdf_anexo1",
                                        label: "Guia de recolhimento",
                                        type: "file",
                                        accept: "application/pdf",
                                        description: currentFiles.pdf_anexo1 ? (
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-sm text-gray-500">Arquivo atual: </span>
                                                <a
                                                    href={currentFiles.pdf_anexo1.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-indigo-600 hover:underline"
                                                >
                                                    {currentFiles.pdf_anexo1.name}
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setFileToRemove('pdf_anexo1');
                                                        setShowConfirmModal(true);
                                                    }}
                                                    className="text-sm text-red-600 hover:text-red-800 ml-2"
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        ) : "Nenhum arquivo enviado",
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "pdf_anexo2",
                                        label: "Protocolo",
                                        type: "file",
                                        accept: "application/pdf",
                                        description: currentFiles.pdf_anexo2 ? (
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-sm text-gray-500">Arquivo atual: </span>
                                                <a
                                                    href={currentFiles.pdf_anexo2.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-indigo-600 hover:underline"
                                                >
                                                    {currentFiles.pdf_anexo2.name}
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setFileToRemove('pdf_anexo2');
                                                        setShowConfirmModal(true);
                                                    }}
                                                    className="text-sm text-red-600 hover:text-red-800 ml-2"
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        ) : "Nenhum arquivo enviado",
                                        containerClass: "col-span-1 sm:col-span-1"
                                    }
                                ]}
                                btnTitle="Atualizar Registro"
                                btnClass="w-full mt-5 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
                                gridClass="grid grid-cols-1 sm:grid-cols-2 gap-6"
                            />
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-red-500 text-2xl font-medium mb-4">
                                    Registro não encontrado
                                </div>
                                <button
                                    onClick={() => router.push("/registros")}
                                    className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto"
                                >
                                    Voltar para a lista
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de confirmação */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-semibold mb-4">Remover arquivo</h3>
                        <p className="mb-6">Tem certeza que deseja remover este arquivo? Esta ação não pode ser desfeita.</p>
                        <div className="flex justify-end gap-2">
                            <button
                                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
                                onClick={() => setShowConfirmModal(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                                onClick={async () => {
                                    if (fileToRemove) {
                                        await handleRemoveFile(fileToRemove);
                                    }
                                    setShowConfirmModal(false);
                                    setFileToRemove(null);
                                }}
                            >
                                Remover
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditRegisterPage;