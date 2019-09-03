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
export interface BlobInfoArgs {
    /** calculate hex md5 of blob */
    md5?: boolean;
    /** calculate hex sha1 of blob */
    sha1?: boolean;
    /** calculate hex sha256 of blob */
    sha256?: boolean;
    /** get image dimensions and info */
    image?: boolean;
}
export interface BlobInfo {
    /** size of blob */
    size: number;
    /** hex md5 */
    md5?: string;
    /** hex sha1 */
    sha1?: string;
    /** hex sha256 */
    sha256?: string;
    /** image info */
    image?: {
        width: number;
        height: number;
    };
}
export interface UpdateImageArgs {
    /** new width */
    width?: number;
    /** new height */
    height?: number;
    /** 3x3 matrix */
    matrix?: [number, number, number, number, number, number, number, number, number];
    /** image output type */
    encoding?: 'jpeg' | 'png' | 'webp';
    /** image output quality */
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
    /** true if the file or directory exists */
    exists: boolean;
    /** true if it is a directory */
    dir?: boolean;
    /** file size in bytes for files */
    size?: number;
    /** date modified as timestamp if available */
    modified?: number;
}
export declare class Fs {
    /**
     * native ios functions. use with caution
     */
    static readonly ios: typeof ios;
    /**
     * native android functions. use with caution
     */
    static readonly android: typeof android;
    /**
     * get mime type by file extension
     */
    static getMimeType(extension: string): Promise<string | undefined>;
    /**
     * get url for sharing a blob
     */
    static getBlobURL(blob: Blob): string;
    /**
     * get basic paths - document folder, cache folder, etc.
     */
    static getPaths(): Promise<Paths>;
    /**
     * read blob to utf8 or base64 string
     */
    static readBlob(blob: Blob, mode: 'arraybuffer'): Promise<ArrayBuffer>;
    static readBlob(blob: Blob, mode: 'base64' | 'utf8'): Promise<string>;
    /**
     * read blob to utf8 or base64 string
     */
    static createBlob(str: ArrayBuffer, mode: 'arraybuffer'): Promise<Blob>;
    static createBlob(str: string, mode: 'base64' | 'utf8'): Promise<Blob>;
    /**
     * read file to blob
     */
    static readFile(path: string): Promise<Blob>;
    /**
     * read URL to blob (using fetch)
     */
    static readURL(url: string): Promise<Blob>;
    /**
     * write blob to file
     */
    static writeFile(path: string, blob: Blob): Promise<void>;
    /**
     * append blob to file
     */
    static appendFile(path: string, blob: Blob): Promise<void>;
    /**
     * delete file
     */
    static deleteFile(path: string): Promise<void>;
    /**
     * rename file
     */
    static renameFile(fromPath: string, toPath: string): Promise<void>;
    /**
     * list files in directory
     */
    static listDir(path: string): Promise<string[]>;
    /**
     * create directory
     */
    static createDir(path: string): Promise<void>;
    /**
     * stat file. checks if file exists, is a dir, file size etc.
     */
    static stat(path: string): Promise<Stat>;
    /**
     * get info about a blob. can calculate md5 / sha1 / sha256. get image size.
     */
    static getBlobInfo(blob: Blob, args?: BlobInfoArgs): Promise<BlobInfo>;
    /**
     * update / resize an image
     */
    static updateImage(blob: Blob, args: UpdateImageArgs): Promise<Blob>;
}
export {};
