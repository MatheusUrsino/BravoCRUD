"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthService } from "@/service";
import { FiUser, FiMail, FiCheckCircle } from "react-icons/fi";
import MembrosSearch from "@/components/usuarios/MembrosSearch";
import { useTheme } from "@/context/ThemeContext";

export default function MembrosPage() {
  const [membros, setMembros] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    async function fetchMembros() {
      try {
        const authService = AuthService.getInstance();
        const account = await authService.getAccount();
        if (!account.teamId) throw new Error("Sem equipe");

        // Busca memberships (membros do time)
        const membrosList = await authService.getMemberships(account.teamId);

        // Busca todos os usuários cadastrados via API interna
        const res = await fetch("/api/usuarios");
        const usuariosList = await res.json();

        setUsuarios(usuariosList);

        // Junta os dados do usuário com a membership pelo userId
        const membrosCompletos = (membrosList ?? []).map((m: any) => {
          const usuario = usuariosList.find((u: any) => u.$id === m.userId);
          return {
            ...m,
            user: usuario || { name: m.userName || m.userId, email: m.userEmail || "" }
          };
        });

        setMembros(membrosCompletos);
      } catch (err) {
        setMembros([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMembros();
  }, []);

  // Filtra membros conforme busca
  const membrosFiltrados = membros.filter((m: any) => {
    const nome = m.user?.name?.toLowerCase() || "";
    const email = m.user?.email?.toLowerCase() || "";
    const termo = busca.toLowerCase();
    return nome.includes(termo) || email.includes(termo);
  });
  const { theme } = useTheme();

  // Estilos condicionais baseados no tema
  const cardStyles = {
    light: "bg-white border-blue-100 hover:bg-blue-50 hover:border-blue-400",
    dark: "bg-blue-950 border-blue-900 hover:bg-blue-900/60 hover:border-blue-500"
  };

  const textStyles = {
    light: "text-blue-900 group-hover:text-blue-700",
    dark: "text-blue-100 group-hover:text-blue-300"
  };

  const emailStyles = {
    light: "text-gray-500",
    dark: "text-gray-300"
  };

  const avatarStyles = {
    light: "bg-blue-100 border-blue-300 text-blue-700 group-hover:bg-blue-200",
    dark: "bg-blue-900 border-blue-700 text-blue-200 group-hover:bg-blue-800"
  };

  if (loading) return (
    <div className={`p-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
      Carregando membros...
    </div>
  );

  return (
    <main className={`max-w-3xl mx-auto py-8 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <h1 className={`text-3xl font-extrabold mb-8 flex items-center gap-2 ${theme === 'dark' ? 'text-blue-100' : 'text-blue-900'
        }`}>
        <FiUser className={theme === 'dark' ? "text-blue-400" : "text-blue-700"} />
        Membros da Equipe
      </h1>

      <MembrosSearch onSearch={setBusca} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {membrosFiltrados.length === 0 && (
          <div className={`col-span-2 text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
            Nenhum membro encontrado.
          </div>
        )}

        {membrosFiltrados.map((m: any) => {
          const nome = m.user?.name || m.userId || "Sem nome";
          const email = m.user?.email || "Sem e-mail";
          const status = m.confirm ? "Ativo" : "Pendente";
          const userId = m.user?.$id || m.userId || m.$id;

          return (
            <Link
              key={userId}
              href={`/membros/${userId}`}
              className={`flex items-center gap-4 p-5 rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group ${theme === 'dark' ? cardStyles.dark : cardStyles.light
                }`}
            >
              <div className={`w-14 h-14 flex items-center justify-center rounded-full font-bold text-2xl shadow-inner border-2 transition ${theme === 'dark' ? avatarStyles.dark : avatarStyles.light
                }`}>
                {nome.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1">
                <div className={`font-semibold text-lg ${theme === 'dark' ? textStyles.dark : textStyles.light
                  }`}>
                  {nome}
                </div>

                <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? emailStyles.dark : emailStyles.light
                  }`}>
                  <FiMail className="inline" /> {email}
                </div>

                <div className="flex items-center gap-1 mt-1 text-xs">
                  <FiCheckCircle className={status === "Ativo" ? "text-green-500" : "text-yellow-500"} />
                  <span className={status === "Ativo" ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}>
                    {status}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}