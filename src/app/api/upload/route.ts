import { mkdir,writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { ErrorResponse, UploadResponse } from "../../../../types/types";



export async function POST(resquest: NextRequest): Promise<NextResponse<UploadResponse | ErrorResponse>> {
    try {
        const data = await resquest.formData()
        const file = data.get('file') as File | null 

        if(!file){
            return NextResponse.json({error: "Arquivo obrigatório!"}, {status: 400})
        }

        if(!(file instanceof File)){
            return NextResponse.json({error: 'Formato inválido'}, {status: 400})
        }

        // Criar a pasta de arquivos, caso ela não exista
        const uploadDir = path.join(process.cwd(), 'uploads')
        await mkdir(uploadDir, {recursive: true})

        //Salvar arquivo

        const bytes = await file.arrayBuffer()
        const buffer =Buffer.from(bytes)
        const fileName = `${file.name}`
        const filePath = path.join(uploadDir, fileName)

        await writeFile(filePath, buffer)

        return NextResponse.json({
            message: 'Upload realizado com sucesso!',
            filename: fileName,
            fileUrl: `/api/files/${fileName}`
        })
    } catch (error) {
        console.error("Erro no upload: ", error)
        return NextResponse.json({error: 'Erro no servidor'}, {status: 500})
    }
}