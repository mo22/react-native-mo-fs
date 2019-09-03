interface BlobData {
    blobId: string;
    offset: number;
    size: number;
    name?: string;
    type?: string;
    lastModified?: number;
}
export interface Module {
    getMimeType(extension: string): Promise<string | undefined>;
    readBlob(blob: Blob, mode: 'base64' | 'utf8'): Promise<string>;
    createBlob(str: string, mode: 'base64' | 'utf8'): Promise<BlobData>;
    getPaths(): Promise<{
        bundle: string;
        document: string;
        caches: string;
    }>;
    readFile(path: string): Promise<BlobData>;
    writeFile(path: string, data: BlobData): Promise<void>;
    appendTextFile(path: string, data: string): Promise<void>;
    deleteFile(path: string): Promise<void>;
    renameFile(fromPath: string, toPath: string): Promise<void>;
    listDir(path: string): Promise<string[]>;
    createDir(path: string): Promise<void>;
    stat(path: string): Promise<undefined | {
        NSFileOwnerAccountID?: null | number;
        NSFileCreationDate?: null | number;
        NSFileSystemFileNumber?: null | number;
        NSFileExtensionHidden?: boolean | number;
        NSFileType?: 'NSFileTypeDirectory' | 'NSFileTypeRegular' | null;
        NSFileReferenceCount?: null | number;
        NSFileSystemNumber?: null | number;
        NSFileGroupOwnerAccountID?: null | number;
        NSFileGroupOwnerAccountName?: null | string;
        NSFileSize?: null | number;
        NSFilePosixPermissions?: null | number;
        NSFileModificationDate?: null | number;
    }>;
    getBlobInfo(blob: Blob, args?: {
        md5?: boolean;
        sha1?: boolean;
        sha256?: boolean;
    }): Promise<{
        size: number;
        sha1?: string;
        md5?: string;
        sha256?: string;
    }>;
    updateImage(blob: Blob, args?: any): Promise<BlobData>;
}
export declare const Module: Module | undefined;
export {};
