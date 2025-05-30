"use client"

import { Form } from "@/components";
import { AuthService, RegistersService } from "@/service";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Storage } from "appwrite";
import client from "@/config/appwrite.config";
import { formatCNPJ } from "@/utils/formatters";
import { useTheme } from "@/context/ThemeContext";

interface FileUploadResult {
    field: string;
    fileId: string;
}

interface CurrentFile {
    id: string;
    name: string;
    url: string;
}

interface RegisterFormData {
    empresa: string;
    loja: string | number;
    docSap: string;
    competencia: string;
    tipo_registro: string;
    cnpj_tomador: string;
    municipio_tomador: string;
    estado_tomador: string;
    im_tomador: string;
    cnpj_prestador: string;
    municipio_prestador: string;
    estado_prestador: string;
    im_prestador: string;
    numero_nota: string;
    data_nota: string;
    codigo_servico: string;
    faturamento: string | number;
    base_calculo: string | number;
    aliquota: string | number;
    multa: string | number;
    juros: string | number;
    taxa: string | number;
    vl_issqn: string | number;
    iss_retido: string;
    historico: string | null;
    status: string | null;
    status_empresa: string;
    vcto_guias_iss_proprio: string;
    data_emissao: string;
    qtd: string | number | null;
    responsavel: string;
    teamId: string;
    pdf_anexo1_id: string;
    pdf_anexo2_id: string;
}

const EditRegisterPage = () => {
    const { id } = useParams<{ id: string }>();
    const { theme } = useTheme();
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

    const [register, setRegister] = useState<RegisterFormData>({
        empresa: "",
        loja: "",
        docSap: "",
        competencia: "",
        tipo_registro: "",
        cnpj_tomador: "",
        municipio_tomador: "",
        estado_tomador: "",
        im_tomador: "",
        cnpj_prestador: "",
        municipio_prestador: "",
        estado_prestador: "",
        im_prestador: "",
        numero_nota: "",
        data_nota: "",
        codigo_servico: "",
        faturamento: "",
        base_calculo: "",
        aliquota: "",
        multa: "",
        juros: "",
        taxa: "",
        vl_issqn: "",
        iss_retido: "",
        historico: null,
        status: null,
        status_empresa: "",
        vcto_guias_iss_proprio: "",
        data_emissao: "",
        qtd: null,
        responsavel: "",
        teamId: "",
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

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [fileToRemove, setFileToRemove] = useState<"pdf_anexo1" | "pdf_anexo2" | null>(null);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const parseFormValue = (value: string | null): number => {
        if (!value) return 0;
        return parseFloat(value
            .replace(/\./g, '')
            .replace(',', '.')
            .replace('%', '')
            .replace(/[^\d.-]/g, '')
        ) || 0;
    };

    const calculateVlIssqn = (currentValues: Partial<RegisterFormData> = register) => {
        const base = parseFormValue(currentValues.base_calculo?.toString() || '0');
        const aliquota = parseFormValue(currentValues.aliquota?.toString() || '0');
        const multa = parseFormValue(currentValues.multa?.toString() || '0');
        const juros = parseFormValue(currentValues.juros?.toString() || '0');
        const taxa = parseFormValue(currentValues.taxa?.toString() || '0');

        const vlIssqn = (base * (aliquota / 10000)) + multa + juros + taxa;

        return {
            raw: vlIssqn,
            formatted: vlIssqn
        };
    };

    useEffect(() => {
        const calculatedVlIssqn = calculateVlIssqn();
        setRegister(prev => ({
            ...prev,
            vl_issqn: calculatedVlIssqn.raw // Salva o valor numérico!
        }));
    }, [register.base_calculo, register.aliquota, register.multa, register.juros, register.taxa]);

    useEffect(() => {
        if (!register.data_emissao) {
            const now = new Date();
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
            const requiredFields = [
                "empresa", "loja", "docSap", "competencia", "cnpj_tomador", "im_tomador", "municipio_tomador",
                "status_empresa", "estado_tomador", "vcto_guias_iss_proprio", "data_emissao"
            ];

            for (const field of requiredFields) {
                if (!formData.get(field)) {
                    throw new Error(`Por favor, preencha o campo: ${field.toUpperCase()}`);
                }
            }

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

            const account = await authService.getAccount();
            const teamId = account.teamId;

            if (!teamId) {
                throw new Error("Usuário não está associado a nenhum time");
            }

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

            //formatações de data
            const vctoDate = formData.get("vcto_guias_iss_proprio")?.toString();
            const formattedVctoDate = vctoDate ? `${vctoDate.split('T')[0]}T00:00:00` : null;
            const competenciaMonth = formData.get("competencia")?.toString(); // ex: "2024-06"
            const competenciaDateTime = competenciaMonth ? `${competenciaMonth}-01T00:00:00.000Z` : null;


            // Criar payload com tipos corretos
            const payload = {
                empresa: formData.get("empresa")?.toString() || '',
                loja: Number(formData.get("loja") || 0),
                docSap: formData.get("docSap")?.toString() || '',
                competencia: competenciaDateTime || undefined,
                tipo_registro: formData.get("tipo_registro")?.toString() || '',
                cnpj_tomador: formData.get("cnpj_tomador")?.toString() || '',
                municipio_tomador: formData.get("municipio_tomador")?.toString() || '',
                estado_tomador: formData.get("estado_tomador")?.toString() || '',
                im_tomador: formData.get("im_tomador")?.toString() || '',
                cnpj_prestador: formData.get("cnpj_prestador")?.toString() || '',
                municipio_prestador: formData.get("municipio_prestador")?.toString() || '',
                estado_prestador: formData.get("estado_prestador")?.toString() || '',
                im_prestador: formData.get("im_prestador")?.toString() || '',
                numero_nota: formData.get("numero_nota")?.toString() || '',
                data_nota: formData.get("data_nota")?.toString() || '',
                codigo_servico: formData.get("codigo_servico")?.toString() || '',
                faturamento: parseFormValue(formData.get("faturamento")?.toString() || ''),
                base_calculo: parseFormValue(formData.get("base_calculo")?.toString() || ''),
                aliquota: parseFormValue(formData.get("aliquota")?.toString() || ''),
                multa: parseFormValue(formData.get("multa")?.toString() || ''),
                juros: parseFormValue(formData.get("juros")?.toString() || ''),
                taxa: parseFormValue(formData.get("taxa")?.toString() || ''),
                vl_issqn: finalCalculation.raw,
                iss_retido: formData.get("iss_retido")?.toString() || '',
                status_empresa: formData.get("status_empresa")?.toString() || '',
                status: formData.get("status")?.toString() || null,
                historico: formData.get("historico")?.toString() || null,
                vcto_guias_iss_proprio: formattedVctoDate,
                data_emissao: new Date(formData.get("data_emissao")?.toString() || '').toISOString(),
                qtd: formData.get("qtd") ? parseInt(formData.get("qtd")?.toString() || '0') : null,
                responsavel: account.$id,
                teamId: teamId,
                pdf_anexo1_id: fileIds.pdf_anexo1_id,
                pdf_anexo2_id: fileIds.pdf_anexo2_id
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

                    const initialVlIssqn = calculateVlIssqn({
                        ...registerData,
                        base_calculo: registerData.base_calculo?.toString() || '',
                        aliquota: registerData.aliquota?.toString() || '',
                        multa: registerData.multa?.toString() || '',
                        juros: registerData.juros?.toString() || '',
                        taxa: registerData.taxa?.toString() || ''
                    });

                    setRegister({
                        empresa: registerData.empresa?.toString() || "",
                        loja: registerData.loja?.toString() || "",
                        docSap: registerData.docSap || "",
                        competencia: registerData.competencia ? registerData.competencia.slice(0, 7) : "",
                        tipo_registro: registerData.tipo_registro || "",
                        cnpj_tomador: registerData.cnpj_tomador || "",
                        municipio_tomador: registerData.municipio_tomador || "",
                        estado_tomador: registerData.estado_tomador || "",
                        im_tomador: registerData.im_tomador || "",
                        cnpj_prestador: registerData.cnpj_prestador || "",
                        municipio_prestador: registerData.municipio_prestador || "",
                        estado_prestador: registerData.estado_prestador || "",
                        im_prestador: registerData.im_prestador || "",
                        numero_nota: registerData.numero_nota || "",
                        data_nota: registerData.data_nota?.split('T')[0] || "",
                        codigo_servico: registerData.codigo_servico || "",
                        faturamento: registerData.faturamento?.toString() || "",
                        base_calculo: registerData.base_calculo?.toString() || "",
                        aliquota: registerData.aliquota?.toString() || "",
                        multa: registerData.multa?.toString() || "",
                        juros: registerData.juros?.toString() || "",
                        taxa: registerData.taxa?.toString() || "",
                        vl_issqn: initialVlIssqn.formatted,
                        iss_retido: registerData.iss_retido || "",
                        historico: registerData.historico || null,
                        status: registerData.status || null,
                        status_empresa: registerData.status_empresa || "",
                        vcto_guias_iss_proprio: registerData.vcto_guias_iss_proprio?.split('T')[0] || "",
                        data_emissao: registerData.data_emissao?.split('T')[0] || "",
                        qtd: registerData.qtd?.toString() || null,
                        responsavel: registerData.responsavel || "",
                        teamId: registerData.teamId || "",
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
        <div className={theme === "dark"
            ? "min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-2 sm:px-6 lg:px-8"
            : "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-2 sm:px-6 lg:px-8"
        }>
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className={`text-3xl sm:text-4xl font-extrabold mb-2 ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>
                        Editar Registro
                    </h1>
                    <p className={`text-base sm:text-lg ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        Atualize os campos necessários para o registro #{id}
                    </p>
                </div>

                <div className={theme === "dark"
                    ? "bg-gray-800 shadow-xl rounded-2xl overflow-hidden"
                    : "bg-white shadow-xl rounded-2xl overflow-hidden"
                }>
                    <div className="p-4 sm:p-8">
                        <div className={`border-b pb-4 mb-4 ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                            <h2 className={`text-xl sm:text-2xl font-semibold ${theme === "dark" ? "text-gray-100" : "text-gray-800"}`}>
                                Edição de Registro
                            </h2>
                            <p className={`mt-1 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                                Atualize as informações conforme necessário
                            </p>
                        </div>
                        {register ? (
                            <Form
                                loading={loading}
                                onSubmit={handleSubmit}
                                fields={[
                                    // --- Dados Gerais ---
                                    { type: "section", label: "Dados Gerais" },
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
                                        type: "number",
                                        value: register.loja?.toString() ?? "",
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
                                        name: "competencia",
                                        label: "COMPETÊNCIA",
                                        type: "month",
                                        value: register.competencia ? register.competencia.slice(0, 7) : "",
                                        required: true,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "tipo_registro",
                                        label: "TIPO DE REGISTRO",
                                        type: "select",
                                        value: register.tipo_registro,
                                        options: [
                                            { value: "", label: "Selecione" },
                                            { value: "PRESTADO", label: "Prestado" },
                                            { value: "TOMADO", label: "Tomado" }
                                        ],
                                        required: true,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },

                                    // --- Tomador ---
                                    { type: "section", label: "Dados do Tomador" },
                                    {
                                        name: "cnpj_tomador",
                                        label: "CNPJ TOMADOR",
                                        type: "text",
                                        mask: "cnpj",
                                        value: register.cnpj_tomador,
                                        placeholder: "00.000.000/0000-00",
                                        maxLength: 18,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "municipio_tomador",
                                        label: "MUNICÍPIO TOMADOR",
                                        type: "text",
                                        value: register.municipio_tomador,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "estado_tomador",
                                        label: "ESTADO TOMADOR (UF)",
                                        type: "text",
                                        value: register.estado_tomador,
                                        maxLength: 2,
                                        placeholder: "Ex: SP",
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "im_tomador",
                                        label: "INSCRIÇÃO MUNICIPAL TOMADOR",
                                        type: "text",
                                        value: register.im_tomador,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },

                                    // --- Prestador ---
                                    { type: "section", label: "Dados do Prestador" },
                                    {
                                        name: "cnpj_prestador",
                                        label: "CNPJ PRESTADOR",
                                        type: "text",
                                        mask: "cnpj",
                                        value: register.cnpj_prestador,
                                        placeholder: "00.000.000/0000-00",
                                        maxLength: 18,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "municipio_prestador",
                                        label: "MUNICÍPIO PRESTADOR",
                                        type: "text",
                                        value: register.municipio_prestador,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "estado_prestador",
                                        label: "ESTADO PRESTADOR (UF)",
                                        type: "text",
                                        value: register.estado_prestador,
                                        maxLength: 2,
                                        placeholder: "Ex: SP",
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "im_prestador",
                                        label: "INSCRIÇÃO MUNICIPAL PRESTADOR",
                                        type: "text",
                                        value: register.im_prestador,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },

                                    // --- Nota ---
                                    { type: "section", label: "Dados da Nota" },
                                    {
                                        name: "numero_nota",
                                        label: "NÚMERO DA NOTA",
                                        type: "text",
                                        value: register.numero_nota,
                                        required: true,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "data_nota",
                                        label: "DATA DA NOTA",
                                        type: "date",
                                        value: register.data_nota,
                                        required: true,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "codigo_servico",
                                        label: "CÓDIGO DO SERVIÇO",
                                        type: "text",
                                        value: register.codigo_servico,
                                        required: true,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },

                                    // --- Financeiro ---
                                    { type: "section", label: "Dados Financeiros" },
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
                                        label: "BASE DE CÁLCULO",
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
                                        value: formatCurrency(Number(register.vl_issqn) || 0),
                                        placeholder: "0,00",
                                        mask: "currency",
                                        readOnly: true,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "iss_retido",
                                        label: "ISS RETIDO?",
                                        type: "select",
                                        value: register.iss_retido,
                                        options: [
                                            { value: "", label: "Selecione" },
                                            { value: "SIM", label: "Sim" },
                                            { value: "NAO", label: "Não" }
                                        ],
                                        required: true,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },

                                    // --- Outros ---
                                    { type: "section", label: "Outros Dados" },
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
                                        name: "status",
                                        label: "STATUS REGISTRO",
                                        type: "select",
                                        value: register.status,
                                        options: [
                                            { value: "", label: "Selecione..." },
                                            { value: "CONCLUIDO", label: "Concluído" },
                                            { value: "PENDENTE", label: "Pendente" },
                                            { value: "ERRO_SISTEMA", label: "Erro de Sistema" },
                                            { value: "ERRO_LOGIN", label: "Erro de login" },
                                            { value: "MODULO_NAO_HABILITADO", label: "Módulo de escrituração não habilitado" },
                                            { value: "SEM_ACESSO", label: "Sem acesso" },
                                            { value: "PENDENCIA", label: "Pendência" },
                                            { value: "SEM_MOVIMENTO", label: "Sem movimento" }
                                        ],
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "historico",
                                        label: "OBSERVAÇÃO",
                                        type: "textarea",
                                        value: register.historico,
                                        containerClass: "col-span-2 sm:col-span-2"
                                    },
                                    {
                                        name: "vcto_guias_iss_proprio",
                                        label: "VENCIMENTO DA GUIA",
                                        type: "date",
                                        value: register.vcto_guias_iss_proprio,
                                        required: true,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "data_emissao",
                                        label: "DATA DE EMISSÃO",
                                        type: "date",
                                        value: register.data_emissao,
                                        required: true,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "qtd",
                                        label: "QUANTIDADE DE NOTA",
                                        type: "text",
                                        value: register.qtd,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "responsavel",
                                        label: "RESPONSÁVEL",
                                        type: "text",
                                        value: register.responsavel,
                                        readOnly: true,
                                        containerClass: "col-span-1 sm:col-span-1"
                                    },
                                    {
                                        name: "pdf_anexo1",
                                        label: "Guia de recolhimento",
                                        type: "file",
                                        accept: "application/pdf",
                                        description: currentFiles.pdf_anexo1 ? (
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={theme === "dark" ? "text-sm text-gray-300" : "text-sm text-gray-500"}>Arquivo atual: </span>
                                                <a
                                                    href={currentFiles.pdf_anexo1.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={theme === "dark" ? "text-sm text-indigo-300 hover:underline" : "text-sm text-indigo-600 hover:underline"}
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
                                                    className={theme === "dark" ? "text-sm text-red-400 hover:text-red-600 ml-2" : "text-sm text-red-600 hover:text-red-800 ml-2"}
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
                                                <span className={theme === "dark" ? "text-sm text-gray-300" : "text-sm text-gray-500"}>Arquivo atual: </span>
                                                <a
                                                    href={currentFiles.pdf_anexo2.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={theme === "dark" ? "text-sm text-indigo-300 hover:underline" : "text-sm text-indigo-600 hover:underline"}
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
                                                    className={theme === "dark" ? "text-sm text-red-400 hover:text-red-600 ml-2" : "text-sm text-red-600 hover:text-red-800 ml-2"}
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        ) : "Nenhum arquivo enviado",
                                        containerClass: "col-span-1 sm:col-span-1"
                                    }
                                ]}
                                btnTitle="Atualizar Registro"
                                btnClass={`w-full mt-5 font-medium transition-colors duration-200 rounded-lg py-3 px-4 ${theme === "dark"
                                        ? "bg-indigo-700 hover:bg-indigo-800 text-white"
                                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                    }`}
                                gridClass="grid grid-cols-1 sm:grid-cols-2 gap-6"
                            />
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-red-500 text-2xl font-medium mb-4">
                                    Registro não encontrado
                                </div>
                                <button
                                    onClick={() => router.push("/registros")}
                                    className={theme === "dark"
                                        ? "mt-4 px-6 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 transition-colors w-full sm:w-auto"
                                        : "mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto"}
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
                    <div className={theme === "dark" ? "bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full" : "bg-white rounded-lg shadow-lg p-6 max-w-sm w-full"}>
                        <h3 className={theme === "dark" ? "text-lg font-semibold mb-4 text-gray-100" : "text-lg font-semibold mb-4"}>Remover arquivo</h3>
                        <p className={theme === "dark" ? "mb-6 text-gray-300" : "mb-6"}>Tem certeza que deseja remover este arquivo? Esta ação não pode ser desfeita.</p>
                        <div className="flex justify-end gap-2">
                            <button
                                className={theme === "dark"
                                    ? "px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-200"
                                    : "px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"}
                                onClick={() => setShowConfirmModal(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className={theme === "dark"
                                    ? "px-4 py-2 rounded bg-red-700 hover:bg-red-800 text-white"
                                    : "px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"}
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