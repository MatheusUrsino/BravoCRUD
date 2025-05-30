"use client"

import { useState, useEffect } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { useTheme } from "@/context/ThemeContext";

interface AuthField {
    name: string;
    label: string;
    type: string;
    placeholder?: string;
    required?: boolean;
    pattern?: string;
    title?: string;
}

interface AuthFormProps {
    fields: AuthField[];
    btnTitle: string;
    onSubmit: (data: Record<string, string>) => Promise<void>;
    loading: boolean;
    isLogin?: boolean;
}

const AuthForm = ({ fields, btnTitle, onSubmit, loading, isLogin = false }: AuthFormProps) => {
    const [formData, setFormData] = useState<Record<string, string>>(
        fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {})
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { theme } = useTheme();

    // Validação em tempo real
    useEffect(() => {
        const newErrors: Record<string, string> = {};
        
        fields.forEach(field => {
            const value = formData[field.name]?.trim() || '';
            
            if (field.required && !value) {
                newErrors[field.name] = 'Este campo é obrigatório';
            } else if (field.pattern && value) {
                const regex = new RegExp(field.pattern);
                if (!regex.test(value)) {
                    newErrors[field.name] = field.title || 'Formato inválido';
                }
            }
            
            // Validação especial para email
            if (field.name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                newErrors.email = 'Por favor, insira um email válido';
            }
        });
        
        setErrors(newErrors);
    }, [formData, fields]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Verifica se há erros antes de submeter
        const hasErrors = Object.values(errors).some(error => error);
        const isEmpty = Object.values(formData).some(value => !value.trim());
        
        if (hasErrors || isEmpty) {
            setIsSubmitting(false);
            return;
        }
        
        try {
            await onSubmit(formData);
        } catch (error) {
            console.error("Submission error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid = () => {
        return !Object.values(errors).some(error => error) && 
               !Object.values(formData).some(value => !value.trim());
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
                <div key={field.name} className="space-y-2">
                    <label
                        htmlFor={field.name}
                        className={`block text-sm font-medium ${
                            theme === "dark" ? "text-gray-100" : "text-gray-700"
                        }`}
                    >
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                        type={field.type}
                        id={field.name}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        required={field.required}
                        pattern={field.pattern}
                        title={field.title}
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                            errors[field.name] 
                                ? 'border-red-500 focus:ring-red-500' 
                                : theme === "dark"
                                    ? 'border-gray-600 focus:ring-blue-500 bg-gray-800 text-gray-100 placeholder-gray-400'
                                    : 'border-gray-300 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400'
                        }`}
                    />
                    {errors[field.name] && (
                        <p className="text-red-500 text-xs mt-1">{errors[field.name]}</p>
                    )}
                </div>
            ))}

            <button
                type="submit"
                disabled={loading || !isFormValid() || isSubmitting}
                className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                    ${loading || !isFormValid() ? 'opacity-70 cursor-not-allowed' : ''}
                    ${theme === "dark" ? "bg-blue-700 hover:bg-blue-800" : "bg-blue-600 hover:bg-blue-700"}
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                `}
            >
                {loading && <LoadingSpinner/>}
                {btnTitle}
            </button>

            <div className={`text-center text-sm mt-4 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>
                {isLogin ? (
                    <>
                        Não tem uma conta?{' '}
                        <a
                            href="/cadastro"
                            className={`font-medium ${
                                theme === "dark"
                                    ? "text-blue-400 hover:text-blue-200"
                                    : "text-blue-600 hover:text-blue-500"
                            }`}
                        >
                            Cadastre-se
                        </a>
                    </>
                ) : (
                    <>
                        Já tem uma conta?{' '}
                        <a
                            href="/login"
                            className={`font-medium ${
                                theme === "dark"
                                    ? "text-blue-400 hover:text-blue-200"
                                    : "text-blue-600 hover:text-blue-500"
                            }`}
                        >
                            Faça login
                        </a>
                    </>
                )}
            </div>
        </form>
    );
};

export default AuthForm;