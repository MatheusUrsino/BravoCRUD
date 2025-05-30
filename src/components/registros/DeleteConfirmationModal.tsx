import { FiTrash2 } from "react-icons/fi";
import { useTheme } from "@/context/ThemeContext";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmationModal = ({
  isOpen,
  onCancel,
  onConfirm,
}: DeleteConfirmationModalProps) => {
  const { theme } = useTheme();
  if (!isOpen) return null;

  return (
    <div
      className={
        theme === "dark"
          ? "fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(16,23,42,0.85)]"
          : "fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(30,64,175,0.38)]"
      }
    >
      <div
        className={
          theme === "dark"
            ? "bg-gradient-to-br from-gray-900 via-gray-800 to-blue-950 rounded-2xl p-8 shadow-2xl max-w-md w-full animate-fade-in border border-blue-900"
            : "bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full animate-fade-in border border-blue-100"
        }
      >
        <div className="text-center">
          <div
            className={
              theme === "dark"
                ? "mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-900/20"
                : "mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100"
            }
          >
            <FiTrash2 className="h-7 w-7 text-red-600" />
          </div>
          <h3
            className={
              theme === "dark"
                ? "mt-4 text-xl font-semibold text-blue-100"
                : "mt-4 text-xl font-semibold text-gray-900"
            }
          >
            Confirmar exclusão
          </h3>
          <div
            className={
              theme === "dark"
                ? "mt-2 text-base text-blue-200"
                : "mt-2 text-base text-gray-600"
            }
          >
            <p>
              Tem certeza que deseja excluir este registro?{" "}
              <span className={theme === "dark" ? "text-red-300 font-semibold" : "text-red-600 font-semibold"}>
                Esta ação não pode ser desfeita.
              </span>
            </p>
          </div>
        </div>
        <div className="mt-7 flex justify-center gap-4">
          <button
            type="button"
            className={
              theme === "dark"
                ? "px-5 py-2 rounded-lg text-sm font-medium text-blue-200 bg-blue-950 border border-blue-800 hover:bg-blue-900 transition focus:outline-none focus:ring-2 focus:ring-blue-700"
                : "px-5 py-2 rounded-lg text-sm font-medium text-blue-900 bg-blue-100 border border-blue-200 hover:bg-blue-200 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
            }
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={
              theme === "dark"
                ? "px-5 py-2 rounded-lg text-sm font-medium text-white bg-red-700 hover:bg-red-800 transition focus:outline-none focus:ring-2 focus:ring-red-500"
                : "px-5 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500"
            }
            onClick={onConfirm}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};