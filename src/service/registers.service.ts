import client from "@/config/appwrite.config";
import { Databases, ID, Permission, Role, Query, Storage } from "appwrite";
import { Models } from "appwrite";
import AuthService from "./auth.service";
interface RegisterData {
  empresa: string;
  loja: number | string;
  docSap: string;
  tipo_registro: string;
  cnpj_tomador: string;
  municipio_tomador: string;
  estado_tomador: string;
  im_tomador: string;
  cnpj_prestador: string;
  municipio_prestador: string;
  estado_prestador: string;
  im_prestador: string;
  numero_nota: string;
  data_nota: string;
  codigo_servico: string;
  faturamento?: number;
  base_calculo?: number;
  aliquota?: number;
  multa?: number;
  juros?: number;
  taxa?: number;
  vl_issqn?: number;
  iss_retido: string;
  status_empresa: string;
  status?: string | null; // Adicionado null como tipo válido
  historico?: string | null; // Adicionado null como tipo válido
  vcto_guias_iss_proprio: string | null | undefined; // Adicione null como tipo válido
  data_emissao: string;
  qtd: number | null | undefined; // Adicione null como tipo válido  responsavel: string;
  teamId: string;
  pdf_anexo1_id?: string;
  pdf_anexo2_id?: string;
}

interface FileUploadResult {
  field: string;
  fileId: string;
}

class RegistersService {
  private static instance: RegistersService;
  private db: Databases;
  private storage: Storage;

  private constructor() {
    this.db = new Databases(client);
    this.storage = new Storage(client);
  }

  public static getInstance(): RegistersService {
    if (!RegistersService.instance) {
      RegistersService.instance = new RegistersService();
    }
    return RegistersService.instance;
  }

  public async getDocuments(userID: string): Promise<Models.DocumentList<Models.Document>> {
  try {
    if (!userID) throw new Error("ID do usuário é obrigatório");

    return await this.db.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DB_ID as string,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID as string,
      [
        Query.equal("responsavel", userID),
        Query.limit(1000) // Adiciona limite de 1000 registros
      ]
    );
  } catch (error) {
    console.error("Erro ao buscar documentos:", error);
    throw new Error("Falha ao recuperar documentos");
  }
}


  public async getDocument(docID: string): Promise<Models.Document> {
    try {
      if (!docID) throw new Error("ID do documento é obrigatório");

      return await this.db.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DB_ID as string,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID as string,
        docID
      );
    } catch (error) {
      console.error("Erro ao buscar documento:", error);
      throw new Error("Falha ao recuperar documento");
    }
  }

  public async AddRegister(data: RegisterData): Promise<Models.Document> {
    try {
      const user = await AuthService.getInstance().getAccount();

      if (!data.teamId) {
        throw new Error("TeamId é obrigatório para criar registros");
      }

      // Convert string numbers to actual numbers
      const numericFields = ['loja', 'faturamento', 'base_calculo', 'aliquota', 'multa', 'juros', 'taxa', 'vl_issqn', 'qtd'];
      const processedData = { ...data };

      numericFields.forEach(field => {
        if (processedData[field as keyof RegisterData] !== undefined) {
          (processedData as any)[field] = Number(processedData[field as keyof RegisterData]) || 0;
        }
      });

      return await this.db.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DB_ID as string,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID as string,
        ID.unique(),
        processedData,
        [
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
          Permission.read(Role.team(data.teamId)),
          Permission.update(Role.team(data.teamId)),
          Permission.delete(Role.team(data.teamId))
        ]
      );
    } catch (error) {
      console.error("Erro ao criar registro:", error);
      throw new Error("Falha ao criar registro");
    }
  }

  public async update(docID: string, data: Partial<RegisterData>): Promise<Models.Document> {
    try {
      const user = await AuthService.getInstance().getAccount();

      if (!docID) throw new Error("ID do documento é obrigatório");

      // Convert string numbers to actual numbers
      const numericFields = ['loja', 'faturamento', 'base_calculo', 'aliquota', 'multa', 'juros', 'taxa', 'vl_issqn', 'qtd'];
      const processedData = { ...data };

      numericFields.forEach(field => {
        if (processedData[field as keyof RegisterData] !== undefined) {
          (processedData as any)[field] = Number(processedData[field as keyof RegisterData]) || 0;
        }
      });

      return await this.db.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DB_ID as string,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID as string,
        docID,
        processedData
      );
    } catch (error) {
      console.error("Erro ao atualizar documento:", error);
      throw new Error("Falha ao atualizar documento");
    }
  }

  public async delete(docID: string): Promise<void> {
    try {
      if (!docID) throw new Error("ID do documento é obrigatório");

      await this.db.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DB_ID as string,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID as string,
        docID
      );
    } catch (error) {
      console.error("Erro ao deletar documento:", error);
      throw new Error("Falha ao deletar documento");
    }
  }

 public async getDocumentsByTeam(
  teamId: string,
  limit: number = 1000,
  offset: number = 0
): Promise<Models.DocumentList<Models.Document>> {
  try {
    if (!teamId) throw new Error("ID do time é obrigatório");

    return await this.db.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DB_ID as string,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID as string,
      [
        Query.equal("teamId", teamId),
        Query.limit(limit),
        Query.offset(offset)
      ]
    );
  } catch (error) {
    console.error("Erro ao buscar documentos por time:", error);
    throw new Error("Falha ao recuperar documentos do time");
  }
}

  public async getFileDetails(fileId: string): Promise<Models.File> {
    try {
      if (!fileId) throw new Error("ID do arquivo é obrigatório");
      if (!process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID) {
        throw new Error("Bucket ID não configurado");
      }

      return await this.storage.getFile(
        process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID,
        fileId
      );
    } catch (error) {
      console.error("Erro ao buscar detalhes do arquivo:", error);
      throw new Error("Falha ao recuperar detalhes do arquivo");
    }
  }

  public async AddRegisterWithFiles(formData: FormData): Promise<{ success: boolean; results?: FileUploadResult[]; error?: string }> {
    try {
      const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;
      if (!bucketId) throw new Error("Bucket ID não configurado");

      const results: FileUploadResult[] = [];

      // Process each file in the form data
      for (const [field, file] of formData.entries()) {
        if (file instanceof File && file.size > 0) {
          const uploadedFile = await this.storage.createFile(
            bucketId,
            ID.unique(),
            file
          );
          results.push({ field, fileId: uploadedFile.$id });
        }
      }

      return { success: true, results };
    } catch (error) {
      console.error("Erro detalhado no upload de arquivos:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido ao processar upload"
      };
    }
  }

  public async deleteFile(fileId: string): Promise<void> {
    try {
      if (!fileId) throw new Error("ID do arquivo é obrigatório");
      if (!process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID) {
        throw new Error("Bucket ID não configurado");
      }

      await this.storage.deleteFile(
        process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID,
        fileId
      );
    } catch (error) {
      console.error("Erro ao deletar arquivo:", error);
      throw new Error("Falha ao deletar arquivo");
    }
  }
}

export default RegistersService;
