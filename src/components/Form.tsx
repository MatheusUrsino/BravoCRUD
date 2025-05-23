"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { type FC, useState } from "react"
import LoadingSpinner from "./LoadingSpinner"
import { formatCNPJ, formatCurrency, formatDate, formatPercentage } from "../utils/formatters"

interface IField {
    name?: string
    label?: string
    type: string
    value?: string | number | null
 placeholder?: string
    required?: boolean
    options?: Array<{ value: string; label: string }>
    pattern?: string
    maxLength?: number
    title?: string
    step?: string
    dateFormat?: string
    accept?: string
    description?: string | React.ReactNode
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    readOnly?: boolean
    containerClass?: string
    mask?: "cnpj" | "currency" | "date" | "percentage"
}

interface IFormProps {
    fields: IField[]
    btnTitle: string
    onSubmit: (data: FormData) => void
    loading: boolean
    btnClass?: string
    gridClass?: string
}

const Form: FC<IFormProps> = ({ fields, btnTitle, onSubmit, loading, btnClass, gridClass }) => {
    const pathname = usePathname()
    const [data, setData] = useState<any>(
        fields.reduce((acc: any, field: IField) => {
            if (field.type !== "file" && field.value !== undefined && field.name) {
                acc[field.name] = field.value
            }
            return acc
        }, {})
    )
    const [files, setFiles] = useState<Record<string, File | null>>({})

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData()
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value as string)
            }
        })
        Object.entries(files).forEach(([key, file]) => {
            if (file) {
                formData.append(key, file)
            }
        })
        onSubmit(formData)
    }

    const handleChange = (name: string, value: string) => {
        setData({ ...data, [name]: value })
    }

    const handleFileChange = (name: string, file: File | null) => {
        setFiles({ ...files, [name]: file })
    }

    const formatValue = (value: string, mask?: string) => {
        if (!value) return ""
        switch (mask) {
            case "cnpj":
                return formatCNPJ(value)
            case "currency":
                return formatCurrency(value)
            case "date":
                return formatDate(value)
            case "percentage":
                return formatPercentage(value)
            default:
                return value
        }
    }

    const parseValue = (value: string, mask?: string) => {
        if (!mask) return value
        const digitsOnly = value.replace(/\D/g, "")
        switch (mask) {
            case "cnpj":
                return digitsOnly.slice(0, 14)
            case "currency":
            case "percentage":
                return digitsOnly
            default:
                return value
        }
    }

    const handleMaskedChange = (e: React.ChangeEvent<HTMLInputElement>, mask?: string) => {
        const rawValue = parseValue(e.target.value, mask)
        handleChange(e.target.name, rawValue)
    }

    return (
        <form onSubmit={handleSubmit} className="w-full p-2 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {fields.map((field: IField, index: number) =>
                    field.type === "section" ? (
                        <div key={index} className="col-span-full my-4">
                            <h3 className="text-lg font-semibold text-indigo-700 border-b border-indigo-200 pb-1 mb-2">{field.label}</h3>
                        </div>
                    ) : (
                        <div
                            key={index}
                            className={`w-full ${field.containerClass || ""} sm:col-span-auto`}
                        >
                            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                                {field.label}
                                {field.required && <span className="text-red-500"> *</span>}
                            </label>

                            {field.description && (
                                <div className="text-xs sm:text-sm text-gray-500 mb-2">
                                    {field.description}
                                </div>
                            )}

                            {field.type === "select" ? (
                                <select
                                    id={field.name}
                                    name={field.name}
                                    value={data[field.name!] || ""}
                                    onChange={(e) => handleChange(field.name!, e.target.value)}
                                    required={field.required}
                                    disabled={field.readOnly || loading}
                                    className={`mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-sm ${field.readOnly ? "bg-gray-100 cursor-not-allowed" : ""}`}
                                >
                                    {field.options?.map((option, i) => (
                                        <option key={i} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            ) : field.type === "file" ? (
                                <div className="mt-1">
                                    <input
                                        type="file"
                                        id={field.name}
                                        name={field.name}
                                        accept={field.accept || "*"}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] || null
                                            handleFileChange(field.name!, file)
                                            if (field.onChange) field.onChange(e)
                                        }}
                                        required={field.required}
                                        disabled={field.readOnly || loading}
                                        className={`block w-full text-xs sm:text-sm text-gray-600 rounded-md border border-gray-300 shadow-sm
                                            file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4
                                            file:rounded-md file:border-0
                                            file:text-xs sm:file:text-sm file:font-medium
                                            file:bg-indigo-50 file:text-indigo-700
                                            hover:file:bg-indigo-100 ${field.readOnly || loading ? "opacity-50 cursor-not-allowed" : ""
                                            }`}
                                    />
                                    {files[field.name!] && (
                                        <p className="text-xs text-indigo-600 mt-1 truncate">
                                            Arquivo selecionado: {files[field.name!]?.name}
                                        </p>
                                    )}
                                </div>
                            ) : field.type === "textarea" ? (
                                <textarea
                                    id={field.name}
                                    name={field.name}
                                    value={data[field.name!] || ""}
                                    onChange={(e) => handleChange(field.name!, e.target.value)}
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    readOnly={field.readOnly}
                                    disabled={field.readOnly || loading}
                                    rows={4}
                                    className={`mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-sm ${field.readOnly ? "bg-gray-100 cursor-not-allowed" : ""
                                        }`}
                                />
                            ) : (
                                <input
                                    type={field.type}
                                    id={field.name}
                                    name={field.name}
                                    value={field.mask ? formatValue(data[field.name!] || "", field.mask) : data[field.name!] || ""}
                                    onChange={(e) => field.mask
                                        ? handleMaskedChange(e, field.mask)
                                        : handleChange(field.name!, e.target.value)
                                    }
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    pattern={field.pattern}
                                    maxLength={field.maxLength}
                                    title={field.title}
                                    step={field.step}
                                    readOnly={field.readOnly}
                                    disabled={field.readOnly || loading}
                                    className={`mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-sm ${field.readOnly ? "bg-gray-100 cursor-not-allowed" : ""
                                        }`}
                                />
                            )}
                        </div>
                    )
                )}
            </div>

            {["/login", "/cadastro"].includes(pathname) && (
                <p className="text-center sm:text-end w-full text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4">
                    {pathname === "/login" ? (
                        <>
                            Não tem uma conta? <Link href="/cadastro" className="text-indigo-600 hover:underline">Clique aqui</Link>
                        </>
                    ) : (
                        <>
                            Já tem uma conta? <Link href="/login" className="text-indigo-600 hover:underline">Clique aqui</Link>
                        </>
                    )}
                </p>
            )}

            <div className="flex justify-center sm:justify-start mt-4 sm:mt-6">
                <button
                    type="submit"
                    className={`${btnClass || 'bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md'} w-full sm:w-auto`}
                    disabled={loading}
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <LoadingSpinner />
                            Processando...
                        </span>
                    ) : (
                        btnTitle
                    )}
                </button>
            </div>
        </form>
    )
}

export default Form