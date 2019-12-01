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
        library: string;
    };
    setVerbose(verbose: boolean): void;
    getLastOpenURL(): Promise<OpenURLEvent | undefined>;
    getMimeTypeForPath(extension: string): Promise<string | undefined>;
    getUtiForMimeType(mimeType: string): Promise<string | undefined>;
    getUtiForPath(extension: string): Promise<string | undefined>;
    getExtensionForMimeType(mimeType: string): Promise<string | undefined>;
    readBlob(blob: BlobData, mode: 'base64' | 'utf8'): Promise<string>;
    createBlob(str: string, mode: 'base64' | 'utf8'): Promise<BlobData>;
    getBlobHash(blob: BlobData, algorithm: 'md5' | 'sha1' | 'sha256' | 'sha512'): Promise<string>;
    getBlobHmac(blob: BlobData, algorithm: 'sha1' | 'sha256' | 'sha512', key: string): Promise<string>;
    cryptBlob(blob: BlobData, algorithm: 'aes-cbc', encrypt: boolean, key: string, iv: string): Promise<BlobData>;
    readFile(args: {
        path: string;
        size?: number;
        offset?: number;
    }): Promise<BlobData>;
    writeFile(args: {
        path: string;
        blob: BlobData;
        offset?: number;
        truncate?: boolean;
    }): Promise<BlobData>;
    deleteFile(path: string, recursive: boolean): Promise<void>;
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
    setAttributes(path: string, attributes: {
        [k: string]: any;
    }): Promise<void>;
    getImageSize(blob: BlobData): Promise<{
        width: number;
        height: number;
    }>;
    getExif(blob: BlobData): Promise<any>;
    updateImage(blob: BlobData, args?: {
        width?: number;
        height?: number;
        matrix?: [number, number, number, number, number, number, number, number, number];
        encoding?: 'jpeg' | 'png';
        quality?: number;
    }): Promise<BlobData>;
    assetImageGenerator(args: {
        url: string;
        encoding?: 'jpeg' | 'png';
        quality?: number;
    }): Promise<BlobData>;
    showDocumentInteractionController(args: {
        path: string;
        uti?: string;
        annotation?: string;
        type: 'preview' | 'openin' | 'options';
    }): Promise<void>;
    showDocumentPickerView(args: {
        utis?: string[];
        multiple?: boolean;
    }): Promise<undefined | string[]>;
    showImagePickerController(args: {
        sourceType?: number;
        mediaTypes?: string[];
        allowsEditing?: boolean;
        showsCameraControls?: boolean;
        videoMaximumDuration?: number;
        imageExportPreset?: number;
        videoExportPreset?: string;
    }): Promise<undefined | {
        UIImagePickerControllerReferenceURL: string;
        UIImagePickerControllerImageURL?: string;
        UIImagePickerControllerMediaURL?: string;
        UIImagePickerControllerCropRect?: null;
        UIImagePickerControllerMediaType?: string;
        UIImagePickerControllerPHAsset: null;
    }>;
}
export interface OpenURLEvent {
    url: string;
    options: {
        [k: string]: any;
    };
}
export declare const Module: Module | undefined;
export declare const Events: {
    addListener(eventType: "ReactNativeMoFsOpenURL", listener: (event: OpenURLEvent) => void): EmitterSubscription;
} | undefined;
export {};
