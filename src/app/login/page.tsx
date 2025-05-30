"use client"

import { AuthService } from "../../service";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import Image from "next/image";
import AuthForm from "../../components/AuthForm";
import { useTheme } from "@/context/ThemeContext";

const LoginPage = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();
    const { theme } = useTheme();

    const handleSubmit = async (data: Record<string, string>) => {
        const { email, password } = data;

        if (!email?.trim() || !password?.trim()) {
            toast.error("Por favor, preencha todos os campos");
            return;
        }

        try {
            const authService = AuthService.getInstance();
            setLoading(true);

            await authService.login(
                email.trim().toLowerCase(),
                password.trim()
            );

            toast.success("Login realizado com sucesso!");
            router.push("/");
        } catch (err: any) {
            console.error("Erro no login:", err);
            toast.error(err.message || "Erro ao fazer login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className={`
            min-h-screen flex items-center justify-center p-4
            ${theme === "dark"
                ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700"
                : "bg-gradient-to-br from-blue-50 to-indigo-100"}
        `}>
            <div className={`
                w-full max-w-md rounded-2xl shadow-xl overflow-hidden
                ${theme === "dark" ? "bg-gray-900" : "bg-white"}
            `}>
                <div className={`
                    p-6 text-center
                    ${theme === "dark"
                        ? "bg-gradient-to-r from-gray-800 to-gray-700"
                        : "bg-gradient-to-r from-blue-600 to-indigo-700"}
                `}>
                    <div className="flex justify-center mb-4">
                        <div className={theme === "dark" ? "bg-gray-900 p-2 rounded-full" : "bg-white p-2 rounded-full"}>
                            <Image 
                                src="/logo.png" 
                                alt="Bravo Corp Logo"
                                width={48}
                                height={48}
                                className="w-12 h-12 object-contain"
                            />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white">
                        Bem-vindo à Bravo Corp
                    </h1>
                    <p className={theme === "dark" ? "text-gray-300 mt-2" : "text-blue-100 mt-2"}>
                        Acesse sua conta para continuar
                    </p>
                </div>
                
                <div className={`p-8 ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>
                    <AuthForm
                        loading={loading}
                        onSubmit={handleSubmit}
                        isLogin={true}
                        fields={[
                            {
                                name: "email",
                                label: "Email Corporativo",
                                type: "email",
                                placeholder: "seu.email@bravocorp.com",
                                required: true,
                                title: "Digite um email corporativo válido"
                            },
                            {
                                name: "password", 
                                label: "Senha",
                                type: "password",
                                placeholder: "Sua senha secreta",
                                required: true,
                                title: "Mínimo 8 caracteres"
                            }
                        ]}
                        btnTitle="Acessar Plataforma"
                    />

                    <div className="mt-4 text-center">
                        <a 
                            href="/esqueci-senha" 
                            className={`
                                text-sm font-medium
                                ${theme === "dark"
                                    ? "text-blue-400 hover:text-blue-200"
                                    : "text-blue-600 hover:text-blue-800"}
                            `}
                        >
                            Esqueceu sua senha?
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default LoginPage;