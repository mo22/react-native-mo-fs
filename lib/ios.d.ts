import { EmitterSubscription } from 'react-native';
interface BlobData {
    blobId: string;
    offset: number;
    size: number;
    name?: string;
    type?: string;
    lastModified?: number;
}
export interface Module {
    paths: {
        bundle: string;
        document: string;
        caches: string;
    };
    getMimeType(extension: string): Promise<string | undefined>;
    readBlob(blob: BlobData, mode: 'base64' | 'utf8'): Promise<string>;
    createBlob(str: string, mode: 'base64' | 'utf8'): Promise<BlobData>;
    readFile(path: string): Promise<BlobData>;
    writeFile(path: string, data: BlobData): Promise<void>;
    appendFile(path: string, data: BlobData): Promise<void>;
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
    getBlobInfo(blob: BlobData, args?: any): Promise<any>;
    updateImage(blob: BlobData, args?: any): Promise<BlobData>;
}
export interface LinkEvent {
    url: string;
}
export declare const Module: Module | undefined;
export declare const Events: {
    addListener(eventType: "ReactNativeMoFsLink", listener: (event: LinkEvent) => void): EmitterSubscription;
} | undefined;
export {};
