import * as ios from './ios';
import * as android from './android';
import * as base64 from 'base64-arraybuffer';
export class Fs {
    /**
     * get mime type by file extension
     */
    static async getMimeType(extension) {
        extension = extension.split('.').slice(-1).pop();
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
    /**
     * get url for sharing a blob
     */
    static getBlobURL(blob) {
        if (android.Module) {
            return `content://${android.Module.authorities}/blob/${blob.data.blobId}?offset=${blob.data.offset}&size=${blob.data.size}&type=${blob.data.type}`;
        }
        else {
            return URL.createObjectURL(blob);
        }
    }
    static async readBlob(blob, mode) {
        if (mode === 'arraybuffer') {
            return base64.decode(await this.readBlob(blob, 'base64'));
        }
        if (ios.Module) {
            return await ios.Module.readBlob(blob.data, mode);
        }
        else if (android.Module) {
            return await android.Module.readBlob(blob.data, mode);
        }
        else {
            throw new Error('platform not supported');
        }
    }
    static async createBlob(str, mode) {
        if (mode === 'arraybuffer') {
            if (typeof str === 'string')
                throw new Error('str must be a ArrayBuffer');
            return await this.createBlob(base64.encode(str), 'base64');
        }
        if (typeof str !== 'string')
            throw new Error('str must be a string');
        if (ios.Module) {
            const blob = new Blob();
            blob.data = await ios.Module.createBlob(str, mode);
            return blob;
        }
        else if (android.Module) {
            const blob = new Blob();
            blob.data = await android.Module.createBlob(str, mode);
            return blob;
        }
        else {
            throw new Error('platform not supported');
        }
    }
    /**
     * read file to blob
     */
    static async readFile(path) {
        if (ios.Module) {
            const blob = new Blob();
            blob.data = await ios.Module.readFile(path);
            return blob;
        }
        else if (android.Module) {
            const blob = new Blob();
            blob.data = await android.Module.readFile(path);
            const type = await this.getMimeType(path);
            if (type !== undefined)
                blob.data.type = type;
            return blob;
        }
        else {
            throw new Error('platform not supported');
        }
    }
    /**
     * read file to text
     */
    static async readTextFile(path) {
        const blob = await this.readFile(path);
        try {
            return await this.readBlob(blob, 'utf8');
        }
        finally {
            blob.close();
        }
    }
    /**
     * read URL to blob (using fetch)
     */
    static async readURL(url) {
        const tmp = await fetch(url);
        return await tmp.blob();
    }
    /**
     * write blob to file
     */
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
    /**
     * write text to file
     */
    static async writeTextFile(path, text) {
        const blob = await this.createBlob(text, 'utf8');
        try {
            await this.writeFile(path, blob);
        }
        finally {
            blob.close();
        }
    }
    /**
     * append blob to file
     */
    static async appendFile(path, blob) {
        if (ios.Module) {
            return await ios.Module.appendFile(path, blob.data);
        }
        else if (android.Module) {
            return await android.Module.appendFile(path, blob.data);
        }
        else {
            throw new Error('platform not supported');
        }
    }
    /**
     * append text to file
     */
    static async appendTextFile(path, text) {
        const blob = await this.createBlob(text, 'utf8');
        try {
            await this.appendFile(path, blob);
        }
        finally {
            blob.close();
        }
    }
    /**
     * delete file
     */
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
    /**
     * rename file
     */
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
    /**
     * list files in directory
     */
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
    /**
     * create directory
     */
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
    /**
     * stat file. checks if file exists, is a dir, file size etc.
     */
    static async stat(path) {
        if (ios.Module) {
            const tmp = await ios.Module.stat(path);
            return {
                exists: tmp !== undefined,
                dir: tmp && tmp.NSFileType === 'NSFileTypeDirectory',
                size: tmp && tmp.NSFileSize || undefined,
                modified: tmp && tmp.NSFileModificationDate ? Math.round(1000 * tmp.NSFileModificationDate) : undefined,
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
    /**
     * get info about a blob. can calculate md5 / sha1 / sha256.
     */
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
    /**
     * get size of an image.
     */
    static async getImageSize(blob) {
        if (ios.Module) {
            return await ios.Module.getImageSize(blob.data);
        }
        else if (android.Module) {
            return await android.Module.getImageSize(blob.data);
        }
        else {
            throw new Error('platform not supported');
        }
    }
    /**
     * get exif data
     */
    static async getExif(blob) {
        if (ios.Module) {
            return await ios.Module.getExif(blob.data);
        }
        else if (android.Module) {
            return await android.Module.getExif(blob.data);
        }
        else {
            throw new Error('platform not supported');
        }
    }
    /**
     * update / resize an image
     * works by appylying args.matrix to the image and optionally cropping the
     * result to width x height.
     */
    static async updateImage(blob, args) {
        if (args.quality !== undefined && (args.quality < 0 || args.quality > 1))
            throw new Error('quality must be 0..1');
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
    /**
     * resize an image
     */
    static async resizeImage(blob, args) {
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
                tx = -(width - args.maxWidth) / 2;
                width = args.maxWidth;
            }
            if (height > args.maxHeight) {
                ty = -(height - args.maxHeight) / 2;
                height = args.maxHeight;
            }
        }
        else {
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
     * open file in other app
     */
    static async openFile(path) {
        if (Fs.ios.Module) {
            await Fs.ios.Module.showDocumentInteractionController({ path: path, type: 'openin' });
        }
        else if (Fs.android.Module) {
            await Fs.android.Module.sendIntentChooser({ path: path });
        }
    }
    /**
     * show a preview of the file
     */
    static async viewFile(path) {
        if (Fs.ios.Module) {
            await Fs.ios.Module.showDocumentInteractionController({ path: path, type: 'preview' });
        }
        else if (Fs.android.Module) {
            await Fs.android.Module.viewIntentChooser({ path: path });
        }
    }
    /**
     * show a preview of the file
     */
    static async pickFile(args) {
        console.log('pickFile args', args);
        if (Fs.ios.Module) {
            console.log('types', args.types);
            const utis = args.types ? (await Promise.all(args.types.map((i) => Fs.ios.Module.getUtiFromMimeType(i)))) : (['public.item']);
            console.log('utis', utis);
            const res = await Fs.ios.Module.showDocumentPickerView({ utis: utis, multiple: args.multiple });
            console.log('res', res);
        }
        else if (Fs.android.Module) {
            const res = await Fs.android.Module.getContent({ types: args.types, multiple: args.multiple });
            console.log('res', res);
        }
    }
}
/**
 * native ios functions. use with caution
 */
Fs.ios = ios;
/**
 * native android functions. use with caution
 */
Fs.android = android;
/**
 * basic paths - document folder, cache folder, etc.
 */
Fs.paths = ios.Module ? {
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
//# sourceMappingURL=index.js.map