import { Models } from "appwrite";

export interface Filter {
  id: string;
  field: string;
  value: string;
  type: string; // NÃO pode ser string | undefined
}

export type DocumentWithFiles = Models.Document & {
  pdf_anexo1_id?: string;
  pdf_anexo2_id?: string;
};

export interface AvailableField {
  value: string;
  label: string;
  type: string;
  options?: { value: string; label: string }[]; // Adicione esta linha
}

