import { Client } from "appwrite";

// Crie uma instância do cliente
const client = new Client();

// Defina valores padrão para desenvolvimento
const endpoint = process.env.NEXT_APPWRITE_URL || 'https://fra.cloud.appwrite.io/v1';
const projectId = process.env.NEXT_APPWRITE_PROJECT_ID || 'default-project-id';

// Verificação adicional de segurança
if (!endpoint.startsWith('http')) {
  console.warn('URL do Appwrite parece inválida:', endpoint);
}

if (projectId.length < 10) {
  console.warn('Project ID do Appwrite parece muito curto:', projectId);
}

// Configure o cliente
client
  .setEndpoint(endpoint)
  .setProject(projectId);
  

export default client;