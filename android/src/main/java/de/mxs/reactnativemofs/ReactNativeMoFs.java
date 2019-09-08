package de.mxs.reactnativemofs;

import android.app.Activity;
import android.content.ComponentName;
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
import com.facebook.react.bridge.LifecycleEventListener;
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
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nonnull;

public final class ReactNativeMoFs extends ReactContextBaseJavaModule {

    ReactNativeMoFs(@Nonnull ReactApplicationContext reactContext) {
        super(reactContext);

        reactContext.addLifecycleEventListener(new LifecycleEventListener() {
            @Override
            public void onHostResume() {
                Activity activity = getReactApplicationContext().getCurrentActivity();
                if (activity != null) {
                    Intent intent = activity.getIntent();
                    Log.i("XXX", "initial activity intent " + intent);
                    // @TODO: this one is correct.
                }
            }
            @Override
            public void onHostPause() {
            }
            @Override
            public void onHostDestroy() {
            }
        });

        reactContext.addActivityEventListener(new ActivityEventListener() {
            @Override
            public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
                Log.i("XXX", "onActivityResult");
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
                Log.i("XXX", "send ReactNativeMoFsLink event");
                getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("ReactNativeMoFsLink", args);
//                09-07 17:20:55.501 26251 26302 I ReactNativeJS: 'XXX ReactNativeMoFsLink', { url: 'content://com.android.providers.downloads.documents/document/695',
//                09-07 17:20:55.501 26251 26302 I ReactNativeJS:   type: 'application/pdf',
//                09-07 17:20:55.501 26251 26302 I ReactNativeJS:   action: 'android.intent.action.SEND' }
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
        res.put("authorities", getProviderAuthority());
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

    private String getMimeTypePath(String path) {
        String[] tmp = path.split("\\.");
        return MimeTypeMap.getSingleton().getMimeTypeFromExtension(tmp[tmp.length - 1]);
    }

    private String getProviderAuthority() {
        return getReactApplicationContext().getPackageName() + ".ReactNativeMoFs";
    }

    private Uri getUriForPath(String path) {
        return FileProvider.getUriForFile(
            getReactApplicationContext(),
            getProviderAuthority(),
            new File(path)
        );
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void getMimeType(String extension, Promise promise) {
        promise.resolve(getMimeTypePath(extension));
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
            promise.resolve(res);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void getImageSize(ReadableMap blob, ReadableMap args, Promise promise) {
        try {
            BlobModule blobModule = getReactApplicationContext().getNativeModule(BlobModule.class);
            byte[] data = blobModule.resolve(blob);
            if (data == null) {
                promise.reject(new Error("blob not found"));
                return;
            }
            Bitmap bmp = BitmapFactory.decodeByteArray(data, 0, data.length);
            if (bmp == null) {
                promise.reject(new Error("blob not an image"));
                return;
            }
            WritableMap res = Arguments.createMap();
            res.putDouble("width", bmp.getWidth());
            res.putDouble("height", bmp.getHeight());
            promise.resolve(res);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void getExif(ReadableMap blob, ReadableMap args, Promise promise) {
        try {
            BlobModule blobModule = getReactApplicationContext().getNativeModule(BlobModule.class);
            byte[] data = blobModule.resolve(blob);
            if (data == null) {
                promise.reject(new Error("blob not found"));
                return;
            }
            WritableMap res = Arguments.createMap();
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                ExifInterface exif = new ExifInterface(new ByteArrayInputStream(data));
                for (Field field : ExifInterface.class.getDeclaredFields()) {
                    if (!Modifier.isStatic(field.getModifiers())) continue;
                    if (!Modifier.isPublic(field.getModifiers())) continue;
                    if (!field.getName().startsWith("TAG_")) continue;
                    try {
                        String tag = (String)field.get(exif);
                        String value = exif.getAttribute(tag);
                        if (value != null) {
                            res.putString(field.getName(), value);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
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
    public void getProviderUri(String path, Promise promise) {
        promise.resolve(getUriForPath(path).toString());
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void sendIntentChooser(ReadableMap args, Promise promise) {
        String path = args.getString("path");
        if (path == null) throw new RuntimeException("path == null");
        String type = args.hasKey("type") ? args.getString("type") : null;
        if (type == null) type = getMimeTypePath(path);
        Uri uri = getUriForPath(path);
        Intent intent = new Intent();
        intent.setAction(Intent.ACTION_SEND);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.setType(type);
        intent.putExtra(Intent.EXTRA_STREAM, uri);
        if (args.hasKey("subject")) intent.putExtra(Intent.EXTRA_SUBJECT, args.getString("subject"));
        if (args.hasKey("text")) intent.putExtra(Intent.EXTRA_TEXT, args.getString("text"));
        ComponentName target = intent.resolveActivity(getReactApplicationContext().getPackageManager());
        if (target != null) {
            getReactApplicationContext().grantUriPermission(target.getPackageName(), uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Activity activity = getReactApplicationContext().getCurrentActivity();
            if (activity == null) throw new RuntimeException("activity == null");
            String title = args.hasKey("title") ? args.getString("title") : "";
            activity.startActivity(Intent.createChooser(intent, title));
            promise.resolve(null);
        } else {
            promise.reject(new Exception("cannot handle file type"));
        }
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void viewIntentChooser(ReadableMap args, Promise promise) {
        Uri uri;
        if (args.hasKey("path")) {
            String path = args.getString("path");
            uri = getUriForPath(path);
        } else {
            uri = Uri.parse(args.getString("url"));
        }
        Intent intent = new Intent();
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setData(uri);
//        intent.setDataAndType(uri, args.getString("type"));
        if (intent.resolveActivity(getReactApplicationContext().getPackageManager()) != null) {
            Activity activity = getReactApplicationContext().getCurrentActivity();
            if (activity == null) throw new RuntimeException("activity == null");
            String title = args.hasKey("title") ? args.getString("title") : "";
            activity.startActivity(Intent.createChooser(intent, title));
            promise.resolve(null);
        } else {
            promise.reject(new Exception("cannot handle file type"));
        }
    }


    @SuppressWarnings("unused")
    @ReactMethod
    public void getContent(ReadableMap args, final Promise promise) {
        //    getContent(args: { type?: string; }): Promise<void>;
        Intent intent = new Intent();
        intent.setAction(Intent.ACTION_GET_CONTENT); // Intent.ACTION_PICK
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        if (args.hasKey("type")) {
            intent.setType(args.getString("type"));
        } else {
            intent.setType("*/*");
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR2) {
            if (args.hasKey("multiple") && args.getBoolean("multiple")) {
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
            }
        }
//        intent.putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes);
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.KITKAT) {
            String title = args.hasKey("title") ? args.getString("title") : "";
            intent = Intent.createChooser(intent, title);
        }
        ActivityEventListener listener = new ActivityEventListener() {
            @Override
            public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
                if (requestCode == 13131) {
                    Log.i("XXX", "response " + requestCode + " " + resultCode + " " + data);
                    if (data == null) {
                        promise.resolve(null);
                    } else {
                        promise.resolve(data.getData().toString());
                    }
                }
            }
            @Override
            public void onNewIntent(Intent intent) {
            }
        };
        getReactApplicationContext().addActivityEventListener(listener);
        Activity activity = getReactApplicationContext().getCurrentActivity();
        if (activity == null) throw new RuntimeException("activity == null");
        activity.startActivityForResult(intent, 13131);
    }
}
