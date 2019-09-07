import { NativeModules, Platform, NativeEventEmitter, EmitterSubscription } from 'react-native';

interface BlobData {
  blobId: string;
  offset: number;
  size: number;
  name?: string;
  type?: string;
  lastModified?: number;
}

export interface Module {
  authorities: string;
  paths: {
    externalCache?: string;
    files: string;
    packageResource: string;
    data?: string;
  };
  getMimeType(extension: string): Promise<string|undefined>;
  readBlob(blob: BlobData, mode: 'base64'|'utf8'): Promise<string>;
  createBlob(str: string, mode: 'base64'|'utf8'): Promise<BlobData>;
  readFile(path: string): Promise<BlobData>;
  writeFile(path: string, data: BlobData): Promise<void>;
  appendFile(path: string, data: BlobData): Promise<void>;
  deleteFile(path: string): Promise<void>;
  renameFile(fromPath: string, toPath: string): Promise<void>;
  listDir(path: string): Promise<string[]>;
  createDir(path: string): Promise<void>;
  stat(path: string): Promise<{
    type?: 'file'|'directory';
    length?: number;
    lastModified?: number;
  }>;
  getBlobInfo(blob: BlobData, args?: any): Promise<any>;
  updateImage(blob: BlobData, args?: any): Promise<BlobData>;
  sendIntentChooser(args: { path: string; type?: string; title?: string; subject?: string; text?: string; }): Promise<void>;
  viewIntentChooser(args: { url: string; title?: string; }): Promise<void>;
  getContent(args: { type?: string; multiple?: boolean; title?: string; }): Promise<undefined|string>;

}

export interface LinkEvent {
  url: string;
}

export const Module = (Platform.OS === 'android') ? NativeModules.ReactNativeMoFs as Module : undefined;

export const Events = Module ? new NativeEventEmitter(NativeModules.ReactNativeMoFs) as {
  addListener(eventType: 'ReactNativeMoFsLink', listener: (event: LinkEvent) => void): EmitterSubscription;
} : undefined;
