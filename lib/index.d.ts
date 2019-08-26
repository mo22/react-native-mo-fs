import * as ios from './ios';
import * as android from './android';
interface BlobData {
    blobId: string;
    offset: number;
    size: number;
    name?: string;
    type?: string;
    lastModified?: number;
}
declare global {
    class Blob {
        data: BlobData;
        slice(start?: number, end?: number): Blob;
        close(): void;
        readonly size: number;
        readonly type: string;
    }
}
export interface UpdateImageArgs {
    width?: number;
    height?: number;
    matrix?: [number, number, number, number, number, number, number, number, number];
    encoding?: 'jpeg' | 'png' | 'webp';
    quality?: number;
}
export interface Paths {
    cache: string;
    docs: string;
    bundle?: string;
    document?: string;
    caches?: string;
    externalCache?: string;
    files?: string;
    packageResource?: string;
    data?: string;
}
export interface Stat {
    exists: boolean;
    dir?: boolean;
    size?: number;
    modified?: number;
}
export declare class Fs {
    static readonly ios: typeof ios;
    static readonly android: typeof android;
    static getMimeType(extension: string): Promise<string | undefined>;
    static getBlobURL(blob: Blob): string;
    static getPaths(): Promise<Paths>;
    static readFile(path: string): Promise<Blob>;
    static readURL(url: string): Promise<Blob>;
    static writeFile(path: string, blob: Blob): Promise<void>;
    static deleteFile(path: string): Promise<void>;
    static renameFile(fromPath: string, toPath: string): Promise<void>;
    static listDir(path: string): Promise<string[]>;
    static createDir(path: string): Promise<void>;
    static stat(path: string): Promise<Stat>;
    static getBlobInfo(blob: Blob, args?: {
        md5?: boolean;
        sha1?: boolean;
        sha256?: boolean;
    }): Promise<{
        size: number;
        md5?: string;
        sha1?: string;
        sha256?: string;
    }>;
    static updateImage(blob: Blob, args: UpdateImageArgs): Promise<Blob>;
}
export {};
