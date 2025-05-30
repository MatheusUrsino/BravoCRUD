"use client";

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
      console.error("Erro detalhado do Appwrite:", appwriteError); // Adicione esta linha

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
    email: string; 
    password: string,
    name: string; 

  }): Promise<Models.User<Models.Preferences>> {
    return await AuthService.account.create(
      data.userId,
      data.email,
      data.password,
      data.name,

    );
  }

  public logout = () => {
    return AuthService.account.deleteSession("current");
  }

  public async getAccount() {
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

  public async getMemberships(teamId: string) {
    try {
      const memberships = await AuthService.teams.listMemberships(teamId);
      return memberships.memberships;
    } catch (error) {
      console.error("Error getting team memberships:", error);
      return undefined;
    }
  }

  public async getUsers(userId: string) {
    try {
      return await AuthService.account.get(userId);
    } catch (error) {
      return {};
    }
  }
}

export default AuthService;