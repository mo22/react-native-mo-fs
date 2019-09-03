import * as ios from './ios';
import * as android from './android';



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
  encoding?: 'jpeg'|'png'|'webp';
  /** image output quality */
  quality?: number; // 0 to 1
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
   * get mime type by file extension
   */
  public static async getMimeType(extension: string): Promise<string|undefined> {
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
  public static getBlobURL(blob: Blob): string {
    if (android.Module) {
      return `content://${android.Module.authorities}/${blob.data.blobId}?offset=${blob.data.offset}&size=${blob.data.size}&type=${blob.data.type}`;
    } else {
      return URL.createObjectURL(blob);
    }
  }

  /**
   * get basic paths - document folder, cache folder, etc.
   */
  public static async getPaths(): Promise<Paths> {
    if (ios.Module) {
      const tmp = await ios.Module.getPaths();
      return {
        ...tmp,
        cache: tmp.caches,
        docs: tmp.document,
      };
    } else if (android.Module) {
      const tmp = await android.Module.getPaths();
      return {
        ...tmp,
        cache: tmp.externalCache || tmp.data || tmp.files,
        docs: tmp.files,
      };
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * read blob to utf8 or base64 string
   */
  public static async readBlob(blob: Blob, mode: 'base64'|'utf8'): Promise<string> {
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
  public static async createBlob(str: string, mode: 'base64'|'utf8'): Promise<Blob> {
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
  public static async readFile(path: string): Promise<Blob> {
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
   * read URL to blob (using fetch)
   */
  public static async readURL(url: string): Promise<Blob> {
    const tmp = await fetch(url);
    return await tmp.blob();
  }

  /**
   * write blob to file
   */
  public static async writeFile(path: string, blob: Blob): Promise<void> {
    if (ios.Module) {
      return await ios.Module.writeFile(path, blob.data);
    } else if (android.Module) {
      return await android.Module.writeFile(path, blob.data);
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * append blob to file
   */
  public static async appendFile(path: string, blob: Blob): Promise<void> {
    if (ios.Module) {
      return await ios.Module.appendFile(path, blob.data);
    } else if (android.Module) {
      return await android.Module.appendFile(path, blob.data);
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * delete file
   */
  public static async deleteFile(path: string): Promise<void> {
    if (ios.Module) {
      await ios.Module.deleteFile(path);
    } else if (android.Module) {
      await android.Module.deleteFile(path);
    } else {
      throw new Error('platform not supported');
    }
  }

  /**
   * rename file
   */
  public static async renameFile(fromPath: string, toPath: string): Promise<void> {
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
  public static async listDir(path: string): Promise<string[]> {
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
  public static async createDir(path: string): Promise<void> {
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
  public static async stat(path: string): Promise<Stat> {
    if (ios.Module) {
      const tmp = await ios.Module.stat(path);
      console.log('ASDSD', tmp);
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
   * get info about a blob. can calculate md5 / sha1 / sha256. get image size.
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
   * update / resize an image
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

}
