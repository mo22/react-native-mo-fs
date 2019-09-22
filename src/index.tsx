import * as ios from './ios';
import * as android from './android';
import * as base64 from 'base64-arraybuffer';
import { Event } from 'mo-core';



declare var URL: {
  createObjectURL(blob: Blob): string;
};

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
    public data: BlobData;
    public slice(start?: number, end?: number): Blob;
    public close(): void;
    public readonly size: number;
    public readonly type: string;
  }
}



export type URL = string;
export type Path = string;
export type MimeType = string;



export interface BlobInfoArgs {
  /** calculate hex md5 of blob */
  md5?: boolean;
  /** calculate hex sha1 of blob */
  sha1?: boolean;
  /** calculate hex sha256 of blob */
  sha256?: boolean;
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
  /** image output quality */
  quality?: number; // 0 to 1
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
  /** image output quality */
  quality?: number; // 0 to 1
}

export interface PickFileArgs {
  /** mime types */
  types?: MimeType[];
  /** allow multiple selection */
  multiple?: boolean;
}

export interface Paths {
  cache: Path;
  docs: Path;
  bundle?: Path;
  document?: Path;
  caches?: Path;
  externalCache?: Path;
  files?: Path;
  packageResource?: Path;
  data?: Path;
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

  /**
   * basic paths - document folder, cache folder, etc.
   */
  public static readonly paths: Paths = ios.Module ? {
    ...ios.Module.paths,
    cache: ios.Module.paths.caches,
    docs: ios.Module.paths.document,
  } : android.Module ? {
    ...android.Module.paths,
    cache: android.Module.paths.externalCache || android.Module.paths.data || android.Module.paths.files,
    docs: android.Module.paths.files,
  } : {
    cache: '',
    docs: '',
  };

  /**
   * called if another app sends a file to this app
   */
  public static openFile = new Event<OpenFileEvent>((emit) => {
    if (ios.Events) {
      // @TODO: all urls?
      ios.Module!.getLastOpenURL().then((event) => {
        if (!event) return;
        emit({ url: event.url });
      });
      const sub = ios.Events.addListener('ReactNativeMoFsOpenURL', async (event) => {
        emit({ url: event.url });
      });
      return () => {
        sub.remove();
      };
    } else if (android.Events) {
      // @TODO action.VIEW ?
      // @TODO subject etc.?
      android.Module!.getInitialIntent().then((event) => {
        if (event.action === 'android.intent.action.SEND' && event.extras && event.extras['android.intent.extra.STREAM']) {
          emit({ url: event.extras['android.intent.extra.STREAM'] });
        }
      });
      const sub = android.Events.addListener('ReactNativeMoFsNewIntent', async (event) => {
        if (event.action === 'android.intent.action.SEND' && event.extras && event.extras['android.intent.extra.STREAM']) {
          emit({ url: event.extras['android.intent.extra.STREAM'] });
        }
      });
      return () => {
        sub.remove();
      };
    } else {
      return () => {};
    }
  });

  /**
   * get mime type by file extension
   */
  public static async getMimeType(extension: string): Promise<MimeType|undefined> {
    extension = extension.split('.').slice(-1).pop()!;
    if (ios.Module) {
      return await ios.Module.getMimeType(extension);
    } else if (android.Module) {
      return await android.Module.getMimeType(extension);
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
  public static async readBlob(blob: Blob, mode: 'base64'|'utf8'): Promise<string>;
  public static async readBlob(blob: Blob, mode: 'base64'|'utf8'|'arraybuffer'): Promise<string|ArrayBuffer> {
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
  public static async createBlob(str: string, mode: 'base64'|'utf8'): Promise<Blob>;
  public static async createBlob(str: string|ArrayBuffer, mode: 'base64'|'utf8'|'arraybuffer'): Promise<Blob> {
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
      blob.data = await ios.Module.readFile(path);
      return blob;
    } else if (android.Module) {
      const blob = new Blob();
      blob.data = await android.Module.readFile(path);
      const type = await this.getMimeType(path);
      if (type !== undefined) blob.data.type = type;
      return blob;
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * read file to text
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
      return await ios.Module.writeFile(path, blob.data);
    } else if (android.Module) {
      return await android.Module.writeFile(path, blob.data);
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
   * append blob to file
   */
  public static async appendFile(path: Path, blob: Blob): Promise<void> {
    if (ios.Module) {
      return await ios.Module.appendFile(path, blob.data);
    } else if (android.Module) {
      return await android.Module.appendFile(path, blob.data);
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
   * create directory
   */
  public static async createDir(path: Path): Promise<void> {
    if (ios.Module) {
      await ios.Module.createDir(path);
    } else if (android.Module) {
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
   * get info about a blob. can calculate md5 / sha1 / sha256.
   */
  public static async getBlobInfo(blob: Blob, args: BlobInfoArgs = {}): Promise<BlobInfo> {
    if (ios.Module) {
      return await ios.Module.getBlobInfo(blob.data, args);
    } else if (android.Module) {
      return await android.Module.getBlobInfo(blob.data, args);
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
      return await ios.Module.getExif(blob.data);
    } else if (android.Module) {
      return await android.Module.getExif(blob.data);
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
      res.data = await ios.Module.updateImage(blob.data, args);
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
   * share file to another app
   */
  public static async shareFile(path: Path): Promise<void> {
    if (Fs.ios.Module) {
      await Fs.ios.Module!.showDocumentInteractionController({ path: path, type: 'openin' });
    } else if (Fs.android.Module) {
      await Fs.android.Module.sendIntentChooser({ path: path });
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
   * show a preview of the file
   */
  public static async pickFile(args: PickFileArgs): Promise<URL[]> {
    if (Fs.ios.Module) {
      const utis = args.types ? (
        await Promise.all(args.types.map((i) => Fs.ios.Module!.getUtiFromMimeType(i) as Promise<string>))
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

}
