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
        packageResource: string;
        data?: string;
    };
    setVerbose(verbose: boolean): void;
    getInitialIntent(): Promise<Intent>;
    getMimeType(extension: string): Promise<string | undefined>;
    readBlob(blob: BlobData, mode: 'base64' | 'utf8'): Promise<string>;
    createBlob(str: string, mode: 'base64' | 'utf8'): Promise<BlobData>;
    getBlobHash(blob: BlobData, hash: 'md5' | 'sha1' | 'sha256'): Promise<string>;
    readFile(path: string): Promise<BlobData>;
    writeFile(path: string, data: BlobData): Promise<void>;
    appendFile(path: string, data: BlobData): Promise<void>;
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
    updateImage(blob: BlobData, args?: any): Promise<BlobData>;
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
    }): Promise<void>;
    getContent(args: {
        types?: string[];
        multiple?: boolean;
        title?: string;
    }): Promise<undefined | string[]>;
}
export declare const Module: Module | undefined;
export declare const Events: {
    addListener(eventType: "ReactNativeMoFsNewIntent", listener: (event: Intent) => void): EmitterSubscription;
} | undefined;
export {};
