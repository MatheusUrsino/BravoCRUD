// app/api/registros/download/route.ts
import { NextResponse } from 'next/server';
import { Storage } from 'appwrite';
import client from '@/config/appwrite.config';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    
    if (!fileId) {
        return NextResponse.json(
            { error: 'fileId é obrigatório' },
            { status: 400 }
        );
    }

    try {
        const storage = new Storage(client);
        const bucketId = process.env.NEXT_APPWRITE_BUCKET_ID as string;
        
        // Gera URL de visualização do arquivo
        const fileUrl = storage.getFileView(bucketId, fileId);
        
        return NextResponse.json({ url: fileUrl.toString() });
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Erro ao recuperar arquivo' },
            { status: 500 }
        );
    }
}