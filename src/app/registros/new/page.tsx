"use client"

import { Form } from "@/components";
import { AuthService, RegistersService } from "@/service";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const AddRegisterPage = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const authService = AuthService.getInstance();
    const registerService = RegistersService.getInstance();

    const [autoFields, setAutoFields] = useState({
        responsavelNome: '',
        responsavelId: '',
        data_emissao: new Date().toISOString().slice(0, 16)
    });

    const statusEmpresaOptions = [
        { value: "Ativa", label: "Ativa" },
        { value: "Inativa", label: "Inativa" },
        { value: "Suspensa", label: "Suspensa" }
    ];

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await authService.getAccount();
                setUser(data);
                setAutoFields(prev => ({
                    ...prev,
                    responsavelNome: data.name || data.email,
                    responsavelId: data.$id
                }));
            } catch (error) {
                toast.error("Falha ao carregar dados do usuário");
                console.error(error);
            }
        };
        fetchUser();
    }, []);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);

        try {
            const requiredFields = [
                "empresa", "loja", "cnpj", "im", "municipio",
                "status_empresa", "estado"
            ];

            for (const field of requiredFields) {
                if (!formData.get(field)) {
                    throw new Error(`Por favor, preencha o campo: ${field.toUpperCase()}`);
                }
            }

            const account = await authService.getAccount();
            const teamId = account.teamId;

            if (!teamId) {
                throw new Error("Usuário não está associado a nenhum time");
            }

            const payload = {
                empresa: Number(formData.get("empresa")),
                loja: formData.get("loja")?.toString() || '',
                cnpj: formData.get("cnpj")?.toString().replace(/\D/g, '') || '',
                im: formData.get("im")?.toString() || '',
                municipio: formData.get("municipio")?.toString() || '',
                status_empresa: formData.get("status_empresa")?.toString() || '',
                estado: formData.get("estado")?.toString().toUpperCase() || '',
                faturamento: formData.get("faturamento") ?
                    parseFloat(formData.get("faturamento")?.toString().replace(",", ".") || '0') : null,
                base_calculo: formData.get("base_calculo") ?
                    parseFloat(formData.get("base_calculo")?.toString().replace(",", ".") || '0') : null,
                aliquota: formData.get("aliquota") ?
                    parseFloat(formData.get("aliquota")?.toString().replace(",", ".") || '0') : null,
                vl_issqn: formData.get("vl_issqn") ?
                    parseFloat(formData.get("vl_issqn")?.toString().replace(",", ".") || '0') : null,
                historico: formData.get("historico")?.toString() || null,
                status: formData.get("status")?.toString() || null,
                ocorrencia: formData.get("ocorrencia")?.toString() || null,
                vcto_guias_iss_proprio: formData.get("vcto_guias_iss_proprio") ?
                    new Date(formData.get("vcto_guias_iss_proprio")?.toString() || '').toISOString() : null,
                data_emissao: new Date(autoFields.data_emissao).toISOString(),
                qtd: formData.get("qtd") ?
                    parseInt(formData.get("qtd")?.toString() || '0') : null,
                responsavel: autoFields.responsavelId,
                teamId: teamId
            };

            const registerResponse = await registerService.AddRegister(payload);

            const pdfAnexo1 = formData.get("pdf_anexo1");
            const pdfAnexo2 = formData.get("pdf_anexo2");
            const hasFiles = (pdfAnexo1 instanceof File && pdfAnexo1.size > 0) ||
                (pdfAnexo2 instanceof File && pdfAnexo2.size > 0);

            if (hasFiles) {
                const filesFormData = new FormData();

                if (pdfAnexo1 instanceof File && pdfAnexo1.size > 0) {
                    filesFormData.append('pdf_anexo1', pdfAnexo1);
                }
                if (pdfAnexo2 instanceof File && pdfAnexo2.size > 0) {
                    filesFormData.append('pdf_anexo2', pdfAnexo2);
                }

                filesFormData.append('registerId', registerResponse.$id);
                await registerService.AddRegisterWithFiles(filesFormData);
            }

            toast.success("Registro criado com sucesso!");
            router.push("/registros");

        } catch (err: any) {
            toast.error(err.message || "Ocorreu um erro ao criar o registro");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">
                        Novo Registro
                    </h1>
                    <p className="text-lg text-gray-600">
                        Preencha todos os campos obrigatórios para criar um novo registro
                    </p>
                </div>

                <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                    <div className="p-6 sm:p-8">
                        <div className="border-b border-gray-200 pb-6 mb-6">
                            <h2 className="text-2xl font-semibold text-gray-800">
                                Informações Básicas
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Dados essenciais para identificação do registro
                            </p>
                        </div>

                        <Form
                            loading={loading}
                            onSubmit={handleSubmit}
                            fields={[
                                {
                                    name: "empresa",
                                    label: "EMPRESA",
                                    type: "text",
                                    required: true,
                                    containerClass: "col-span-1 sm:col-span-1"
                                },
                                {
                                    name: "loja",
                                    label: "LOJA",
                                    type: "text",
                                    required: true,
                                    containerClass: "col-span-1 sm:col-span-1"
                                },
                                {
                                    name: "cnpj",
                                    label: "CNPJ",
                                    type: "text",
                                    mask: "cnpj",
                                    placeholder: "00.000.000/0000-00",
                                    required: true,
                                    maxLength: 18, // 14 dígitos + 4 caracteres de formatação
                                   
                                },
                                {
                                    name: "im",
                                    label: "I.M",
                                    type: "text",
                                    required: true,
                                    containerClass: "col-span-1 sm:col-span-1"
                                },
                                {
                                    name: "municipio",
                                    label: "Município",
                                    type: "text",
                                    required: true,
                                    containerClass: "col-span-1 sm:col-span-2"
                                },
                                {
                                    name: "status_empresa",
                                    label: "STATUS EMPRESA",
                                    type: "select",
                                    options: [
                                        { value: "", label: "Selecione o status da empresa" },
                                        ...statusEmpresaOptions
                                    ],
                                    required: true,
                                    containerClass: "col-span-1 sm:col-span-1"
                                },
                                {
                                    name: "estado",
                                    label: "Estado (UF)",
                                    type: "text",
                                    maxLength: 2,
                                    placeholder: "Ex: SP",
                                    required: true,
                                    containerClass: "col-span-1 sm:col-span-1"
                                },
                                {
                                    name: "faturamento",
                                    label: "FATURAMENTO",
                                    type: "text",
                                    placeholder: "0,00",
                                    mask: "currency",
                                    containerClass: "col-span-1 sm:col-span-1"
                                },
                                {
                                    name: "base_calculo",
                                    label: "BASE DE CALCULO",
                                    type: "text",
                                    placeholder: "0,00",
                                    mask: "currency",
                                    containerClass: "col-span-1 sm:col-span-1"
                                },
                                {
                                    name: "aliquota",
                                    label: "ALÍQUOTA",
                                    type: "text",
                                    placeholder: "0,00%",
                                    mask: "percentage",
                                    containerClass: "col-span-1 sm:col-span-1"
                                },
                                {
                                    name: "vl_issqn",
                                    label: "VL. ISSQN",
                                    type: "text",
                                    placeholder: "0,00",
                                    mask: "currency",
                                    containerClass: "col-span-1 sm:col-span-1"
                                },
                                {
                                    name: "historico",
                                    label: "HISTÓRICO",
                                    type: "textarea",
                                    containerClass: "col-span-2 sm:col-span-2"
                                },
                                {
                                    name: "status",
                                    label: "STATUS",
                                    type: "text",
                                    containerClass: "col-span-1 sm:col-span-1"
                                },
                                {
                                    name: "ocorrencia",
                                    label: "OCORRÊNCIA",
                                    type: "text",
                                    containerClass: "col-span-1 sm:col-span-1"
                                },
                                {
                                    name: "vcto_guias_iss_proprio",
                                    label: "VCTO GUIAS ISS PRÓPRIO",
                                    type: "datetime-local",
                                    required: true,
                                    containerClass: "col-span-1 sm:col-span-1"
                                },
                                {
                                    name: "responsavel_nome",
                                    label: "RESPONSÁVEL",
                                    type: "text",
                                    value: autoFields.responsavelNome,
                                    readOnly: true,
                                    required: true,
                                    containerClass: "col-span-1 sm:col-span-1"
                                },
                                {
                                    name: "data_emissao_display",
                                    label: "DATA - EMISSÃO",
                                    type: "datetime-local",
                                    value: autoFields.data_emissao,
                                    readOnly: true,
                                    required: true,
                                    containerClass: "col-span-1 sm:col-span-1"
                                },
                                {
                                    name: "qtd",
                                    label: "QTD",
                                    type: "text",
                                    containerClass: "col-span-1 sm:col-span-1"
                                },
                                {
                                    name: "pdf_anexo1",
                                    label: "PDF Anexo 1",
                                    type: "file",
                                    accept: "application/pdf",
                                    description: "Nenhum arquivo enviado",
                                    containerClass: "col-span-1 sm:col-span-1"
                                },
                                {
                                    name: "pdf_anexo2",
                                    label: "PDF Anexo 2",
                                    type: "file",
                                    accept: "application/pdf",
                                    description: "Nenhum arquivo enviado",
                                    containerClass: "col-span-1 sm:col-span-1"
                                }
                            ]}
                            btnTitle="Adicionar Registro"
                            btnClass="w-full mt-5 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
                            gridClass="grid grid-cols-1 sm:grid-cols-2 gap-6"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddRegisterPage;