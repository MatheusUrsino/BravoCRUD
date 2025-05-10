"use client"

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuthService, RegistersService } from "@/service";
import { FiUser, FiFileText, FiMail, FiCheckCircle } from "react-icons/fi";

export default function PerfilMembroPage() {
  const params = useParams();
  const id = typeof params === "object" && params.id ? params.id : "";
  const [membro, setMembro] = useState<any>(null);
  const [atividades, setAtividades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-8">Carregando perfil...</div>;
  if (!membro) return <div className="p-8">Membro não encontrado.</div>;

  const nome = membro.user?.name || membro.userId || "Sem nome";
  const email = membro.user?.email || "Sem e-mail";
  const status = membro.confirm ? "Ativo" : "Pendente";

  return (
    <main className="max-w-2xl mx-auto py-10 px-4">
      <section className="flex flex-col items-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl shadow-lg p-8 mb-10 border border-blue-200">
        <div className="w-24 h-24 flex items-center justify-center rounded-full bg-blue-200 text-blue-700 font-extrabold text-5xl shadow-inner border-4 border-blue-400 mb-4">
          {nome.charAt(0).toUpperCase()}
        </div>
        <div className="text-2xl font-bold text-blue-900 mb-1 flex items-center gap-2">
          <FiUser className="text-blue-700" /> {nome}
        </div>
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <FiMail /> {email}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <FiCheckCircle className={status === "Ativo" ? "text-green-500" : "text-yellow-500"} size={20} />
          <span className={status === "Ativo" ? "text-green-700 font-semibold" : "text-yellow-700 font-semibold"}>
            {status}
          </span>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-900">
          <FiFileText /> Últimas Atividades
        </h2>
        <ul className="space-y-4">
          {atividades.length === 0 && (
            <li className="text-gray-500 text-center bg-white rounded-xl py-8 shadow">Nenhuma atividade encontrada.</li>
          )}
          {atividades.map((a) => (
            <li key={a.$id} className="p-5 bg-white rounded-xl shadow flex flex-col border border-blue-100 hover:border-blue-300 transition">
              <span className="font-semibold text-blue-900">{a.empresa} {a.loja && <span className="text-blue-700">- {a.loja}</span>}</span>
              <span className="text-sm text-gray-500 mt-1">Atualizado em {new Date(a.$updatedAt).toLocaleString("pt-BR")}</span>
              <span className="text-xs text-gray-400 mt-1">{a.status_empresa} - {a.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}