import * as ios from './ios';
import * as android from './android';
import { Event } from 'mo-core';
interface BlobData {
    blobId: string;
    offset: number;
    size: number;
    name?: string;
    type?: string;
    lastModified?: number;
}
declare global {
    interface Blob {
        data: BlobData;
        close(): void;
    }
}
export declare type URL = string;
export declare type Path = string;
export declare type MimeType = string;
export declare type Base64 = string;
export declare type HexString = string;
export interface CryptBlobArgs {
    /** algorithm and mode */
    algorithm: 'aes-cbc';
    /** encryption / decryption */
    direction: 'encrypt' | 'decrypt';
    /** key as base64 string or buffer */
    key: Base64 | ArrayBufferLike;
    /** iv as base64 string or buffer */
    iv: Base64 | ArrayBufferLike;
}
export interface UpdateImageArgs {
    /** crop to width */
    width?: number;
    /** crop to height */
    height?: number;
    /** 3x3 matrix */
    matrix?: [number, number, number, number, number, number, number, number, number];
    /** image output type */
    encoding?: 'jpeg' | 'png' | 'webp';
    /** image output quality: 0(small file) to 1(large file) */
    quality?: number;
}
export interface ResizeImageArgs {
    /** new width */
    maxWidth: number;
    /** new height */
    maxHeight: number;
    /** crop image to fill area */
    fill?: boolean;
    /** image output type */
    encoding?: 'jpeg' | 'png' | 'webp';
    /** image output quality: 0(small file) to 1(large file) */
    quality?: number;
}
export interface PickFileArgs {
    /** mime types */
    types?: MimeType[];
    /** allow multiple selection */
    multiple?: boolean;
}
export interface PickMediaArgs {
    /** select images or videos */
    type?: 'image' | 'video' | 'all';
}
export interface PickMediaResult {
    /** url of the result */
    url: URL;
    /** result mime type */
    mimeType: string;
    /** the result handle needs to be released when done */
    release: () => void;
}
export interface Paths {
    cache: Path;
    docs: Path;
    data: Path;
    bundle?: Path;
    document?: Path;
    externalCache?: Path;
    files?: Path;
    packageResource?: Path;
    library?: Path;
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
export interface OpenFileEvent {
    /** the url to be opened */
    url: URL;
}
export interface AndroidStartActivityArgs {
    /** the android intent action. can be a Intent.X constant like "ACTION_SEND" */
    action: string;
    /** intent.setType */
    type?: string;
    /** intent.setPackage */
    package?: string;
    /** intent.setData(Uri) */
    data?: string;
    /** intent.setExtra(Intent.EXTRA_STREAM, Uri) */
    extra_stream?: string;
    /** intent.setExtra(key, value) */
    extras?: {
        [key: string]: string | number | boolean;
    };
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
     * be verbose
     */
    static setVerbose(verbose: boolean): void;
    private static verbose;
    /**
     * basic paths - document folder, cache folder, etc.
     */
    static readonly paths: Paths;
    /**
     * called if another app sends a file to this app
     */
    static openFile: Event<OpenFileEvent>;
    private static initialOpenFileDone;
    /**
     * get mime type by file extension
     */
    static getMimeType(path: string): Promise<MimeType | undefined>;
    /**
     * get default extension for mime type
     */
    static getExtensionForMimeType(mimeType: string): Promise<MimeType | undefined>;
    /**
     * get url for sharing a blob
     */
    static getBlobURL(blob: Blob): URL;
    /**
     * read blob to utf8 or base64 string
     */
    static readBlob(blob: Blob, mode: 'arraybuffer'): Promise<ArrayBuffer>;
    static readBlob(blob: Blob, mode: 'base64' | 'utf8'): Promise<Base64 | string>;
    /**
     * read blob to utf8 or base64 string
     */
    static createBlob(str: ArrayBuffer, mode: 'arraybuffer'): Promise<Blob>;
    static createBlob(str: Base64 | string, mode: 'base64' | 'utf8'): Promise<Blob>;
    /**
     * read file to blob
     */
    static readFile(path: Path): Promise<Blob>;
    /**
     * read file as text
     */
    static readTextFile(path: Path): Promise<string>;
    /**
     * read file as arraybuffer
     */
    static readBinaryFile(path: Path): Promise<ArrayBuffer>;
    /**
     * read URL to blob (using fetch)
     */
    static readURL(url: URL): Promise<Blob>;
    /**
     * write blob to file
     */
    static writeFile(path: Path, blob: Blob): Promise<void>;
    /**
     * write text to file
     */
    static writeTextFile(path: Path, text: string): Promise<void>;
    /**
     * write arraybuffer to file
     */
    static writeBinaryFile(path: Path, arrayBuffer: ArrayBufferLike): Promise<void>;
    /**
     * append blob to file
     */
    static appendFile(path: Path, blob: Blob): Promise<void>;
    /**
     * append text to file
     */
    static appendTextFile(path: Path, text: string): Promise<void>;
    /**
     * append arraybuffer to file
     */
    static appendBinaryFile(path: Path, arrayBuffer: ArrayBuffer): Promise<void>;
    /**
     * delete file
     */
    static deleteFile(path: Path, recursive?: boolean): Promise<void>;
    /**
     * rename file
     */
    static renameFile(fromPath: Path, toPath: Path): Promise<void>;
    /**
     * list files in directory
     */
    static listDir(path: Path): Promise<string[]>;
    /**
     * create directory. succeeds if directory exists. creates parents.
     */
    static createDir(path: Path): Promise<void>;
    /**
     * stat file. checks if file exists, is a dir, file size etc.
     */
    static stat(path: Path): Promise<Stat>;
    /**
     * set posix mode
     */
    static chmod(path: Path, mode: number): Promise<void>;
    /**
     * get hash of a blob. can calculate md5 / sha1 / sha256. returns hex.
     */
    static getBlobHash(blob: Blob, algorithm: 'md5' | 'sha1' | 'sha256' | 'sha512'): Promise<HexString>;
    /**
     * get hmac of a blob. can calculate sha1 / sha256 / sha512. returns hex.
     */
    static getBlobHmac(blob: Blob, algorithm: 'sha1' | 'sha256' | 'sha512', key: Base64 | ArrayBufferLike): Promise<HexString>;
    /**
     * encrypt / decrypt a blob
     */
    static cryptBlob(blob: Blob, args: CryptBlobArgs): Promise<Blob>;
    /**
     * get size of an image.
     */
    static getImageSize(blob: Blob): Promise<{
        width: number;
        height: number;
    }>;
    /**
     * get exif data
     */
    static getExif(blob: Blob): Promise<any>;
    /**
     * update / resize an image
     * works by appylying args.matrix to the image and optionally cropping the
     * result to width x height.
     */
    static updateImage(blob: Blob, args: UpdateImageArgs): Promise<Blob>;
    /**
     * resize an image
     */
    static resizeImage(blob: Blob, args: ResizeImageArgs): Promise<Blob>;
    /**
     * try to create thumbnail for image / video
     */
    static createThumbnail(blob: Blob, args: ResizeImageArgs): Promise<Blob | undefined>;
    /**
     * share file to another app
     */
    static shareFile(path: Path, type?: string): Promise<void>;
    /**
     * show a preview of the file
     */
    static viewFile(path: Path): Promise<void>;
    /**
     * show a file open dialog
     */
    static pickFile(args: PickFileArgs): Promise<URL[]>;
    /**
     * show a image / video open dialog
     * the result must be released by calling res.release()
     */
    static pickMedia(args: PickMediaArgs): Promise<(PickMediaResult) | undefined>;
    /**
     * capture a photo or video
     * the result must be released by calling res.release()
     */
    static captureMedia(args: PickMediaArgs): Promise<PickMediaResult | undefined>;
    /**
     * check if android package is installed
     */
    androidIsPackageInstalled(packageId: string): Promise<boolean>;
    /**
     * start android activity
     */
    androidStartActivity(args: AndroidStartActivityArgs): Promise<void>;
    /**
     * start android activity for result
     */
    androidStartActivityForResult(args: AndroidStartActivityArgs): Promise<{
        result: number;
    }>;
}
export {};
