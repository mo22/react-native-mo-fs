import * as ios from './ios';
import * as android from './android';
import { Platform } from 'react-native';



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

export interface UpdateImageArgs {
  width?: number;
  height?: number;
  matrix?: [number, number, number, number, number, number, number, number, number];
  encoding?: 'jpeg'|'png'|'webp';
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
  exists: boolean;
  dir?: boolean;
  size?: number;
  modified?: number;
}



export class Fs {
  public static readonly ios = ios;
  public static readonly android = android;

  public static async getMimeType(extension: string): Promise<string|undefined> {
    if (Platform.OS === 'ios') {
      return await ios.Module.getMimeType(extension);
    } else if (Platform.OS === 'android') {
      return await android.Module.getMimeType(extension);
    } else {
      throw new Error('platform not supported');
    }
  }

  public static getBlobURL(blob: Blob): string {
    if (Platform.OS === 'android') {
      return `content://${android.Module.authorities}/${blob.data.blobId}?offset=${blob.data.offset}&size=${blob.data.size}&type=${blob.data.type}`;
    } else {
      return URL.createObjectURL(blob);
    }
  }

  public static async getPaths(): Promise<Paths> {
    if (Platform.OS === 'ios') {
      const tmp = await ios.Module.getPaths();
      return {
        ...tmp,
        cache: tmp.caches,
        docs: tmp.document,
      };
    } else if (Platform.OS === 'android') {
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

  public static async readFile(path: string): Promise<Blob> {
    if (Platform.OS === 'ios') {
      const blob = new Blob();
      blob.data = await ios.Module.readFile(path);
      return blob;
    } else if (Platform.OS === 'android') {
      const blob = new Blob();
      blob.data = await android.Module.readFile(path);
      return blob;
    } else {
      throw new Error('platform not supported');
    }
  }

  public static async readURL(url: string): Promise<Blob> {
    const tmp = await fetch(url);
    return await tmp.blob();
  }

  public static async writeFile(path: string, blob: Blob): Promise<void> {
    if (Platform.OS === 'ios') {
      return await ios.Module.writeFile(path, blob.data);
    } else if (Platform.OS === 'android') {
      return await android.Module.writeFile(path, blob.data);
    } else {
      throw new Error('platform not supported');
    }
  }

  public static async deleteFile(path: string): Promise<void> {
    if (Platform.OS === 'ios') {
      await ios.Module.deleteFile(path);
    } else if (Platform.OS === 'android') {
      await android.Module.deleteFile(path);
    } else {
      throw new Error('platform not supported');
    }
  }

  public static async renameFile(fromPath: string, toPath: string): Promise<void> {
    if (Platform.OS === 'ios') {
      await ios.Module.renameFile(fromPath, toPath);
    } else if (Platform.OS === 'android') {
      await android.Module.renameFile(fromPath, toPath);
    } else {
      throw new Error('platform not supported');
    }
  }

  public static async listDir(path: string): Promise<string[]> {
    if (Platform.OS === 'ios') {
      return await ios.Module.listDir(path);
    } else if (Platform.OS === 'android') {
      return await android.Module.listDir(path);
    } else {
      throw new Error('platform not supported');
    }
  }

  public static async createDir(path: string): Promise<void> {
    if (Platform.OS === 'ios') {
      await ios.Module.createDir(path);
    } else if (Platform.OS === 'android') {
      await android.Module.createDir(path);
    } else {
      throw new Error('platform not supported');
    }
  }

  public static async stat(path: string): Promise<Stat> {
    if (Platform.OS === 'ios') {
      const tmp = await ios.Module.stat(path);
      return {
        exists: tmp !== undefined,
        dir: tmp && tmp.NSFileType === 'NSFileTypeDirectory',
        size: tmp && tmp.NSFileSize || undefined,
        modified: tmp && tmp.NSFileModificationDate ? (tmp.NSFileModificationDate * 1000) : undefined,
      };
    } else if (Platform.OS === 'android') {
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

  public static async getBlobInfo(blob: Blob, args: { md5?: boolean; sha1?: boolean; sha256?: boolean } = {}): Promise<{ size: number; md5?: string; sha1?: string; sha256?: string; }> {
    if (Platform.OS === 'ios') {
      return await ios.Module.getBlobInfo(blob.data, args);
    } else if (Platform.OS === 'android') {
      return await android.Module.getBlobInfo(blob.data, args);
    } else {
      throw new Error('platform not supported');
    }
  }

  public static async updateImage(blob: Blob, args: UpdateImageArgs): Promise<Blob> {
    if (Platform.OS === 'ios') {
      const res = new Blob();
      res.data = await ios.Module.updateImage(blob.data, args);
      return res;
    } else if (Platform.OS === 'android') {
      const res = new Blob();
      res.data = await android.Module.updateImage(blob.data, args);
      return res;
    } else {
      throw new Error('platform not supported');
    }
  }

}
