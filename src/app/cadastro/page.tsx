// app/cadastro/page.tsx
"use client"


import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import AuthForm from "../../components/AuthForm";
import { AuthService } from "../../service";

const RegisterPage = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();

    const handleSubmit = async (data: Record<string, string>) => {
        const { userId, name, email, password } = data;
        
        try {
            const authService = AuthService.getInstance();
            setLoading(true);
            
            await authService.register({ 
                userId: userId.trim(),
                email: email.trim().toLowerCase(),
                password: password.trim(),
                name: name.trim()
            });
            
            toast.success("Cadastro realizado com sucesso!");
            router.push("/login");
        } catch (err: any) {
            console.error("Erro no cadastro:", err);
            toast.error(err.message || "Erro ao cadastrar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Crie sua conta</h1>
                        <p className="text-gray-600 mt-2">Preencha os dados abaixo para se registrar</p>
                    </div>

                    <AuthForm
                        loading={loading}
                        onSubmit={handleSubmit}
                        fields={[
                            {
                                name: "userId",
                                label: "Nome de usuário",
                                type: "text",
                                placeholder: "ex: joao123",
                                required: true,
                                pattern: "^[a-zA-Z0-9_]{4,20}$",
                                title: "4-20 caracteres (letras, números ou _)"
                            },
                            {
                                name: "name",
                                label: "Nome completo",
                                type: "text",
                                placeholder: "Seu nome completo",
                                required: true
                            },
                            {
                                name: "email",
                                label: "Email",
                                type: "email",
                                placeholder: "seu@email.com",
                                required: true,
                                title: "Digite um email válido (exemplo@dominio.com)"
                            },
                            {
                                name: "password",
                                label: "Senha",
                                type: "password",
                                placeholder: "Mínimo 8 caracteres",
                                required: true,
                                title: "Mínimo 8 caracteres"
                            }
                        ]}
                        btnTitle="Cadastrar"
                    />
                </div>
            </div>
        </main>
    );
};

export default RegisterPage;