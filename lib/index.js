import * as ios from './ios';
import * as android from './android';
export class Fs {
    static async getMimeType(extension) {
        if (ios.Module) {
            return await ios.Module.getMimeType(extension);
        }
        else if (android.Module) {
            return await android.Module.getMimeType(extension);
        }
        else {
            throw new Error('platform not supported');
        }
    }
    static getBlobURL(blob) {
        if (android.Module) {
            return `content://${android.Module.authorities}/${blob.data.blobId}?offset=${blob.data.offset}&size=${blob.data.size}&type=${blob.data.type}`;
        }
        else {
            return URL.createObjectURL(blob);
        }
    }
    static async getPaths() {
        if (ios.Module) {
            const tmp = await ios.Module.getPaths();
            return {
                ...tmp,
                cache: tmp.caches,
                docs: tmp.document,
            };
        }
        else if (android.Module) {
            const tmp = await android.Module.getPaths();
            return {
                ...tmp,
                cache: tmp.externalCache || tmp.data || tmp.files,
                docs: tmp.files,
            };
        }
        else {
            throw new Error('platform not supported');
        }
    }
    static async readFile(path) {
        if (ios.Module) {
            const blob = new Blob();
            blob.data = await ios.Module.readFile(path);
            return blob;
        }
        else if (android.Module) {
            const blob = new Blob();
            blob.data = await android.Module.readFile(path);
            return blob;
        }
        else {
            throw new Error('platform not supported');
        }
    }
    static async readURL(url) {
        const tmp = await fetch(url);
        return await tmp.blob();
    }
    static async writeFile(path, blob) {
        if (ios.Module) {
            return await ios.Module.writeFile(path, blob.data);
        }
        else if (android.Module) {
            return await android.Module.writeFile(path, blob.data);
        }
        else {
            throw new Error('platform not supported');
        }
    }
    static async deleteFile(path) {
        if (ios.Module) {
            await ios.Module.deleteFile(path);
        }
        else if (android.Module) {
            await android.Module.deleteFile(path);
        }
        else {
            throw new Error('platform not supported');
        }
    }
    static async renameFile(fromPath, toPath) {
        if (ios.Module) {
            await ios.Module.renameFile(fromPath, toPath);
        }
        else if (android.Module) {
            await android.Module.renameFile(fromPath, toPath);
        }
        else {
            throw new Error('platform not supported');
        }
    }
    static async listDir(path) {
        if (ios.Module) {
            return await ios.Module.listDir(path);
        }
        else if (android.Module) {
            return await android.Module.listDir(path);
        }
        else {
            throw new Error('platform not supported');
        }
    }
    static async createDir(path) {
        if (ios.Module) {
            await ios.Module.createDir(path);
        }
        else if (android.Module) {
            await android.Module.createDir(path);
        }
        else {
            throw new Error('platform not supported');
        }
    }
    static async stat(path) {
        if (ios.Module) {
            const tmp = await ios.Module.stat(path);
            return {
                exists: tmp !== undefined,
                dir: tmp && tmp.NSFileType === 'NSFileTypeDirectory',
                size: tmp && tmp.NSFileSize || undefined,
                modified: tmp && tmp.NSFileModificationDate ? (tmp.NSFileModificationDate * 1000) : undefined,
            };
        }
        else if (android.Module) {
            const tmp = await android.Module.stat(path);
            return {
                exists: tmp && tmp.type ? true : false,
                dir: tmp && tmp.type === 'directory',
                size: tmp && tmp.length || undefined,
                modified: tmp && tmp.lastModified || undefined,
            };
        }
        else {
            throw new Error('platform not supported');
        }
    }
    static async getBlobInfo(blob, args = {}) {
        if (ios.Module) {
            return await ios.Module.getBlobInfo(blob.data, args);
        }
        else if (android.Module) {
            return await android.Module.getBlobInfo(blob.data, args);
        }
        else {
            throw new Error('platform not supported');
        }
    }
    static async updateImage(blob, args) {
        if (ios.Module) {
            const res = new Blob();
            res.data = await ios.Module.updateImage(blob.data, args);
            return res;
        }
        else if (android.Module) {
            const res = new Blob();
            res.data = await android.Module.updateImage(blob.data, args);
            return res;
        }
        else {
            throw new Error('platform not supported');
        }
    }
}
Fs.ios = ios;
Fs.android = android;
//# sourceMappingURL=index.js.map