import { EmitterSubscription } from 'react-native';
interface BlobData {
    blobId: string;
    offset: number;
    size: number;
    name?: string;
    type?: string;
    lastModified?: number;
}
interface Intent {
    action: string;
    type: string;
    data?: string;
    extras?: {
        [k: string]: any;
    };
}
export interface Module {
    authorities: string;
    paths: {
        externalCache?: string;
        files: string;
        cache: string;
        packageResource: string;
        data?: string;
    };
    setVerbose(verbose: boolean): void;
    getInitialIntent(): Promise<Intent>;
    getMimeTypeForPath(path: string): Promise<string | null>;
    getExtensionForMimeType(mimeType: string): Promise<string | null>;
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
    stat(path: string): Promise<{
        type?: 'file' | 'directory';
        length?: number;
        lastModified?: number;
    }>;
    chmod(path: string, mode: number): Promise<void>;
    getImageSize(blob: BlobData): Promise<{
        width: number;
        height: number;
    }>;
    getExif(blob: BlobData): Promise<any>;
    updateImage(blob: BlobData, args: {
        width?: number;
        height?: number;
        matrix?: [number, number, number, number, number, number, number, number, number];
        encoding?: 'jpeg' | 'png' | 'webp';
        quality?: number;
    }): Promise<BlobData>;
    createThumbnail(args: {
        path: string;
        encoding?: 'jpeg' | 'png' | 'webp';
        quality?: number;
    }): Promise<BlobData>;
    getProviderUri(path: string): Promise<string>;
    sendIntentChooser(args: {
        path: string;
        type?: string;
        title?: string;
        subject?: string;
        text?: string;
    }): Promise<void>;
    viewIntentChooser(args: ({
        url: string;
    } | {
        path: string;
    }) & {
        title?: string;
        type?: string;
    }): Promise<void>;
    getContent(args: {
        pick?: boolean;
        types?: string[];
        multiple?: boolean;
        title?: string;
    }): Promise<null | string[]>;
    getCamera(args: {
        title?: string;
        picture: boolean;
        video: boolean;
        videoQuality?: number;
        durationLimit?: number;
        sizeLimit?: number;
    }): Promise<null | {
        uri: string;
        type: string;
        tempPath?: string;
    }>;
}
export declare const Module: Module | undefined;
export declare const Events: {
    addListener(eventType: "ReactNativeMoFsNewIntent", listener: (event: Intent) => void): EmitterSubscription;
} | undefined;
export {};
