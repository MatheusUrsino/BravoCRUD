"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthService } from "@/service";
import { FiUser, FiMail, FiCheckCircle } from "react-icons/fi";
import MembrosSearch from "@/components/usuarios/MembrosSearch";

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

  if (loading) return <div className="p-8">Carregando membros...</div>;

  return (
    <main className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-extrabold mb-8 text-blue-900 flex items-center gap-2">
        <FiUser className="text-blue-700" /> Membros da Equipe
      </h1>
      <MembrosSearch onSearch={setBusca} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {membrosFiltrados.length === 0 && (
          <div className="col-span-2 text-center text-gray-500 py-8">
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
              className="flex items-center gap-4 p-5 bg-white rounded-2xl shadow-md border border-blue-100 hover:shadow-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-pointer group"
            >
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-2xl shadow-inner border-2 border-blue-300 group-hover:bg-blue-200 transition">
                {nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-lg text-blue-900 group-hover:text-blue-700">{nome}</div>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <FiMail className="inline" /> {email}
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs">
                  <FiCheckCircle className={status === "Ativo" ? "text-green-500" : "text-yellow-500"} />
                  <span className={status === "Ativo" ? "text-green-600" : "text-yellow-600"}>
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