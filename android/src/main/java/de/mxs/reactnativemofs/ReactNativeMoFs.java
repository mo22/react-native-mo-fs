package de.mxs.reactnativemofs;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;

import androidx.core.content.FileProvider;
import androidx.exifinterface.media.ExifInterface;

import android.net.Uri;
import android.os.Build;
import android.util.Base64;
import android.util.Log;
import android.webkit.MimeTypeMap;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.blob.BlobModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nonnull;

public final class ReactNativeMoFs extends ReactContextBaseJavaModule {

    ReactNativeMoFs(@Nonnull ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(new ActivityEventListener() {
            @Override
            public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
                Log.i("XXX", "onActivityResult " + requestCode + " " + resultCode + " " + data);
            }
            @Override
            public void onNewIntent(Intent intent) {
                Log.i("XXX", "onNewIntent " + intent);
                Log.i("XXX", "action=" + intent.getAction());
                Log.i("XXX", "data=" + intent.getData());
                Log.i("XXX", "type=" + intent.getType());
                Log.i("XXX", "dataString=" + intent.getDataString());
                Log.i("XXX", "extras=" + Arrays.asList(intent.getExtras().keySet().toArray()));
//                Uri uri = (Uri)intent.getExtras().get(Intent.EXTRA_STREAM);
//                Log.i("XXX", "uri=" + uri);
                WritableMap args = Arguments.createMap();
                args.putString("action", intent.getAction());
                args.putString("type", intent.getType());
                if (intent.getData() != null) {
                    args.putString("url", intent.getData().toString());
                }
                if (intent.getExtras().containsKey(Intent.EXTRA_STREAM)) {
                    Uri uri = (Uri)intent.getExtras().get(Intent.EXTRA_STREAM);
                    if (uri != null) {
                        args.putString("url", uri.toString());
                    }
                }
                getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("ReactNativeMoFsLink", args);
                // action=android.intent.action.SEND
                // data=null
                // dataString=null
                // extras=[referrer.code, android.intent.extra.SUBJECT, referrer.string, android.intent.extra.STREAM, android.intent.extra.TITLE]
                // uri=content://com.android.providers.downloads.documents/document/695
            }
        });
    }

    @Override
    public @Nonnull
    String getName() {
        return "ReactNativeMoFs";
    }

    @Override
    public Map<String, Object> getConstants() {
        HashMap<String, Object> res = new HashMap<>();
        res.put("authorities", getReactApplicationContext().getPackageName() + ".ReactNativeMoFs");
        HashMap<String, String> paths = new HashMap<>();
        if (getReactApplicationContext().getExternalCacheDir() != null) {
            paths.put("externalCache", getReactApplicationContext().getExternalCacheDir().getAbsolutePath());
        }
        paths.put("files", getReactApplicationContext().getFilesDir().getAbsolutePath());
        paths.put("packageResource", getReactApplicationContext().getPackageResourcePath());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            paths.put("data", getReactApplicationContext().getDataDir().getAbsolutePath());
        }
        res.put("paths", paths);
        return res;
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void getMimeType(String extension, Promise promise) {
        promise.resolve(MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension));
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void readBlob(ReadableMap blob, String mode, Promise promise) {
        BlobModule blobModule = getReactApplicationContext().getNativeModule(BlobModule.class);
        byte[] data = blobModule.resolve(blob);
        if (data == null) {
            promise.reject(new Error("blob not found"));
            return;
        }
        if (mode.equals("base64")) {
            promise.resolve(Base64.encodeToString(data, 0));
        } else if (mode.equals("utf8")) {
            promise.resolve(new String(data));
        } else {
            promise.reject(new Error("unknown mode"));
        }
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void createBlob(String str, String mode, Promise promise) {
        BlobModule blobModule = getReactApplicationContext().getNativeModule(BlobModule.class);
        byte[] buffer;
        if (mode.equals("base64")) {
            buffer = Base64.decode(str, 0);
        } else if (mode.equals("utf8")) {
            buffer = str.getBytes();
        } else {
            promise.reject(new Error("unknown mode"));
            return;
        }
        String blobId = blobModule.store(buffer);
        WritableMap blob = Arguments.createMap();
        blob.putInt("size", buffer.length);
        blob.putInt("offset", 0);
        blob.putString("blobId", blobId);
        promise.resolve(blob);
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void readFile(String path, Promise promise) {
        BlobModule blobModule = getReactApplicationContext().getNativeModule(BlobModule.class);
        try {
            File file = new File(path);
            long length = file.length();
            byte[] buffer = new byte[(int) length];
            FileInputStream fis = new FileInputStream(file);
            int res = fis.read(buffer);
            if (res != buffer.length) throw new IOException("incomplete read");
            fis.close();
            String blobId = blobModule.store(buffer);
            WritableMap blob = Arguments.createMap();
            blob.putInt("size", buffer.length);
            blob.putInt("offset", 0);
            blob.putString("blobId", blobId);
            blob.putString("type", "application/octet-string");
            blob.putString("name", path); // only last?
            promise.resolve(blob);
        } catch (IOException e) {
            e.printStackTrace();
            promise.reject(e);
        }
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void writeFile(String path, ReadableMap blob, Promise promise) {
        BlobModule blobModule = getReactApplicationContext().getNativeModule(BlobModule.class);
        byte[] data = blobModule.resolve(blob);
        if (data == null) {
            promise.reject(new Error("blob not found"));
            return;
        }
        try {
            File file = new File(path);
            FileOutputStream fos = new FileOutputStream(file);
            fos.write(data);
            fos.close();
            promise.resolve(null);
        } catch (IOException e) {
            e.printStackTrace();
            promise.reject(e);
        }
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void appendFile(String path, ReadableMap blob, Promise promise) {
        BlobModule blobModule = getReactApplicationContext().getNativeModule(BlobModule.class);
        byte[] data = blobModule.resolve(blob);
        if (data == null) {
            promise.reject(new Error("blob not found"));
            return;
        }
        try {
            File file = new File(path);
            FileOutputStream fos = new FileOutputStream(file, true);
            fos.write(data);
            fos.close();
            promise.resolve(null);
        } catch (IOException e) {
            e.printStackTrace();
            promise.reject(e);
        }
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void deleteFile(String path, Promise promise) {
        try {
            File file = new File(path);
            if (!file.delete()) {
                throw new IOException("cannot delete");
            }
            promise.resolve(null);
        } catch (IOException e) {
            promise.reject(e);
        }
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void renameFile(String fromPath, String toPath, Promise promise) {
        try {
            File file = new File(fromPath);
            if (!file.renameTo(new File(toPath))) {
                throw new IOException("cannot rename");
            }
            promise.resolve(null);
        } catch (IOException e) {
            promise.reject(e);
        }
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void listDir(String path, Promise promise) {
        try {
            File file = new File(path);
            WritableArray res = Arguments.createArray();
            String[] fileList = file.list();
            if (fileList == null) {
                throw new IOException("cannot read dir");
            }
            for (String i : fileList) {
                res.pushString(i);
            }
            promise.resolve(res);
        } catch (IOException e) {
            promise.reject(e);
        }
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void createDir(String path, Promise promise) {
        try {
            File file = new File(path);
            if (!file.mkdirs()) {
                throw new IOException("cannot mkdirs");
            }
            promise.resolve(null);
        } catch (IOException e) {
            promise.reject(e);
        }
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void stat(String path, Promise promise) {
        try {
            File file = new File(path);
            WritableMap res = Arguments.createMap();
            if (file.isFile()) {
                res.putString("type", "file");
                res.putInt("length", (int)file.length());
                res.putDouble("lastModified", file.lastModified());
            } else if (file.isDirectory()) {
                res.putString("type", "directory");
                res.putDouble("lastModified", file.lastModified());
            }
            promise.resolve(res);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void getBlobInfo(ReadableMap blob, ReadableMap args, Promise promise) {
        try {
            BlobModule blobModule = getReactApplicationContext().getNativeModule(BlobModule.class);
            byte[] data = blobModule.resolve(blob);
            if (data == null) {
                promise.reject(new Error("blob not found"));
                return;
            }
            WritableMap res = Arguments.createMap();
            res.putInt("size", data.length);
            if (args.hasKey("md5") && args.getBoolean("md5")) {
                MessageDigest digest = MessageDigest.getInstance("MD5");
                digest.reset();
                byte[] tmp = digest.digest(data);
                StringBuilder sb = new StringBuilder(tmp.length * 2);
                for (byte b : tmp) sb.append(String.format("%02x", b & 0xFF));
                res.putString("md5", sb.toString());
            }
            if (args.hasKey("sha1") && args.getBoolean("sha1")) {
                MessageDigest digest = MessageDigest.getInstance("SHA1");
                digest.reset();
                byte[] tmp = digest.digest(data);
                StringBuilder sb = new StringBuilder(tmp.length * 2);
                for (byte b : tmp) sb.append(String.format("%02x", b & 0xFF));
                res.putString("sha1", sb.toString());
            }
            if (args.hasKey("sha256") && args.getBoolean("sha256")) {
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                digest.reset();
                byte[] tmp = digest.digest(data);
                StringBuilder sb = new StringBuilder(tmp.length * 2);
                for (byte b : tmp) sb.append(String.format("%02x", b & 0xFF));
                res.putString("sha256", sb.toString());
            }
            if (args.hasKey("image") && args.getBoolean("image")) {
                Bitmap bmp = BitmapFactory.decodeByteArray(data, 0, data.length);
                if (bmp != null) {
                    WritableMap image = Arguments.createMap();
                    image.putDouble("width", bmp.getWidth());
                    image.putDouble("height", bmp.getHeight());
                    res.putMap("image", image);

                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                        ExifInterface exif = new ExifInterface(new ByteArrayInputStream(data));
                        Log.i("XXX", "got exif " + exif);
                        Log.i("XXX", "got orientation " + exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, -1));
                    }
                }
            }
            promise.resolve(res);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void updateImage(ReadableMap blob, ReadableMap args, Promise promise) {
        BlobModule blobModule = getReactApplicationContext().getNativeModule(BlobModule.class);
        byte[] data = blobModule.resolve(blob);
        if (data == null) {
            promise.reject(new Error("blob not found"));
            return;
        }
        Bitmap bmp = BitmapFactory.decodeByteArray(data, 0, data.length);
        int width = args.hasKey("width") ? args.getInt("width") : bmp.getWidth();
        int height = args.hasKey("height") ? args.getInt("height") : bmp.getHeight();
        Matrix m = new Matrix();
        if (args.hasKey("matrix")) {
            ReadableArray a = args.getArray("matrix");
            if (a != null) {
                float[] v = new float[9];
                for (int i=0; i<v.length; i++) {
                    v[i] = (float)a.getDouble(i);
                }
                m.setValues(v);
            }
        }
        Bitmap bmp2 = Bitmap.createBitmap(bmp, 0, 0, width, height, m, true);
        int quality = args.hasKey("quality") ? (int)(args.getDouble("quality") * 100) : 100;
        Bitmap.CompressFormat format = Bitmap.CompressFormat.JPEG;
        if (args.hasKey("encoding") && "png".equals(args.getString("encoding"))) {
            format = Bitmap.CompressFormat.PNG;
        } else if (args.hasKey("encoding") && "webp".equals(args.getString("encoding"))) {
            format = Bitmap.CompressFormat.WEBP;
        }
        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        bmp2.compress(format, quality, stream);
        byte[] output = stream.toByteArray();
        String blobId = blobModule.store(output);
        WritableMap blob2 = Arguments.createMap();
        blob2.putInt("size", output.length);
        blob2.putInt("offset", 0);
        blob2.putString("blobId", blobId);
        blob2.putString("type", "image/jpeg");
        blob2.putString("name", blob.getString("name"));
        promise.resolve(blob2);
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void shareFile(String path, Promise promise) {
        Log.i("XXX", "shareFile " + path);

        Uri uri = FileProvider.getUriForFile(getReactApplicationContext(), getReactApplicationContext().getPackageName() + ".provider", new File(path));
//        String mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(

        Intent intent = new Intent();
        intent.setAction(Intent.ACTION_SEND);
        intent.setType("image/jpeg");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.putExtra(Intent.EXTRA_STREAM, uri);

        if (intent.resolveActivity(getReactApplicationContext().getPackageManager()) != null) {
            Log.i("XXX", "start handle?");
            getReactApplicationContext().getCurrentActivity().startActivity(
                Intent.createChooser(intent, "title")
            );
        } else {
            Log.i("XXX", "cannot handle?");
        }
        promise.resolve(null);
    }

}
