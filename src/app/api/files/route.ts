import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import path from 'path';
import { ErrorResponse } from '../../../../types/types';

interface FileInfo {
  filename: string;
  size: number;
  uploadDate: Date;
  downloadUrl: string;
}

interface FilesResponse {
  files: FileInfo[];
}

export async function GET(request: NextRequest): Promise<NextResponse<FilesResponse | ErrorResponse>> {
  try {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    try {
      const files = await readdir(uploadDir);
      
      const fileDetails: FileInfo[] = await Promise.all(
        files.map(async (filename): Promise<FileInfo> => {
          const filePath = path.join(uploadDir, filename);
          const stats = await stat(filePath);
          
          return {
            filename,
            size: stats.size,
            uploadDate: stats.mtime,
            downloadUrl: `/api/files/${filename}`
          };
        })
      );
      
      return NextResponse.json({ files: fileDetails });
      
    } catch {
      return NextResponse.json({ files: [] });
    }
    
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}