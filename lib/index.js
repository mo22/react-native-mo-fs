import * as ios from './ios';
import * as android from './android';
import * as base64 from 'base64-arraybuffer';
import { Event } from 'mo-core';
import { PermissionsAndroid } from 'react-native';
export class Fs {
    /**
     * native ios functions. use with caution
     */
    static ios = ios;
    /**
     * native android functions. use with caution
     */
    static android = android;
    /**
     * be verbose
     */
    static setVerbose(verbose) {
        this.verbose = verbose;
        if (ios.Module) {
            ios.Module.setVerbose(verbose);
        }
        else if (android.Module) {
            android.Module.setVerbose(verbose);
        }
    }
    static verbose = false;
    /**
     * basic paths - document folder, cache folder, etc.
     */
    static paths = ios.Module ? {
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
    static openFile = new Event((emit) => {
        if (Fs.verbose)
            console.log('ReactNativeMoFs.openFile subscribe');
        if (ios.Events) {
            if (!Fs.initialOpenFileDone) {
                Fs.initialOpenFileDone = true;
                ios.Module.getLastOpenURL().then((event) => {
                    if (!event)
                        return;
                    if (Fs.verbose)
                        console.log('ReactNativeMoFs.openFile initial url', event.url);
                    emit({ url: event.url });
                });
            }
            const sub = ios.Events.addListener('ReactNativeMoFsOpenURL', async (event) => {
                if (Fs.verbose)
                    console.log('ReactNativeMoFs.openFile event url', event.url);
                emit({ url: event.url });
            });
            return () => {
                if (Fs.verbose)
                    console.log('ReactNativeMoFs.openFile unsubscribe');
                sub.remove();
            };
        }
        else if (android.Events) {
            if (!Fs.initialOpenFileDone) {
                Fs.initialOpenFileDone = true;
                android.Module.getInitialIntent().then((event) => {
                    if (Fs.verbose)
                        console.log('ReactNativeMoFs.openFile initial intent', event);
                    if (event.action === 'android.intent.action.SEND' && event.extras && event.extras['android.intent.extra.STREAM']) {
                        emit({ url: event.extras['android.intent.extra.STREAM'] });
                    }
                });
            }
            const sub = android.Events.addListener('ReactNativeMoFsNewIntent', async (event) => {
                if (Fs.verbose)
                    console.log('ReactNativeMoFs.openFile event intent', event);
                if (event.action === 'android.intent.action.SEND' && event.extras && event.extras['android.intent.extra.STREAM']) {
                    emit({ url: event.extras['android.intent.extra.STREAM'] });
                }
            });
            return () => {
                if (Fs.verbose)
                    console.log('ReactNativeMoFs.openFile unsubscribe');
                sub.remove();
            };
        }
        else {
            return () => { };
        }
    });
    static initialOpenFileDone = false;
    /**
     * get mime type by file extension
     */
    static async getMimeType(path) {
        if (ios.Module) {
            return await ios.Module.getMimeTypeForPath(path);
        }
        else if (android.Module) {
            return await android.Module.getMimeTypeForPath(path) || undefined;
        }
        else {
            throw new Error('platform not supported');
        }
    }
    /**
     * get default extension for mime type
     */
    static async getExtensionForMimeType(mimeType) {
        if (ios.Module) {
            return await ios.Module.getExtensionForMimeType(mimeType);
        }
        else if (android.Module) {
            return await android.Module.getExtensionForMimeType(mimeType) || undefined;
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
            blob.data = await ios.Module.readFile({ path: path });
            return blob;
        }
        else if (android.Module) {
            const blob = new Blob();
            blob.data = await android.Module.readFile({ path: path });
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
     * read file as text
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
     * read file as arraybuffer
     */
    static async readBinaryFile(path) {
        const blob = await this.readFile(path);
        try {
            return await this.readBlob(blob, 'arraybuffer');
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
            await ios.Module.writeFile({ path: path, blob: blob.data, offset: 0, truncate: true });
        }
        else if (android.Module) {
            await android.Module.writeFile({ path: path, blob: blob.data, offset: 0, truncate: true });
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
     * write arraybuffer to file
     */
    static async writeBinaryFile(path, arrayBuffer) {
        const blob = await this.createBlob(arrayBuffer, 'arraybuffer');
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
            await ios.Module.writeFile({ path: path, blob: blob.data, offset: -1 });
        }
        else if (android.Module) {
            await android.Module.writeFile({ path: path, blob: blob.data, offset: -1 });
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
     * append arraybuffer to file
     */
    static async appendBinaryFile(path, arrayBuffer) {
        const blob = await this.createBlob(arrayBuffer, 'arraybuffer');
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
    static async deleteFile(path, recursive = false) {
        if (ios.Module) {
            await ios.Module.deleteFile(path, recursive);
        }
        else if (android.Module) {
            await android.Module.deleteFile(path, recursive);
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
     * create directory. succeeds if directory exists. creates parents.
     */
    static async createDir(path) {
        if (ios.Module) {
            await ios.Module.createDir(path);
        }
        else if (android.Module) {
            const stat = await this.stat(path);
            if (stat.exists && stat.dir)
                return;
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
     * set posix mode
     */
    static async chmod(path, mode) {
        if (ios.Module) {
            await ios.Module.setAttributes(path, {
                'NSFilePosixPermissions': mode,
            });
        }
        else if (android.Module) {
            await android.Module.chmod(path, mode);
        }
        else {
            throw new Error('platform not supported');
        }
    }
    /**
     * get hash of a blob. can calculate md5 / sha1 / sha256. returns hex.
     */
    static async getBlobHash(blob, algorithm) {
        if (ios.Module) {
            return await ios.Module.getBlobHash(blob.data, algorithm);
        }
        else if (android.Module) {
            return await android.Module.getBlobHash(blob.data, algorithm);
        }
        else {
            throw new Error('platform not supported');
        }
    }
    /**
     * get hmac of a blob. can calculate sha1 / sha256 / sha512. returns hex.
     */
    static async getBlobHmac(blob, algorithm, key) {
        if (typeof key !== 'string') {
            key = base64.encode(key);
        }
        if (ios.Module) {
            return await ios.Module.getBlobHmac(blob.data, algorithm, key);
        }
        else if (android.Module) {
            return await android.Module.getBlobHmac(blob.data, algorithm, key);
        }
        else {
            throw new Error('platform not supported');
        }
    }
    /**
     * encrypt / decrypt a blob
     */
    static async cryptBlob(blob, args) {
        const key = (typeof args.key !== 'string') ? base64.encode(args.key) : args.key;
        const iv = (typeof args.iv !== 'string') ? base64.encode(args.iv) : args.iv;
        if (ios.Module) {
            const resBlob = new Blob();
            resBlob.data = await ios.Module.cryptBlob(blob.data, args.algorithm, args.direction === 'encrypt', key, iv);
            return resBlob;
        }
        else if (android.Module) {
            const resBlob = new Blob();
            resBlob.data = await android.Module.cryptBlob(blob.data, args.algorithm, args.direction === 'encrypt', key, iv);
            return resBlob;
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
            try {
                return await ios.Module.getExif(blob.data);
            }
            catch (e) {
                return undefined;
            }
        }
        else if (android.Module) {
            try {
                return (await android.Module.getExif(blob.data)) || undefined;
            }
            catch (e) {
                return undefined;
            }
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
            res.data = await ios.Module.updateImage(blob.data, {
                ...args,
                encoding: (args.encoding === 'webp') ? 'png' : args.encoding,
            });
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
     * try to create thumbnail for image / video
     */
    static async createThumbnail(blob, args) {
        let source;
        if (blob.type.startsWith('video/')) {
            if (Fs.ios.Module) {
                const tempFile = Fs.paths.cache + '/' + blob.data.blobId + '.mov';
                await Fs.writeFile(tempFile, blob);
                try {
                    source = new Blob();
                    source.data = await Fs.ios.Module.assetImageGenerator({ url: 'file://' + tempFile });
                }
                finally {
                    await Fs.deleteFile(tempFile);
                }
            }
            else if (Fs.android.Module) {
                const tempFile = Fs.paths.cache + '/' + blob.data.blobId + '.mp4';
                await Fs.writeFile(tempFile, blob);
                try {
                    source = new Blob();
                    source.data = await Fs.android.Module.createThumbnail({ path: tempFile });
                }
                finally {
                    await Fs.deleteFile(tempFile);
                }
            }
        }
        else if (blob.type.startsWith('image/')) {
            source = blob.slice();
        }
        if (!source)
            return undefined;
        try {
            return await Fs.resizeImage(source, args);
        }
        finally {
            source.close();
        }
    }
    /**
     * share file to another app
     */
    static async shareFile(path, type) {
        if (Fs.ios.Module) {
            await Fs.ios.Module.showDocumentInteractionController({ path: path, type: 'openin' });
        }
        else if (Fs.android.Module) {
            await Fs.android.Module.sendIntentChooser({
                path: path,
                type: type || (await this.getMimeType(path)) || 'application/octet-stream'
            });
        }
        else {
            throw new Error('platform not supported');
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
        else {
            throw new Error('platform not supported');
        }
    }
    /**
     * show a file open dialog
     */
    static async pickFile(args) {
        if (Fs.ios.Module) {
            const utis = args.types ? (await Promise.all(args.types.map((i) => Fs.ios.Module.getUtiForMimeType(i)))) : (['public.item']);
            const res = await Fs.ios.Module.showDocumentPickerView({ utis: utis, multiple: args.multiple });
            return res || [];
        }
        else if (Fs.android.Module) {
            const res = await Fs.android.Module.getContent({ types: args.types, multiple: args.multiple });
            return res || [];
        }
        else {
            throw new Error('platform not supported');
        }
    }
    /**
     * show a image / video open dialog
     * the result must be released by calling res.release()
     */
    static async pickMedia(args) {
        const type = args.type || 'all';
        if (Fs.ios.Module) {
            const res = await Fs.ios.Module.showImagePickerController({
                // allowsEditing: true,
                mediaTypes: [
                    ...((type === 'all' || type === 'image') && ['public.image'] || []),
                    ...((type === 'all' || type === 'video') && ['public.movie'] || []),
                ],
            });
            if (res === undefined)
                return undefined;
            return {
                url: res.url,
                mimeType: res.type,
                release: () => {
                    if (res.tempPath) {
                        Fs.deleteFile(res.tempPath).catch(() => { });
                    }
                },
            };
        }
        else if (Fs.android.Module) {
            const res = await Fs.android.Module.getContent({
                pick: true,
                types: [
                    ...((type === 'all' || type === 'image') && ['image/*'] || []),
                    ...((type === 'all' || type === 'video') && ['video/*'] || []),
                ],
            });
            if (res === undefined || res === null)
                return undefined;
            if (res.length === 0)
                return undefined;
            return {
                url: res[0],
                mimeType: await this.getMimeType(res[0]) || '', // @TODO hmmm?
                release: () => {
                },
            };
        }
        else {
            throw new Error('platform not supported');
        }
    }
    /**
     * capture a photo or video
     * the result must be released by calling res.release()
     */
    static async captureMedia(args) {
        const type = args.type || 'all';
        if (Fs.ios.Module) {
            const res = await Fs.ios.Module.showImagePickerController({
                // allowsEditing: true, // ?
                sourceType: ios.ImagePickerControllerSourceType.Camera,
                mediaTypes: [
                    ...((type === 'all' || type === 'image') && ['public.image'] || []),
                    ...((type === 'all' || type === 'video') && ['public.movie'] || []),
                ],
            });
            if (res === undefined)
                return undefined;
            return {
                url: res.url,
                mimeType: res.type,
                release: () => {
                    if (res.tempPath) {
                        Fs.deleteFile(res.tempPath).catch(() => { });
                    }
                },
            };
        }
        else if (Fs.android.Module) {
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
            if (res === undefined || res === null)
                return undefined;
            return {
                url: res.uri,
                mimeType: res.type,
                release: () => {
                    if (res.tempPath) {
                        Fs.deleteFile(res.tempPath).catch(() => { });
                    }
                },
            };
        }
        else {
            throw new Error('platform not supported');
        }
    }
}
//# sourceMappingURL=index.js.map