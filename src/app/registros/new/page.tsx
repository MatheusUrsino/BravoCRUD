"use client"

import { Form } from "@/components";
import { AuthService, RegistersService } from "@/service";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const statusEmpresaOptions = [
    { value: "ATIVA", label: "Ativa" },
    { value: "INATIVA", label: "Inativa" },
    { value: "SUSPENSA", label: "Suspensa" }
];

const statusOptions = [
    { value: "CONCLUIDO", label: "Concluído" },
    { value: "PENDENTE", label: "Pendente" },
    { value: "ERRO_LOGIN", label: "Erro de login" },
    { value: "MODULO_NAO_HABILITADO", label: "Módulo de escrituração não habilitado" },
    { value: "SEM_ACESSO", label: "Sem acesso" },
    { value: "PENDENCIA", label: "Pendência" },
    { value: "SEM_MOVIMENTO", label: "Sem movimento" }
];

const AddRegisterPage = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const authService = AuthService.getInstance();
    const registerService = RegistersService.getInstance();

    const [formValues, setFormValues] = useState({
        base_calculo: "",
        faturamento: "",
        aliquota: "",
        multa: "",
        juros: "",
        taxa: "",
        vl_issqn: ""
    });

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
    const calculateVlIssqn = (currentFormValues = formValues) => {
        const base = parseFormValue(currentFormValues.base_calculo);
        const aliquota = parseFormValue(currentFormValues.aliquota);
        const multa = parseFormValue(currentFormValues.multa);
        const juros = parseFormValue(currentFormValues.juros);
        const taxa = parseFormValue(currentFormValues.taxa);

        const vlIssqn = (base * (aliquota / 100)) + multa + juros + taxa;

        return {
            raw: vlIssqn,
            formatted: formatCurrency(vlIssqn)
        };
    };

    const [autoFields, setAutoFields] = useState({
        responsavelNome: '',
        responsavelId: '',
        vl_issqn: calculateVlIssqn().formatted,
        data_emissao: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    });

    const statusEmpresaOptions = [
        { value: "Ativa", label: "Ativa" },
        { value: "Inativa", label: "Inativa" },
        { value: "Suspensa", label: "Suspensa" }
    ];

    const statusOptions = [
        { value: "Concluído", label: "Concluído" },
        { value: "Pendente", label: "Pendente" },
    ];


    const handleFieldChange = (name: string, value: string) => {
        const newFormValues = {
            ...formValues,
            [name]: value
        };

        setFormValues(newFormValues);

        // Recalcula imediatamente quando campos relevantes mudam
        if (['base_calculo', 'aliquota', 'multa', 'juros', 'taxa'].includes(name)) {
            setAutoFields(prev => ({
                ...prev,
                vl_issqn: calculateVlIssqn(newFormValues).formatted
            }));
        }
    };

    // Busca os dados do usuário ao carregar o componente
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await authService.getAccount();
                setUser(data);
                setAutoFields(prev => ({
                    ...prev,
                    responsavelNome: data.name || data.email,
                    responsavelId: data.$id,
                    vl_issqn: calculateVlIssqn().formatted
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
        console.log(formData.get('loja'))
        try {
            // Validação de campos obrigatórios
            const requiredFields = [
                "empresa", "loja", "docSap", "tipo_registro",
                "cnpj_tomador", "municipio_tomador", "estado_tomador", "im_tomador",
                "cnpj_prestador", "municipio_prestador", "estado_prestador",
                "numero_nota", "data_nota", "codigo_servico",
                "iss_retido",
                "status_empresa", "vcto_guias_iss_proprio"
            ];

            for (const field of requiredFields) {
                if (!formData.get(field)) {
                    throw new Error(`Por favor, preencha o campo: ${field.toUpperCase()}`);
                }
            }
            // Cálculo FINAL com os valores mais recentes
            const finalCalculation = calculateVlIssqn({
                base_calculo: formData.get('base_calculo')?.toString() || '',
                aliquota: formData.get('aliquota')?.toString() || '',
                multa: formData.get('multa')?.toString() || '',
                juros: formData.get('juros')?.toString() || '',
                taxa: formData.get('taxa')?.toString() || '',
                faturamento: '',
                vl_issqn: ''
            });

            // DEBUG: Verificar cálculo
            console.log('Valores calculados:', {
                base: parseFormValue(formData.get('base_calculo')?.toString() || ''),
                aliquota: parseFormValue(formData.get('aliquota')?.toString() || ''),
                multa: parseFormValue(formData.get('multa')?.toString() || ''),
                juros: parseFormValue(formData.get('juros')?.toString() || ''),
                taxa: parseFormValue(formData.get('taxa')?.toString() || ''),
                vl_issqn: finalCalculation.raw
            });

            // Obter dados da conta
            const account = await authService.getAccount();
            const teamId = account.teamId;

            if (!teamId) {
                throw new Error("Usuário não está associado a nenhum time");
            }

            // Formatar data de vencimento
            const vctoDate = formData.get("vcto_guias_iss_proprio")?.toString();
            const formattedVctoDate = vctoDate ? `${vctoDate.split('T')[0]}T00:00:00` : "";

            // Criar payload com tipos corretos
            const payload = {
                empresa: formData.get("empresa")?.toString() || '',
                loja: Number(formData.get("loja")), docSap: formData.get("docSap")?.toString() || '',
                // Tomador
                cnpj_tomador: formData.get("cnpj_tomador")?.toString() || '',
                municipio_tomador: formData.get("municipio_tomador")?.toString() || '',
                estado_tomador: formData.get("estado_tomador")?.toString() || '',
                im_tomador: formData.get("im_tomador")?.toString() || '',
                // Prestador
                cnpj_prestador: formData.get("cnpj_prestador")?.toString() || '',
                municipio_prestador: formData.get("municipio_prestador")?.toString() || '',
                estado_prestador: formData.get("estado_prestador")?.toString() || '',
                im_prestador: formData.get("im_prestador")?.toString() || '',
                // Nota
                numero_nota: formData.get("numero_nota")?.toString() || '',
                data_nota: formData.get("data_nota")?.toString() || '',
                codigo_servico: formData.get("codigo_servico")?.toString() || '',
                // Financeiro
                faturamento: parseFormValue(formData.get("faturamento")?.toString() || ''),
                base_calculo: parseFormValue(formData.get("base_calculo")?.toString() || ''),
                aliquota: parseFormValue(formData.get("aliquota")?.toString() || ''),
                multa: parseFormValue(formData.get("multa")?.toString() || ''),
                juros: parseFormValue(formData.get("juros")?.toString() || ''),
                taxa: parseFormValue(formData.get("taxa")?.toString() || ''),
                vl_issqn: finalCalculation.raw,
                iss_retido: formData.get("iss_retido")?.toString() || '',
                // Outros
                status_empresa: formData.get("status_empresa")?.toString() || '',
                status: formData.get("status")?.toString() || null,
                historico: formData.get("historico")?.toString() || null,
                vcto_guias_iss_proprio: formattedVctoDate,
                data_emissao: new Date(autoFields.data_emissao).toISOString(),
                qtd: formData.get("qtd") ? parseInt(formData.get("qtd")?.toString() || '0') : null,
                responsavel: autoFields.responsavelId,
                teamId: teamId,
                tipo_registro: formData.get("tipo_registro")?.toString() || ''
            };

            // DEBUG: Verificar payload antes do envio
            console.log('Payload completo:', payload);

            const registerResponse = await registerService.AddRegister(payload);

            // Processamento de arquivos (se houver)
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

                const uploadResponse = await registerService.AddRegisterWithFiles(filesFormData);

                if (uploadResponse.success && uploadResponse.results) {
                    const fileIds: any = {};
                    uploadResponse.results.forEach((result: any) => {
                        if (result.field === 'pdf_anexo1') fileIds.pdf_anexo1_id = result.fileId;
                        if (result.field === 'pdf_anexo2') fileIds.pdf_anexo2_id = result.fileId;
                    });

                    await registerService.update(registerResponse.$id, {
                        ...fileIds
                    });
                }
            }

            toast.success("Registro criado com sucesso!");
            router.push("/registros");

        } catch (err: any) {
            toast.error(err.message || "Ocorreu um erro ao criar o registro");
            console.error("Erro no submit:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-2 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
                        Novo Registro
                    </h1>
                    <p className="text-base sm:text-lg text-gray-600">
                        Preencha todos os campos obrigatórios para criar um novo registro
                    </p>
                </div>

                <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                    <div className="p-4 sm:p-8">
                        <div className="border-b border-gray-200 pb-4 mb-4">
                            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
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
                                { type: "section", label: "Dados Gerais" },
                                {
                                    name: "empresa",
                                    label: "EMPRESA",
                                    type: "text",
                                    required: true,
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "loja",
                                    label: "LOJA",
                                    type: "text",
                                    required: true,
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "docSap",
                                    label: "DOC SAP",
                                    type: "text",
                                    required: true,
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "tipo_registro",
                                    label: "TIPO DE REGISTRO",
                                    type: "select",
                                    options: [
                                        { value: "", label: "Selecione" },
                                        { value: "PRESTADO", label: "Prestado" },
                                        { value: "TOMADO", label: "Tomado" }
                                    ],
                                    required: true,
                                    containerClass: "col-span-1"
                                },

                                { type: "section", label: "Dados do Tomador" },
                                {
                                    name: "cnpj_tomador",
                                    label: "CNPJ TOMADOR",
                                    type: "text",
                                    mask: "cnpj",
                                    placeholder: "00.000.000/0000-00",
                                    required: true,
                                    maxLength: 18,
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "municipio_tomador",
                                    label: "MUNICÍPIO TOMADOR",
                                    type: "text",
                                    required: true,
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "estado_tomador",
                                    label: "ESTADO TOMADOR (UF)",
                                    type: "text",
                                    maxLength: 2,
                                    placeholder: "Ex: SP",
                                    required: true,
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "im_tomador",
                                    label: "INSCRIÇÃO MUNICIPAL TOMADOR",
                                    type: "text",
                                    required: true,
                                    containerClass: "col-span-1"
                                },

                                { type: "section", label: "Dados do Prestador" },
                                {
                                    name: "cnpj_prestador",
                                    label: "CNPJ PRESTADOR",
                                    type: "text",
                                    mask: "cnpj",
                                    placeholder: "00.000.000/0000-00",
                                    required: true,
                                    maxLength: 18,
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "municipio_prestador",
                                    label: "MUNICÍPIO PRESTADOR",
                                    type: "text",
                                    required: true,
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "estado_prestador",
                                    label: "ESTADO PRESTADOR (UF)",
                                    type: "text",
                                    maxLength: 2,
                                    placeholder: "Ex: SP",
                                    required: true,
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "im_prestador",
                                    label: "INSCRIÇÃO MUNICIPAL PRESTADOR",
                                    type: "text",
                                    required: false,
                                    containerClass: "col-span-1"
                                },

                                { type: "section", label: "Dados da Nota" },
                                {
                                    name: "numero_nota",
                                    label: "NÚMERO DA NOTA",
                                    type: "text",
                                    required: true,
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "data_nota",
                                    label: "DATA DA NOTA",
                                    type: "date",
                                    required: true,
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "codigo_servico",
                                    label: "CÓDIGO DO SERVIÇO",
                                    type: "text",
                                    required: true,
                                    containerClass: "col-span-1"
                                },

                                { type: "section", label: "Dados Financeiros" },
                                {
                                    name: "faturamento",
                                    label: "FATURAMENTO",
                                    type: "text",
                                    placeholder: "0,00",
                                    mask: "currency",
                                    onChange: (event) => handleFieldChange("faturamento", event.target.value),
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "base_calculo",
                                    label: "BASE DE CÁLCULO",
                                    type: "text",
                                    placeholder: "0,00",
                                    mask: "currency",
                                    onChange: (event) => handleFieldChange("base_calculo", event.target.value),
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "aliquota",
                                    label: "ALÍQUOTA",
                                    type: "text",
                                    placeholder: "0,00%",
                                    mask: "percentage",
                                    onChange: (event) => handleFieldChange("aliquota", event.target.value),
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "iss_retido",
                                    label: "ISS RETIDO?",
                                    type: "select",
                                    options: [
                                        { value: "", label: "Selecione" },
                                        { value: "SIM", label: "Sim" },
                                        { value: "NAO", label: "Não" }
                                    ],
                                    required: true,
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "multa",
                                    label: "MULTA",
                                    type: "text",
                                    placeholder: "0,00",
                                    mask: "currency",
                                    onChange: (event) => handleFieldChange("multa", event.target.value),
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "juros",
                                    label: "JUROS",
                                    type: "text",
                                    placeholder: "0,00",
                                    mask: "currency",
                                    onChange: (event) => handleFieldChange("juros", event.target.value),
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "taxa",
                                    label: "TAXA",
                                    type: "text",
                                    placeholder: "0,00",
                                    mask: "currency",
                                    onChange: (event) => handleFieldChange("taxa", event.target.value),
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "vl_issqn",
                                    label: "VL. ISSQN",
                                    type: "text",
                                    placeholder: "0,00",
                                    value: autoFields.vl_issqn,
                                    readOnly: true,
                                    containerClass: "col-span-1"
                                },

                                { type: "section", label: "Outros Dados" },
                                {
                                    name: "status_empresa",
                                    label: "STATUS EMPRESA",
                                    type: "select",
                                    options: [
                                        { value: "", label: "Selecione o status da empresa" },
                                        ...statusEmpresaOptions
                                    ],
                                    required: true,
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "status",
                                    label: "STATUS REGISTRO",
                                    type: "select",
                                    options: [
                                        { value: "", label: "Selecione o status do registro" },
                                        ...statusOptions
                                    ],
                                    required: true,
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "historico",
                                    label: "OBSERVAÇÃO",
                                    type: "textarea",
                                    containerClass: "col-span-2"
                                },
                                {
                                    name: "vcto_guias_iss_proprio",
                                    label: "VENCIMENTO DA GUIA",
                                    type: "date",
                                    required: true,
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "data_emissao_display",
                                    label: "DATA DE EMISSÃO",
                                    type: "date",
                                    value: autoFields.data_emissao.split('T')[0],
                                    readOnly: true,
                                    required: true,
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "qtd",
                                    label: "QUANTIDADE DE NOTA",
                                    type: "text",
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "responsavel_nome",
                                    label: "RESPONSÁVEL",
                                    type: "text",
                                    value: autoFields.responsavelNome,
                                    readOnly: true,
                                    required: true,
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "pdf_anexo1",
                                    label: "Guia de Recolhimento",
                                    type: "file",
                                    accept: "application/pdf",
                                    description: "Nenhum arquivo enviado",
                                    containerClass: "col-span-1"
                                },
                                {
                                    name: "pdf_anexo2",
                                    label: "Protocolo",
                                    type: "file",
                                    accept: "application/pdf",
                                    description: "Nenhum arquivo enviado",
                                    containerClass: "col-span-1"
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