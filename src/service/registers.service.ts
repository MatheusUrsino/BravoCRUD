import client from "@/config/appwrite.config";
import { Databases, ID, Permission, Role, Query, Storage } from "appwrite";
import { Models } from "appwrite";
import AuthService from "./auth.service";

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

  public getDocuments = async (userID: string) => {
    return await this.db.listDocuments(
      process.env.NEXT_APPWRITE_DB_ID as string,
      process.env.NEXT_APPWRITE_COLLECTION_ID as string,
      [Query.equal("responsavel", userID.toString())]
    );
  }

  public getDocument = async (docID: string) => {
    return await this.db.getDocument(
      process.env.NEXT_APPWRITE_DB_ID as string,
      process.env.NEXT_APPWRITE_COLLECTION_ID as string,
      docID
    );
  }

  public async AddRegister(data: any): Promise<{ $id: string }> {
    const user = await AuthService.getInstance().getAccount();
    
    if (!data.teamId) {
      throw new Error("TeamId é obrigatório para criar registros");
    }

    const response = await this.db.createDocument(
      process.env.NEXT_APPWRITE_DB_ID as string,
      process.env.NEXT_APPWRITE_COLLECTION_ID as string,
      ID.unique(),
      {
        ...data,
        empresa: Number(data.empresa),
        responsavel: user.$id,
      },
      [
        Permission.read(Role.user(user.$id)),
        Permission.update(Role.user(user.$id)),
        Permission.delete(Role.user(user.$id)),
        Permission.read(Role.team(data.teamId)),
        Permission.write(Role.team(data.teamId)),
      ]
    );

    return { $id: response.$id };
  }

  public async update(docID: string, data: any): Promise<Models.Document> {
    const user = await AuthService.getInstance().getAccount();
    return await this.db.updateDocument(
      process.env.NEXT_APPWRITE_DB_ID as string,
      process.env.NEXT_APPWRITE_COLLECTION_ID as string,
      docID,
      {
        ...data,
        empresa: Number(data.empresa),
        responsavel: user.$id,
      }
    );
  }

  public delete = async (docID: string) => {
    return await this.db.deleteDocument(
      process.env.NEXT_APPWRITE_DB_ID as string,
      process.env.NEXT_APPWRITE_COLLECTION_ID as string,
      docID
    );
  }

  public async getDocumentsByTeam(teamId: string) {
    return await this.db.listDocuments(
      process.env.NEXT_APPWRITE_DB_ID as string,
      process.env.NEXT_APPWRITE_COLLECTION_ID as string,
      [Query.equal("teamId", teamId)]
    );
  }

  public async getFileDetails(fileId: string): Promise<Models.File> {
    return await this.storage.getFile(
      process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID as string,
      fileId
    );
  }

  async AddRegisterWithFiles(formData: FormData): Promise<any> {
    try {
      const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;
      if (!bucketId) throw new Error("Bucket ID não configurado");
  
      const storage = new Storage(client);
      const results = [];
      
      // Processa cada arquivo
      for (const [field, file] of formData.entries()) {
        if (file instanceof File && file.size > 0) {
          const uploadedFile = await storage.createFile(
            bucketId,
            ID.unique(),
            file
          );
          results.push({ field, fileId: uploadedFile.$id });
        }
      }
  
      return { success: true, results };
    } catch (err) {
      console.error("Erro detalhado:", err);
    }
  }
}

export default RegistersService;