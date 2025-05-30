import { NextResponse } from 'next/server';
import { Storage } from 'appwrite';
import client from '@/config/appwrite.config';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
        return NextResponse.json(
            { success: false, error: 'fileId é obrigatório' },
            { status: 400 }
        );
    }

    try {
        const storage = new Storage(client);
        const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;

        if (!bucketId) {
            return NextResponse.json(
                { success: false, error: 'Bucket ID não configurado' },
                { status: 500 }
            );
        }

        // Verifica se o arquivo existe
        await storage.getFile(bucketId, fileId);
        
        const fileInfo = await storage.getFile(bucketId, fileId);

        // Gera URL de visualização do arquivo (não download)
        const fileUrl = storage.getFileView(bucketId, fileId);

        return NextResponse.json({
            success: true,
            url: fileUrl.toString(),
            filename: fileInfo.name // nome original do arquivo
        });
    } catch (error: any) {
        console.error('Erro ao recuperar arquivo:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Erro ao recuperar arquivo'
            },
            { status: 500 }
        );
    }
}