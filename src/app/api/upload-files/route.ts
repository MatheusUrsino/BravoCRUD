import { Storage } from 'appwrite';
import client from '@/config/appwrite.config';
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';

interface FileUploadResult {
    field: string;
    fileId: string;
}

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ 
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        const form = new formidable.IncomingForm();
        const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                resolve([fields, files]);
            });
        });

        const storage = new Storage(client);
        const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;
        
        if (!bucketId) {
            return res.status(500).json({
                success: false,
                message: 'Bucket ID not configured'
            });
        }

        const results: FileUploadResult[] = [];

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

        return res.status(200).json({ 
            success: true, 
            results 
        });

    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}