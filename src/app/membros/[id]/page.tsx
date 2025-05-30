"use client"

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuthService, RegistersService } from "@/service";
import { FiUser, FiFileText, FiMail, FiCheckCircle } from "react-icons/fi";
import { useTheme } from "@/context/ThemeContext";

export default function PerfilMembroPage() {
  const params = useParams();
  const id = typeof params === "object" && params.id ? params.id : "";
  const [membro, setMembro] = useState<any>(null);
  const [atividades, setAtividades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  // Estilos condicionais
  const sectionStyles = {
    light: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
    dark: "bg-gradient-to-br from-blue-950 to-blue-900 border-blue-900"
  };

  const avatarStyles = {
    light: "bg-blue-200 text-blue-700 border-blue-400",
    dark: "bg-blue-900 text-blue-200 border-blue-700"
  };

  const activityCardStyles = {
    light: "bg-white border-blue-100 hover:border-blue-300",
    dark: "bg-blue-950 border-blue-900 hover:border-blue-500"
  };

  const emptyStateStyles = {
    light: "bg-white text-gray-500",
    dark: "bg-blue-950 text-gray-400"
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const authService = AuthService.getInstance();
        const registersService = RegistersService.getInstance();

        const user = await authService.getAccount();
        if (!user.teamId) throw new Error("Sem equipe");

        // Busca memberships (membros do time)
        const membrosList = await authService.getMemberships(user.teamId);

        // Busca todos os usuários cadastrados via API interna
        const res = await fetch("/api/usuarios");
        const usuariosList = await res.json();

        // Junta os dados do usuário com a membership pelo userId
        const membroInfo = (membrosList ?? [])
          .map((m: any) => {
            const usuario = usuariosList.find((u: any) => u.$id === m.userId);
            return {
              ...m,
              user: usuario || { name: m.userName || m.userId, email: m.userEmail || "" }
            };
          })
          .find((m: any) => (m.user?.$id || m.userId || m.$id) === id);

        setMembro(membroInfo);

        const docs = await registersService.getDocumentsByTeam(user.teamId);
        const atividadesMembro = docs.documents
          .filter((doc: any) => doc.responsavel === id)
          .sort((a: any, b: any) => new Date(b.$updatedAt).getTime() - new Date(a.$updatedAt).getTime())
          .slice(0, 10);
        setAtividades(atividadesMembro);
      } catch (err) {
        setMembro(null);
        setAtividades([]);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id]);

  if (loading) return (
    <div className={`p-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
      Carregando perfil...
    </div>
  );

  if (!membro) return (
    <div className={`p-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
      Membro não encontrado.
    </div>
  );

  const nome = membro.user?.name || membro.userId || "Sem nome";
  const email = membro.user?.email || "Sem e-mail";
  const status = membro.confirm ? "Ativo" : "Pendente";

  return (
    <main className={`max-w-2xl mx-auto py-10 px-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Seção do perfil */}
      <section className={`flex flex-col items-center rounded-3xl shadow-lg p-8 mb-10 border ${
        theme === 'dark' ? sectionStyles.dark : sectionStyles.light
      }`}>
        <div className={`w-24 h-24 flex items-center justify-center rounded-full font-extrabold text-5xl shadow-inner border-4 mb-4 ${
          theme === 'dark' ? avatarStyles.dark : avatarStyles.light
        }`}>
          {nome.charAt(0).toUpperCase()}
        </div>
        
        <div className={`text-2xl font-bold mb-1 flex items-center gap-2 ${
          theme === 'dark' ? 'text-blue-100' : 'text-blue-900'
        }`}>
          <FiUser className={theme === 'dark' ? "text-blue-400" : "text-blue-700"} /> 
          {nome}
        </div>
        
        <div className={`flex items-center gap-2 mb-2 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          <FiMail /> {email}
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <FiCheckCircle className={status === "Ativo" ? "text-green-500" : "text-yellow-500"} size={20} />
          <span className={status === "Ativo" 
            ? "text-green-700 dark:text-green-400 font-semibold" 
            : "text-yellow-700 dark:text-yellow-400 font-semibold"
          }>
            {status}
          </span>
        </div>
      </section>

      {/* Seção de atividades */}
      <section>
        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
          theme === 'dark' ? 'text-blue-100' : 'text-blue-900'
        }`}>
          <FiFileText /> Últimas Atividades
        </h2>
        
        <ul className="space-y-4">
          {atividades.length === 0 && (
            <li className={`text-center rounded-xl py-8 shadow ${
              theme === 'dark' ? emptyStateStyles.dark : emptyStateStyles.light
            }`}>
              Nenhuma atividade encontrada.
            </li>
          )}
          
          {atividades.map((a) => (
            <li
              key={a.$id}
              className={`p-5 rounded-xl shadow flex flex-col border transition ${
                theme === 'dark' ? activityCardStyles.dark : activityCardStyles.light
              }`}
            >
              <span className={`font-semibold ${
                theme === 'dark' ? 'text-blue-100' : 'text-blue-900'
              }`}>
                {a.empresa} {a.loja && <span className={theme === 'dark' ? "text-blue-400" : "text-blue-700"}>- {a.loja}</span>}
              </span>
              
              <span className={`text-sm mt-1 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
              }`}>
                Atualizado em {new Date(a.$updatedAt).toLocaleString("pt-BR")}
              </span>
              
              <span className={`text-xs mt-1 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {a.status_empresa} - {a.status}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}