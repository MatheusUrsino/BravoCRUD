import { Storage } from 'appwrite';
import formidable from 'formidable';
import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import client from '../../../config/appwrite.config';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data usando formidable
    const form = new formidable.IncomingForm();
    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(request as any, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const storage = new Storage(client);
    const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;

    if (!bucketId) {
      return NextResponse.json(
        { success: false, message: 'Bucket ID not configured' },
        { status: 500 }
      );
    }

    const results: { field: string; fileId: string }[] = [];

    // Processar pdf_anexo1
    if (files.pdf_anexo1) {
      const file = Array.isArray(files.pdf_anexo1) ? files.pdf_anexo1[0] : files.pdf_anexo1;
      const fileBuffer = fs.readFileSync(file.filepath);
      const fileObject = new File([fileBuffer], file.originalFilename || 'uploaded-file', { type: file.mimetype });
      const uploadedFile = await storage.createFile(
        bucketId,
        'unique()',
        fileObject
      );
      results.push({ field: 'pdf_anexo1', fileId: uploadedFile.$id });
      fs.unlinkSync(file.filepath);
    }

    // Processar pdf_anexo2
    if (files.pdf_anexo2) {
      const file = Array.isArray(files.pdf_anexo2) ? files.pdf_anexo2[0] : files.pdf_anexo2;
      const fileBuffer = fs.readFileSync(file.filepath);
      const fileObject = new File([fileBuffer], file.originalFilename || 'uploaded-file', { type: file.mimetype });
      const uploadedFile = await storage.createFile(
        bucketId,
        'unique()',
        fileObject
      );
      results.push({ field: 'pdf_anexo2', fileId: uploadedFile.$id });
      fs.unlinkSync(file.filepath);
    }

    return NextResponse.json({ success: true, results }, { status: 200 });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}