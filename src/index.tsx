import * as ios from './ios';
import * as android from './android';
import * as base64 from 'base64-arraybuffer';



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
  /** get exit properties */
  exif?: boolean;
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
   * read file to text
   */
  public static async readTextFile(path: string): Promise<string> {
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
   * write text to file
   */
  public static async writeTextFile(path: string, text: string): Promise<void> {
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
   * append text to file
   */
  public static async appendTextFile(path: string, text: string): Promise<void> {
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
    const info = await this.getBlobInfo(blob, { image: true });
    console.log('info', info);
    console.log('args', args);

    const scale = args.maxWidth / info.image!.width;

    // matrix: [
    //   0.2, 0, 0,
    //   0, 0.2, 0,
    //   0, 0, 1,
    // ],

    // matrix: scale. and translate if fill?
    // width / height ?
    return await this.updateImage(blob, {
      ...args,
      matrix: [
        scale, 0, 0,
        0, scale, 0,
        0, 0, 1,
      ],
      width: args.maxWidth,
      height: args.maxHeight,
    });
  }

}
