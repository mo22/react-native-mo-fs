import * as ios from './ios';
import * as android from './android';
import * as base64 from 'base64-arraybuffer';
import { Event } from 'mo-core';
import { PermissionsAndroid } from 'react-native';


// declare var URL: {
//   createObjectURL(blob: Blob): string;
// };

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
    // public slice(start?: number, end?: number): Blob;
    // public readonly size: number;
    // public readonly type: string;
  }
}


export type URL = string;
export type Path = string;
export type MimeType = string;
export type Base64 = string;
export type HexString = string;


export interface CryptBlobArgs {
  /** algorithm and mode */
  algorithm: 'aes-cbc';
  /** encryption / decryption */
  direction: 'encrypt'|'decrypt';
  /** key as base64 string or buffer */
  key: Base64|ArrayBufferLike;
  /** iv as base64 string or buffer */
  iv: Base64|ArrayBufferLike
}

export interface UpdateImageArgs {
  /** crop to width */
  width?: number;
  /** crop to height */
  height?: number;
  /** 3x3 matrix */
  matrix?: [number, number, number, number, number, number, number, number, number];
  /** image output type */
  encoding?: 'jpeg'|'png'|'webp';
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
  encoding?: 'jpeg'|'png'|'webp';
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
  type?: 'image'|'video'|'all';
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


export class Fs {
  /**
   * native ios functions. use with caution
   */
  public static readonly ios = ios;

  /**
   * native android functions. use with caution
   */
  public static readonly android = android;

  /**
   * be verbose
   */
  public static setVerbose(verbose: boolean) {
    this.verbose = verbose;
    if (ios.Module) {
      ios.Module.setVerbose(verbose);
    } else if (android.Module) {
      android.Module.setVerbose(verbose);
    }
  }

  private static verbose = false;

  /**
   * basic paths - document folder, cache folder, etc.
   */
  public static readonly paths: Paths = ios.Module ? {
    ...ios.Module.paths,
    cache: ios.Module.paths.cache,
    docs: ios.Module.paths.document,
    data: ios.Module.paths.library,
  } : android.Module ? {
    ...android.Module.paths,
    cache: android.Module.paths.cache,
    docs: android.Module.paths.files,
    data: android.Module.paths.data || android.Module.paths.files,
  } : {
    cache: '',
    docs: '',
    data: '',
  };

  /**
   * called if another app sends a file to this app
   */
  public static openFile = new Event<OpenFileEvent>((emit) => {
    if (Fs.verbose) console.log('ReactNativeMoFs.openFile subscribe');
    if (ios.Events) {
      if (!Fs.initialOpenFileDone) {
        Fs.initialOpenFileDone = true;
        ios.Module!.getLastOpenURL().then((event) => {
          if (!event) return;
          if (Fs.verbose) console.log('ReactNativeMoFs.openFile initial url', event.url);
          emit({ url: event.url });
        });
      }
      const sub = ios.Events.addListener('ReactNativeMoFsOpenURL', async (event) => {
        if (Fs.verbose) console.log('ReactNativeMoFs.openFile event url', event.url);
        emit({ url: event.url });
      });
      return () => {
        if (Fs.verbose) console.log('ReactNativeMoFs.openFile unsubscribe');
        sub.remove();
      };
    } else if (android.Events) {
      if (!Fs.initialOpenFileDone) {
        Fs.initialOpenFileDone = true;
        android.Module!.getInitialIntent().then((event) => {
          if (Fs.verbose) console.log('ReactNativeMoFs.openFile initial intent', event);
          if (event.action === 'android.intent.action.SEND' && event.extras && event.extras['android.intent.extra.STREAM']) {
            emit({ url: event.extras['android.intent.extra.STREAM'] });
          }
        });
      }
      const sub = android.Events.addListener('ReactNativeMoFsNewIntent', async (event) => {
        if (Fs.verbose) console.log('ReactNativeMoFs.openFile event intent', event);
        if (event.action === 'android.intent.action.SEND' && event.extras && event.extras['android.intent.extra.STREAM']) {
          emit({ url: event.extras['android.intent.extra.STREAM'] });
        }
      });
      return () => {
        if (Fs.verbose) console.log('ReactNativeMoFs.openFile unsubscribe');
        sub.remove();
      };
    } else {
      return () => {};
    }
  });

  private static initialOpenFileDone = false;

  /**
   * get mime type by file extension
   */
  public static async getMimeType(path: string): Promise<MimeType|undefined> {
    if (ios.Module) {
      return await ios.Module.getMimeTypeForPath(path);
    } else if (android.Module) {
      return await android.Module.getMimeTypeForPath(path) || undefined;
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * get default extension for mime type
   */
  public static async getExtensionForMimeType(mimeType: string): Promise<MimeType|undefined> {
    if (ios.Module) {
      return await ios.Module.getExtensionForMimeType(mimeType);
    } else if (android.Module) {
      return await android.Module.getExtensionForMimeType(mimeType) || undefined;
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * get url for sharing a blob
   */
  public static getBlobURL(blob: Blob): URL {
    if (android.Module) {
      return `content://${android.Module.authorities}/blob/${blob.data.blobId}?offset=${blob.data.offset}&size=${blob.data.size}&type=${blob.data.type}`;
    } else {
      return URL.createObjectURL(blob);
    }
  }

  /**
   * read blob to utf8 or base64 string
   */
  public static async readBlob(blob: Blob, mode: 'arraybuffer'): Promise<ArrayBuffer>;
  public static async readBlob(blob: Blob, mode: 'base64'|'utf8'): Promise<Base64|string>;
  public static async readBlob(blob: Blob, mode: 'base64'|'utf8'|'arraybuffer'): Promise<Base64|string|ArrayBuffer> {
    if (mode === 'arraybuffer') {
      return base64.decode(await this.readBlob(blob, 'base64'));
    }
    if (ios.Module) {
      return await ios.Module.readBlob(blob.data, mode);
    } else if (android.Module) {
      return await android.Module.readBlob(blob.data, mode);
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * read blob to utf8 or base64 string
   */
  public static async createBlob(str: ArrayBuffer, mode: 'arraybuffer'): Promise<Blob>;
  public static async createBlob(str: Base64|string, mode: 'base64'|'utf8'): Promise<Blob>;
  public static async createBlob(str: Base64|string|ArrayBuffer, mode: 'base64'|'utf8'|'arraybuffer'): Promise<Blob> {
    if (mode === 'arraybuffer') {
      if (typeof str === 'string') throw new Error('str must be a ArrayBuffer');
      return await this.createBlob(base64.encode(str), 'base64');
    }
    if (typeof str !== 'string') throw new Error('str must be a string');
    if (ios.Module) {
      const blob = new Blob();
      blob.data = await ios.Module.createBlob(str, mode);
      return blob;
    } else if (android.Module) {
      const blob = new Blob();
      blob.data = await android.Module.createBlob(str, mode);
      return blob;
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * read file to blob
   */
  public static async readFile(path: Path): Promise<Blob> {
    if (ios.Module) {
      const blob = new Blob();
      blob.data = await ios.Module.readFile({ path: path });
      return blob;
    } else if (android.Module) {
      const blob = new Blob();
      blob.data = await android.Module.readFile({ path: path });
      const type = await this.getMimeType(path);
      if (type !== undefined) blob.data.type = type;
      return blob;
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * read file as text
   */
  public static async readTextFile(path: Path): Promise<string> {
    const blob = await this.readFile(path);
    try {
      return await this.readBlob(blob, 'utf8');
    } finally {
      blob.close();
    }
  }

  /**
   * read file as arraybuffer
   */
  public static async readBinaryFile(path: Path): Promise<ArrayBuffer> {
    const blob = await this.readFile(path);
    try {
      return await this.readBlob(blob, 'arraybuffer');
    } finally {
      blob.close();
    }
  }

  /**
   * read URL to blob (using fetch)
   */
  public static async readURL(url: URL): Promise<Blob> {
    const tmp = await fetch(url);
    return await tmp.blob();
  }

  /**
   * write blob to file
   */
  public static async writeFile(path: Path, blob: Blob): Promise<void> {
    if (ios.Module) {
      await ios.Module.writeFile({ path: path, blob: blob.data, offset: 0, truncate: true });
    } else if (android.Module) {
      await android.Module.writeFile({ path: path, blob: blob.data, offset: 0, truncate: true });
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * write text to file
   */
  public static async writeTextFile(path: Path, text: string): Promise<void> {
    const blob = await this.createBlob(text, 'utf8');
    try {
      await this.writeFile(path, blob);
    } finally {
      blob.close();
    }
  }

  /**
   * write arraybuffer to file
   */
  public static async writeBinaryFile(path: Path, arrayBuffer: ArrayBufferLike): Promise<void> {
    const blob = await this.createBlob(arrayBuffer, 'arraybuffer');
    try {
      await this.writeFile(path, blob);
    } finally {
      blob.close();
    }
  }

  /**
   * append blob to file
   */
  public static async appendFile(path: Path, blob: Blob): Promise<void> {
    if (ios.Module) {
      await ios.Module.writeFile({ path: path, blob: blob.data, offset: -1 });
    } else if (android.Module) {
      await android.Module.writeFile({ path: path, blob: blob.data, offset: -1 });
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * append text to file
   */
  public static async appendTextFile(path: Path, text: string): Promise<void> {
    const blob = await this.createBlob(text, 'utf8');
    try {
      await this.appendFile(path, blob);
    } finally {
      blob.close();
    }
  }

  /**
   * append arraybuffer to file
   */
  public static async appendBinaryFile(path: Path, arrayBuffer: ArrayBuffer): Promise<void> {
    const blob = await this.createBlob(arrayBuffer, 'arraybuffer');
    try {
      await this.appendFile(path, blob);
    } finally {
      blob.close();
    }
  }

  /**
   * delete file
   */
  public static async deleteFile(path: Path, recursive = false): Promise<void> {
    if (ios.Module) {
      await ios.Module.deleteFile(path, recursive);
    } else if (android.Module) {
      await android.Module.deleteFile(path, recursive);
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * rename file
   */
  public static async renameFile(fromPath: Path, toPath: Path): Promise<void> {
    if (ios.Module) {
      await ios.Module.renameFile(fromPath, toPath);
    } else if (android.Module) {
      await android.Module.renameFile(fromPath, toPath);
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * list files in directory
   */
  public static async listDir(path: Path): Promise<string[]> {
    if (ios.Module) {
      return await ios.Module.listDir(path);
    } else if (android.Module) {
      return await android.Module.listDir(path);
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * create directory. succeeds if directory exists. creates parents.
   */
  public static async createDir(path: Path): Promise<void> {
    if (ios.Module) {
      await ios.Module.createDir(path);
    } else if (android.Module) {
      const stat = await this.stat(path);
      if (stat.exists && stat.dir) return;
      await android.Module.createDir(path);
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * stat file. checks if file exists, is a dir, file size etc.
   */
  public static async stat(path: Path): Promise<Stat> {
    if (ios.Module) {
      const tmp = await ios.Module.stat(path);
      return {
        exists: tmp !== undefined,
        dir: tmp && tmp.NSFileType === 'NSFileTypeDirectory',
        size: tmp && tmp.NSFileSize || undefined,
        modified: tmp && tmp.NSFileModificationDate ? Math.round(1000 * tmp.NSFileModificationDate) : undefined,
      };
    } else if (android.Module) {
      const tmp = await android.Module.stat(path);
      return {
        exists: tmp && tmp.type ? true : false,
        dir: tmp && tmp.type === 'directory',
        size: tmp && tmp.length || undefined,
        modified: tmp && tmp.lastModified || undefined,
      };
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * set posix mode
   */
  public static async chmod(path: Path, mode: number): Promise<void> {
    if (ios.Module) {
      await ios.Module.setAttributes(path, {
        'NSFilePosixPermissions': mode,
      });
    } else if (android.Module) {
      await android.Module.chmod(path, mode);
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * get hash of a blob. can calculate md5 / sha1 / sha256. returns hex.
   */
  public static async getBlobHash(blob: Blob, algorithm: 'md5'|'sha1'|'sha256'|'sha512'): Promise<HexString> {
    if (ios.Module) {
      return await ios.Module.getBlobHash(blob.data, algorithm);
    } else if (android.Module) {
      return await android.Module.getBlobHash(blob.data, algorithm);
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * get hmac of a blob. can calculate sha1 / sha256 / sha512. returns hex.
   */
  public static async getBlobHmac(blob: Blob, algorithm: 'sha1'|'sha256'|'sha512', key: Base64|ArrayBufferLike): Promise<HexString> {
    if (typeof key !== 'string') {
      key = base64.encode(key);
    }
    if (ios.Module) {
      return await ios.Module.getBlobHmac(blob.data, algorithm, key);
    } else if (android.Module) {
      return await android.Module.getBlobHmac(blob.data, algorithm, key);
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * encrypt / decrypt a blob
   */
  public static async cryptBlob(blob: Blob, args: CryptBlobArgs): Promise<Blob> {
    const key = (typeof args.key !== 'string') ? base64.encode(args.key) : args.key;
    const iv = (typeof args.iv !== 'string') ? base64.encode(args.iv) : args.iv;
    if (ios.Module) {
      const resBlob = new Blob();
      resBlob.data = await ios.Module.cryptBlob(blob.data, args.algorithm, args.direction === 'encrypt', key, iv);
      return resBlob;
    } else if (android.Module) {
      const resBlob = new Blob();
      resBlob.data = await android.Module.cryptBlob(blob.data, args.algorithm, args.direction === 'encrypt', key, iv);
      return resBlob;
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * get size of an image.
   */
  public static async getImageSize(blob: Blob): Promise<{ width: number; height: number; }> {
    if (ios.Module) {
      return await ios.Module.getImageSize(blob.data);
    } else if (android.Module) {
      return await android.Module.getImageSize(blob.data);
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * get exif data
   */
  public static async getExif(blob: Blob): Promise<any> {
    if (ios.Module) {
      try {
        return await ios.Module.getExif(blob.data);
      } catch (e) {
        return undefined;
      }
    } else if (android.Module) {
      try {
        return (await android.Module.getExif(blob.data)) || undefined;
      } catch (e) {
        return undefined;
      }
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * update / resize an image
   * works by appylying args.matrix to the image and optionally cropping the
   * result to width x height.
   */
  public static async updateImage(blob: Blob, args: UpdateImageArgs): Promise<Blob> {
    if (args.quality !== undefined && (args.quality < 0 || args.quality > 1)) throw new Error('quality must be 0..1');
    if (ios.Module) {
      const res = new Blob();
      res.data = await ios.Module.updateImage(blob.data, {
        ...args,
        encoding: (args.encoding === 'webp') ? 'png' : args.encoding,
      });
      return res;
    } else if (android.Module) {
      const res = new Blob();
      res.data = await android.Module.updateImage(blob.data, args);
      return res;
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * resize an image
   */
  public static async resizeImage(blob: Blob, args: ResizeImageArgs): Promise<Blob> {
    const size = await this.getImageSize(blob);
    let scale = 1;
    let width = size.width;
    let height = size.height;
    let tx = 0;
    let ty = 0;
    if (args.fill) {
      scale = Math.max(args.maxWidth / width, args.maxHeight / height);
      width *= scale;
      height *= scale;
      if (width > args.maxWidth) {
        tx = - (width - args.maxWidth) / 2;
        width = args.maxWidth;
      }
      if (height > args.maxHeight) {
        ty = - (height - args.maxHeight) / 2;
        height = args.maxHeight;
      }
    } else {
      scale = Math.min(args.maxWidth / width, args.maxHeight / height);
      width *= scale;
      height *= scale;
    }
    return await this.updateImage(blob, {
      ...args,
      matrix: [
        scale, 0, tx,
        0, scale, ty,
        0, 0, 1,
      ],
      width: width,
      height: height,
    });
  }

  /**
   * try to create thumbnail for image / video
   */
  public static async createThumbnail(blob: Blob, args: ResizeImageArgs): Promise<Blob|undefined> {
    let source;
    if (blob.type.startsWith('video/')) {
      if (Fs.ios.Module) {
        const tempFile = Fs.paths.cache + '/' + blob.data.blobId + '.mov';
        await Fs.writeFile(tempFile, blob);
        try {
          source = new Blob();
          source.data = await Fs.ios.Module.assetImageGenerator({ url: 'file://' + tempFile });
        } finally {
          await Fs.deleteFile(tempFile);
        }
      } else if (Fs.android.Module) {
        const tempFile = Fs.paths.cache + '/' + blob.data.blobId + '.mp4';
        await Fs.writeFile(tempFile, blob);
        try {
          source = new Blob();
          source.data = await Fs.android.Module.createThumbnail({ path: tempFile });
        } finally {
          await Fs.deleteFile(tempFile);
        }
      }
    } else if (blob.type.startsWith('image/')) {
      source = blob.slice();
    }
    if (!source) return undefined;
    try {
      return await Fs.resizeImage(source, args);
    } finally {
      source.close();
    }
  }

  /**
   * share file to another app
   */
  public static async shareFile(path: Path, type?: string): Promise<void> {
    if (Fs.ios.Module) {
      await Fs.ios.Module!.showDocumentInteractionController({ path: path, type: 'openin' });
    } else if (Fs.android.Module) {
      await Fs.android.Module.sendIntentChooser({
        path: path,
        type: type || (await this.getMimeType(path)) || 'application/octet-stream'
      });
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * show a preview of the file
   */
  public static async viewFile(path: Path): Promise<void> {
    if (Fs.ios.Module) {
      await Fs.ios.Module!.showDocumentInteractionController({ path: path, type: 'preview' });
    } else if (Fs.android.Module) {
      await Fs.android.Module.viewIntentChooser({ path: path });
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * show a file open dialog
   */
  public static async pickFile(args: PickFileArgs): Promise<URL[]> {
    if (Fs.ios.Module) {
      const utis = args.types ? (
        await Promise.all(args.types.map((i) => Fs.ios.Module!.getUtiForMimeType(i) as Promise<string>))
      ) : (
        ['public.item']
      );
      const res = await Fs.ios.Module!.showDocumentPickerView({ utis: utis, multiple: args.multiple });
      return res || [];
    } else if (Fs.android.Module) {
      const res = await Fs.android.Module.getContent({ types: args.types, multiple: args.multiple });
      return res || [];
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * show a image / video open dialog
   * the result must be released by calling res.release()
   */
  public static async pickMedia(args: PickMediaArgs): Promise<(PickMediaResult)|undefined> {
    const type = args.type || 'all';
    if (Fs.ios.Module) {
      const res = await Fs.ios.Module!.showImagePickerController({
        // allowsEditing: true,
        mediaTypes: [
          ...((type === 'all' || type === 'image') && ['public.image'] || []),
          ...((type === 'all' || type === 'video') && ['public.movie'] || []),
        ],
      });
      if (res === undefined) return undefined;
      return {
        url: res.url,
        mimeType: res.type,
        release: () => {
          if (res.tempPath) {
            Fs.deleteFile(res.tempPath).catch(() => {});
          }
        },
      };
    } else if (Fs.android.Module) {
      const res = await Fs.android.Module.getContent({
        pick: true,
        types: [
          ...((type === 'all' || type === 'image') && ['image/*'] || []),
          ...((type === 'all' || type === 'video') && ['video/*'] || []),
        ],
      });
      if (res === undefined || res === null) return undefined;
      if (res.length === 0) return undefined;
      return {
        url: res[0],
        mimeType: await this.getMimeType(res[0]) || '', // @TODO hmmm?
        release: () => {
        },
      };
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * capture a photo or video
   * the result must be released by calling res.release()
   */
  public static async captureMedia(args: PickMediaArgs): Promise<PickMediaResult|undefined> {
    const type = args.type || 'all';
    if (Fs.ios.Module) {
      const res = await Fs.ios.Module!.showImagePickerController({
        // allowsEditing: true, // ?
        sourceType: ios.ImagePickerControllerSourceType.Camera,
        mediaTypes: [
          ...((type === 'all' || type === 'image') && ['public.image'] || []),
          ...((type === 'all' || type === 'video') && ['public.movie'] || []),
        ],
      });
      if (res === undefined) return undefined;
      return {
        url: res.url,
        mimeType: res.type,
        release: () => {
          if (res.tempPath) {
            Fs.deleteFile(res.tempPath).catch(() => {});
          }
        },
      };
    } else if (Fs.android.Module) {
      if (await PermissionsAndroid.request('android.permission.CAMERA') !== 'granted') {
        return undefined;
      }
      const res = await Fs.android.Module.getCamera({
        picture: (type === 'all' || type === 'image'),
        video: (type === 'all' || type === 'video'),
        // videoQuality?: number; // 0=low, 1=high
        // durationLimit?: number; // seconds
        // sizeLimit?: number;
      });
      if (res === undefined || res === null) return undefined;
      return {
        url: res.uri,
        mimeType: res.type,
        release: () => {
          if (res.tempPath) {
            Fs.deleteFile(res.tempPath).catch(() => {});
          }
        },
      };
    } else {
      throw new Error('platform not supported');
    }
  }

}
