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
  paths: {
    bundle: string;
    document: string;
    caches: string;
  };
  getLastOpenURL(): Promise<OpenURLEvent|undefined>;
  getMimeType(extension: string): Promise<string|undefined>;
  getUtiFromMimeType(mimeType: string): Promise<string|undefined>;
  getUti(extension: string): Promise<string|undefined>;
  readBlob(blob: BlobData, mode: 'base64'|'utf8'): Promise<string>;
  createBlob(str: string, mode: 'base64'|'utf8'): Promise<BlobData>;
  readFile(path: string): Promise<BlobData>;
  writeFile(path: string, data: BlobData): Promise<void>;
  appendFile(path: string, data: BlobData): Promise<void>;
  deleteFile(path: string): Promise<void>;
  renameFile(fromPath: string, toPath: string): Promise<void>;
  listDir(path: string): Promise<string[]>;
  createDir(path: string): Promise<void>;
  stat(path: string): Promise<undefined | {
    NSFileOwnerAccountID?: null|number;
    NSFileCreationDate?: null|number;
    NSFileSystemFileNumber?: null|number;
    NSFileExtensionHidden?: boolean|number;
    NSFileType?: 'NSFileTypeDirectory'|'NSFileTypeRegular'|null,
    NSFileReferenceCount?: null|number;
    NSFileSystemNumber?: null|number;
    NSFileGroupOwnerAccountID?: null|number;
    NSFileGroupOwnerAccountName?: null|string;
    NSFileSize?: null|number;
    NSFilePosixPermissions?: null|number;
    NSFileModificationDate?: null|number;
  }>;
  getBlobInfo(blob: BlobData, args?: any): Promise<any>;
  getImageSize(blob: BlobData): Promise<{ width: number; height: number; }>;
  getExif(blob: BlobData): Promise<any>;
  updateImage(blob: BlobData, args?: any): Promise<BlobData>;
  showDocumentInteractionController(args: { path: string; uti?: string; annotation?: string; type: 'preview'|'openin'|'options' }): Promise<void>;
  showDocumentPickerView(args: { utis?: string[]; multiple?: boolean; }): Promise<undefined|string[]>; // UIDocumentPickerModeImport?,  ?
}

export interface OpenURLEvent {
  url: string;
  options: any;
}

export const Module = (Platform.OS === 'ios') ? NativeModules.ReactNativeMoFs as Module : undefined;

export const Events = Module ? new NativeEventEmitter(NativeModules.ReactNativeMoFs) as {
  addListener(eventType: 'ReactNativeMoFsOpenURL', listener: (event: OpenURLEvent) => void): EmitterSubscription;
} : undefined;
