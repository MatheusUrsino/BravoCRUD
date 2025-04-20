import { Account, Models, Teams, AppwriteException } from "appwrite";
import client from "../config/appwrite.config";

declare module 'appwrite' {
  interface User<> {
    teamId?: string;
  }
}

class AuthService {
  private static instance: AuthService;
  private static account: Account = new Account(client);
  private static teams = new Teams(client);

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async login(email: string, password: string): Promise<Models.Session> {
    try {
      return await AuthService.account.createEmailPasswordSession(
        email.trim().toLowerCase(),
        password.trim()
      );
    } catch (error) {
      const appwriteError = error as AppwriteException;
      let message = "Erro ao fazer login";
      
      if (appwriteError.type === 'user_invalid_credentials') {
        message = "Credenciais inválidas";
      } else if (appwriteError.type === 'user_blocked') {
        message = "Usuário bloqueado";
      } else if (appwriteError.message?.includes('email')) {
        message = "Formato de email inválido";
      }
      
      throw new Error(message);
    }
  }

  public async register(data: { 
    userId: string; 
    name: string; 
    email: string; 
    password: string 
  }): Promise<Models.User<Models.Preferences>> {
    try {
      const { userId, name, email, password } = data;
      
      // Ordem correta dos parâmetros para o Appwrite:
      // create(userId: string, email: string, password: string, name?: string)
      return await AuthService.account.create(
        userId.trim(),
        email.trim().toLowerCase(),
        password.trim(),
        name.trim()
      );
    } catch (error) {
      const appwriteError = error as AppwriteException;
      let message = "Erro ao cadastrar";
      
      if (appwriteError.message?.includes('email')) {
        message = "Email inválido ou já em uso";
      } else if (appwriteError.message?.includes('password')) {
        message = "Senha não atende aos requisitos mínimos";
      } else if (appwriteError.message?.includes('user')) {
        message = "ID de usuário já existe";
      }
      
      throw new Error(message);
    }
  }

  public logout = () => {
    return AuthService.account.deleteSession("current");
  }

  public async getAccount(): Promise<Models.User<Models.Preferences> & { teamId?: string }> {
    const account = await AuthService.account.get();
    const teamId = await this.getFirstUserTeamId();
    return { ...account, teamId };
  }

  private async getFirstUserTeamId() {
    try {
      const teams = await AuthService.teams.list();
      return teams.teams[0]?.$id;
    } catch (error) {
      console.error("Error getting user teams:", error);
      return undefined;
    }
  }

  public async getTeam(teamId: string) {
    return AuthService.teams.get(teamId);
  }
}

export default AuthService;