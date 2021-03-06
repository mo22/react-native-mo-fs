# react-native-mo-fs

Provide file system access and integration

## Installation

Install just like your ordinary react-native module.

## Usage

Please check the [example/](example/) code.

```ts
import { Fs } from 'react-native-mo-fs';

// for debugging:
Fs.setVerbose(true);
```

### Basic ideas

- `Fs.readFile` / `Fs.writeFile` all work with react-native's Blobs. These store
  the data on the native side and only pass a handle to javascript to avoid
  transferring lots of data using base64 encoding. As long as react-native does
  not support UInt8Array to NSData*/byte[] bridging this is the fastest solution.

- You can read out or create blobs using `Fs.readBlob` and `Fs.createBlob` using
  encodings like base64, utf8 or arraybuffers. If using arraybuffers the buffer
  has to be converted to base64 internally first.

- Most of the time you do not need the data on the javascript side. You can load
  a file to a blob and use that blob as payload data for `fetch()` or the other
  way around.

- There is some assorted stuff in the library for hashing, image manipulation and
  similar stuff. The base idea is to support only operations that do not require
  additional native libraries to not bloat this library.


### System Paths

```ts
console.log(Fs.paths);
// cache: Path; // a cache folder
// docs: Path; // the document folder
// bundle?: Path; // ios bundle folder
// document?: Path;
// caches?: Path;
// externalCache?: Path;
// files?: Path;
// packageResource?: Path;
// data?: Path;
```

### Working with files

#### Reading files

```ts
const myBlob = await Fs.readFile(Fs.paths.docs + '/hello.jpg');
const myText = await Fs.readTextFile(Fs.paths.docs + '/hello.txt');
```

#### Writing files

```ts
await Fs.writeFile(Fs.paths.docs + '/hello.jpg', myBlob);
await Fs.writeTextFile(Fs.paths.docs + '/dump.json', JSON.stringify(data));
await Fs.appendFile(Fs.paths.docs + '/hello.jpg', myBlob);
await Fs.appendTextFile(Fs.paths.docs + '/log.txt', 'my log line\n');
```

#### File handling

```ts
await Fs.deleteFile(someFilePath);
await Fs.deleteFile(someFolderPath, true); // delete recursive
await Fs.renameFile(oldPath, newPath);
await Fs.listDir(folderPath); // returns array of file names
await Fs.createDir(Fs.paths.docs + '/logs'); // does not create parents
const stat = await Fs.stat(Fs.path.docs + '/somefile.txt');
if (!stat.exists) {
  console.log('not found');
} else if (stat.dir) {
  console.log('is a dir');
} else {
  console.log('is a file with size', stat.size, 'modified', new Date(stat.modified));
}
```

### Working with Blobs

#### Get URL for Blob

```ts
const url = Fs.getBlobURL(myBlob);
return (<Image source={{ uri: url }} />);
```

#### Get contents of Blob

```ts
const base64_data = await Fs.readBlob(myBlob, 'base64');
const string = await Fs.readBlob(myBlob, 'utf8');
const arrayBuffer = await Fs.readBlob(myBlob, 'arraybuffer');
```

#### Create Blob from data

```ts
const myBlob = await Fs.createBlob('aGVsbG8gd29ybGQ=', 'base64');
const myBlob = await Fs.createBlob('hello world', 'utf8');
const myBlob = await Fs.createBlob(new Uint8Array([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]), 'arraybuffer');
```

### Sharing / picking files

#### Share / View file
```ts
// Share a file (open-in in ios, share intent in android)
await Fs.shareFile(Fs.paths.docs + '/myimage.png');

// View a file (preview in ios, view intent in android)
await Fs.viewFile(Fs.paths.docs + '/myimage.png');
```

#### Pick file
```ts
// pick any single file
const urls = await Fs.pickFile({ multiple: false })

// pick one or more jpeg or png images
const urls = await Fs.pickFile({ multiple: true, types: ['image/jpeg', 'image/png'] })

// read the response
if (urls.length > 0) {
  const blob = await Fs.readURL(urls[0]);
  // do something
}
```

#### Pick/capture image/video
```ts
const res = await Fs.pickMedia({ });
const res = await Fs.captureMedia({ });
if (res) {
  const blob = await Fs.readURL(res.url);
  res.release();
}
```

#### iTunes file sharing
Add this to your Info.plist:
```
<key>UIFileSharingEnabled</key>
<true/>
```
And write stuff to `Fs.paths.docs`

#### Handling "Open In"

Add to android manifest:
```
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  UPDATE THIS
  <data android:scheme="file" />
  <data android:host="*" />
  <data android:pathPattern=".*\\.pdf" />
  <data android:mimeType="application/pdf" />
</intent-filter>
```

Add to ios Info.plist:
```
<key>CFBundleDocumentTypes</key>
<array>
  <dict>
    <key>CFBundleTypeName</key>
    <string>PDF</string>
    <key>LSHandlerRank</key>
    <string>Alternate</string>
    <key>LSItemContentTypes</key>
    <array>
        <string>com.adobe.pdf</string>
    </array>
  </dict>
</array>
```

Subscribe to the Event:
```ts
Fs.openFile.subscribe((event) => {
  console.log('requested to open url', event.url);
});
```

If the app was started initially due to an open event, the event handler is
called as soon as the first subscriber is there.

### Assorted stuff

#### Mime Types and EXIF
```ts
const mimeType = await Fs.getMimeType('png');
const mimeType = await Fs.getMimeType('blah.png');

// exif is not really done yet but might work for you ;)
const exif = await Fs.getExif(myBlob);

const extension = await Fs.getExtensionForMimeType('image/png'); // returns png
```

#### Blob hash

```ts
console.log('md5-hex', await Fs.getBlobHash(myBlob, 'md5'));
console.log('sha1-hex', await Fs.getBlobHash(myBlob, 'sha1'));
console.log('sha256-hex', await Fs.getBlobHash(myBlob, 'sha256'));
```

#### Images
```ts
const myImageBlob = await Fs.readFile(Fs.paths.docs + '/image.jpg');

const size = await Fs.getImageSize(myImageBlob);
console.log('the image size is', size.width, size.height);

const smallBlob = await Fs.resizeImage(myImageBlob, {
  maxWidth: 128,
  maxHeight: 128,
  fill: true, // make result 128x128 and keep aspect. otherwise result image is smaller
  encoding: 'jpeg', // or png, or webp
  quality: 0.3, // 0..1
});

const thumbnail = await Fs.createThumbnail(imageOrVideoBlob, {
  maxWidth: 128,
  maxHeight: 128,
  fill: true,
});

```

## Backups

For android you need to specify the files to be backed up in your manifest:
```
<application
  android:fullBackupContent="@xml/backup_descriptor"
  android:restoreAnyVersion="true"
/>
```
Set restoreAnyVersion only if you are able to migrate from an older backup.

The contents of res/xml/backup_descriptor is something like:
```
<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
  <!-- for asyncstorage -->
  <include domain="database" path="RKStorage" />
  <!-- some path relative to data dir -->
  <include domain="root" path="some/path" />
</full-backup-content>
```

You can test backups using:
`adb shell bmgr backupnow your.package`

Dev builds should be restored after uninstalling and redeploying from android studio.

For iOS pretty much everything is backed up unless excluded.

You can use (experimental):
```
Fs.ios.Module.setResourceValues('file:///path/to/file', {
  'NSURLIsExcludedFromBackupKey': true,
});
```

You can use app offloading to test backup / restore in dev.


## Notes
- iOS application:openURL: is swizzled on startup.
