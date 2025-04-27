import { Models } from "appwrite";

export type Filter = {
  id: string;
  value: string;
  field: string;
  type?: string;
};

export type DocumentWithFiles = Models.Document & {
  pdf_anexo1_id?: string;
  pdf_anexo2_id?: string;
};

export type AvailableField = {
  value: string;
  label: string;
  type: string;
};

