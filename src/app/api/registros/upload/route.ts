import { NextResponse } from 'next/server';
import { Storage, ID } from 'appwrite';
import client from '@/config/appwrite.config';

export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const storage = new Storage(client);
        const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;

        if (!bucketId) {
            return NextResponse.json(
                { success: false, message: 'Bucket ID não configurado' },
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const results = [];
        const files = [
            { field: 'pdf_anexo1', file: formData.get('pdf_anexo1') },
            { field: 'pdf_anexo2', file: formData.get('pdf_anexo2') }
        ];

        for (const { field, file } of files) {
            if (file instanceof File && file.size > 0) {
                const fileBuffer = await file.arrayBuffer();
                const uploadedFile = await storage.createFile(
                    bucketId,
                    ID.unique(),
                    new File([fileBuffer], file.name, { type: file.type })
                );
                
                results.push({
                    field,
                    fileId: uploadedFile.$id
                });
            }
        }

        return NextResponse.json(
            { success: true, message: 'Arquivos enviados com sucesso', results },
            { headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Erro ao processar upload' },
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}