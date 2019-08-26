interface BlobData {
    blobId: string;
    offset: number;
    size: number;
    name?: string;
    type?: string;
    lastModified?: number;
}
export interface Module {
    authorities: string;
    getMimeType(extension: string): Promise<string | undefined>;
    getPaths(): Promise<{
        externalCache?: string;
        files: string;
        packageResource: string;
        data?: string;
    }>;
    readFile(path: string): Promise<BlobData>;
    writeFile(path: string, data: BlobData): Promise<void>;
    deleteFile(path: string): Promise<void>;
    renameFile(fromPath: string, toPath: string): Promise<void>;
    listDir(path: string): Promise<string[]>;
    createDir(path: string): Promise<void>;
    stat(path: string): Promise<{
        type?: 'file' | 'directory';
        length?: number;
        lastModified?: number;
    }>;
    getBlobInfo(blob: BlobData, args?: {
        md5?: boolean;
        sha1?: boolean;
        sha256?: boolean;
    }): Promise<{
        size: number;
        sha1?: string;
        md5?: string;
        sha256?: string;
    }>;
    updateImage(blob: BlobData, args?: any): Promise<BlobData>;
}
export declare const Module: Module | undefined;
export {};
