// src/types/appwrite.d.ts
import { Models } from 'appwrite';

declare module 'appwrite' {
  interface Account {
    get(userId: string): Promise<Models.User<Models.Preferences>>;
  }
}