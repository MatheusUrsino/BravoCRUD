import { NextResponse } from "next/server";
import { Client, Users } from "node-appwrite";

export async function GET() {
  console.log("Iniciando rota /api/usuarios");

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_URL!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  const users = new Users(client);

  try {
    const result = await users.list();
    console.log("Usuários retornados:", result.users);
    return NextResponse.json(result.users);
  } catch (error: any) {
    console.error("Erro ao listar usuários:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}