import { NextResponse } from 'next/server';
import { Storage, ID } from 'appwrite';
import client from '@/config/appwrite.config';

export const config = {
    api: {
        bodyParser: false,
    },
};

interface UploadResult {
    success: boolean;
    message?: string;
    results?: Array<{
        field: string;
        fileId: string;
    }>;
    error?: string;
}

export async function POST(request: Request): Promise<NextResponse<UploadResult>> {
    try {
        const formData = await request.formData();
        const storage = new Storage(client);
        const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;

        if (!bucketId) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'Bucket ID não configurado' 
                },
                { status: 500 }
            );
        }

        const results: Array<{ field: string; fileId: string }> = [];
        const files = [
            { field: 'pdf_anexo1', file: formData.get('pdf_anexo1') },
            { field: 'pdf_anexo2', file: formData.get('pdf_anexo2') }
        ];

        for (const { field, file } of files) {
            if (file instanceof File && file.size > 0) {
                const uploadedFile = await storage.createFile(
                    bucketId,
                    ID.unique(),
                    file
                );
                
                results.push({
                    field,
                    fileId: uploadedFile.$id
                });
            }
        }

        if (results.length === 0) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'Nenhum arquivo válido enviado' 
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { 
                success: true, 
                message: 'Arquivos enviados com sucesso', 
                results 
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Erro no upload:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error.message || 'Erro ao processar upload' 
            },
            { status: 500 }
        );
    }
}