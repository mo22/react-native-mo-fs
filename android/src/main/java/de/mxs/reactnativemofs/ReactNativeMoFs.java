package de.mxs.reactnativemofs;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Matrix;

import androidx.core.content.FileProvider;
import androidx.exifinterface.media.ExifInterface;

import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.AtomicFile;
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
import java.io.RandomAccessFile;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

import javax.annotation.Nonnull;
import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public final class ReactNativeMoFs extends ReactContextBaseJavaModule {

    private boolean verbose = false;

    ReactNativeMoFs(@Nonnull ReactApplicationContext reactContext) {
        super(reactContext);

        reactContext.addActivityEventListener(new ActivityEventListener() {
            @Override
            public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
            }
            @Override
            public void onNewIntent(Intent intent) {
                if (verbose) Log.i("ReactNativeMoFs", "onNewIntent " + intent);
                getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(
                    "ReactNativeMoFsNewIntent",
                    getMapFromIntent(intent)
                );
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

    @SuppressWarnings("unused")
    @ReactMethod
    public void setVerbose(boolean verbose) {
        this.verbose = verbose;
    }

    private boolean deleteRecursive(File fileOrDirectory) {
        if (fileOrDirectory.isDirectory()) {
            boolean res = true;
            for (File child : fileOrDirectory.listFiles()) {
                res = res && deleteRecursive(child);
            }
            return res;
        } else {
            return fileOrDirectory.delete();
        }
    }

    private String getHexFromBytes(byte[] data) {
        StringBuilder sb = new StringBuilder(data.length * 2);
        for (byte b : data) sb.append(String.format("%02x", b & 0xFF));
        return sb.toString();
    }

    private WritableMap getMapFromIntent(Intent intent) {
        WritableMap res = Arguments.createMap();
        res.putString("action", intent.getAction());
        res.putString("type", intent.getType());
        if (intent.getData() != null) res.putString("data", intent.getData().toString());
        Bundle extras = intent.getExtras();
        if (extras != null) {
            WritableMap resExtras = Arguments.createMap();
            for (String key : extras.keySet()) {
                Object val = extras.get(key);
                if (val instanceof String) {
                    resExtras.putString(key, (String)val);
                } else if (val instanceof Uri) {
                    resExtras.putString(key, val.toString());
                } else if (val instanceof Number) {
                    resExtras.putDouble(key, ((Number)val).doubleValue());
                } else if (val instanceof Boolean) {
                    resExtras.putBoolean(key, (Boolean)val);
                } else if (val == null) {
                    resExtras.putNull(key);
                }
            }
            res.putMap("extras", resExtras);
        }
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
    public void getInitialIntent(final Promise promise) {
        final LifecycleEventListener lifecycleEventListener = new LifecycleEventListener() {
            @Override
            public void onHostResume() {
                getReactApplicationContext().removeLifecycleEventListener(this);
                Activity activity = getReactApplicationContext().getCurrentActivity();
                if (activity != null) {
                    Intent intent = activity.getIntent();
                    promise.resolve(getMapFromIntent(intent));
                } else {
                    promise.resolve(null);
                }
            }
            @Override
            public void onHostPause() {
            }
            @Override
            public void onHostDestroy() {
            }
        };
        Activity activity = getReactApplicationContext().getCurrentActivity();
        if (activity != null) {
            lifecycleEventListener.onHostResume();
        } else {
            getReactApplicationContext().addLifecycleEventListener(lifecycleEventListener);
        }
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
        if (verbose) Log.i("ReactNativeMoFs", "readBlob size=" + data.length);
        if (mode.equals("base64")) {
            promise.resolve(Base64.encodeToString(data, Base64.NO_WRAP));
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
        if (verbose) Log.i("ReactNativeMoFs", "createBlob size=" + buffer.length + " blobId=" + blobId);
        WritableMap blob = Arguments.createMap();
        blob.putInt("size", buffer.length);
        blob.putInt("offset", 0);
        blob.putString("blobId", blobId);
        promise.resolve(blob);
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void readFile(ReadableMap args, Promise promise) {
        BlobModule blobModule = getReactApplicationContext().getNativeModule(BlobModule.class);
        try {
            String path = args.getString("path");
            File file = new File(path);
            long fileSize = file.length();
            int size = args.hasKey("size") ? args.getInt("size") : (int)fileSize;
            long offset = args.hasKey("offset") ? args.getInt("offset") : 0;
            if (offset < 0) offset = fileSize + offset + 1;
            byte[] buffer = new byte[size];
            FileInputStream fis = new FileInputStream(file);
            if (fis.skip(offset) != offset) throw new IOException("seek failed");
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
    public void writeFile(ReadableMap args, Promise promise) {
        try {
            String path = args.getString("path");
            BlobModule blobModule = getReactApplicationContext().getNativeModule(BlobModule.class);
            ReadableMap blob = Objects.requireNonNull(args.getMap("blob"));
            byte[] data = blobModule.resolve(blob);
            if (data == null) {
                promise.reject(new Error("blob not found"));
                return;
            }
            File file = new File(path);
            long fileSize = file.exists() ? file.length() : 0;
            long offset = args.hasKey("offset") ? args.getInt("offset") : 0;
            if (offset < 0) offset = fileSize + offset + 1;
            boolean truncate = args.hasKey("truncate") && args.getBoolean("truncate");
            if (offset == 0 && truncate && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.JELLY_BEAN_MR1) {
                AtomicFile af = new AtomicFile(file);
                FileOutputStream fos = af.startWrite();
                fos.write(data);
                af.finishWrite(fos);
            } else {
                RandomAccessFile raf = new RandomAccessFile(file, "rw");
                raf.seek(offset);
                raf.write(data);
                if (truncate) {
                    raf.setLength(raf.getFilePointer());
                }
                raf.close();
            }
            promise.resolve(null);
        } catch (IOException e) {
            e.printStackTrace();
            promise.reject(e);
        }
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void deleteFile(String path, boolean recursive, Promise promise) {
        try {
            File file = new File(path);
            if (recursive) {
                if (!deleteRecursive(file)) {
                    throw new IOException("cannot delete");
                }
            } else {
                if (!file.delete()) {
                    throw new IOException("cannot delete");
                }
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
    public void chmod(String path, int mode, Promise promise) {
        try {
            File file = new File(path);
            // executable: 1 = execute, 2 = write, 4 = read
            boolean executable = (mode & 73) > 0;
            boolean writable = (mode & 146) > 0;
            boolean readable = (mode & 292) > 0;
            boolean otherExecutable = (mode & 1) > 0;
            boolean otherWritable = (mode & 2) > 0;
            boolean otherReadable = (mode & 4) > 0;
            if (!file.setExecutable(executable, !otherExecutable)) throw new IOException("chmod failed");
            if (!file.setReadable(readable, !otherReadable)) throw new IOException("chmod failed");
            if (!file.setWritable(writable, !otherReadable)) throw new IOException("chmod failed");
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void getBlobHash(ReadableMap blob, String algorithm, Promise promise) {
        try {
            BlobModule blobModule = getReactApplicationContext().getNativeModule(BlobModule.class);
            byte[] data = blobModule.resolve(blob);
            if (data == null) {
                promise.reject(new Error("blob not found"));
                return;
            }
            if (verbose) Log.i("ReactNativeMoFs", "getBlobHash " + algorithm + " " + data.length);
            MessageDigest digest;
            switch (algorithm) {
                case "md5":
                    digest = MessageDigest.getInstance("MD5");
                    break;
                case "sha1":
                    digest = MessageDigest.getInstance("SHA1");
                    break;
                case "sha256":
                    digest = MessageDigest.getInstance("SHA-256");
                    break;
                case "sha512":
                    digest = MessageDigest.getInstance("SHA-512");
                    break;
                default:
                    throw new RuntimeException("invalid algorithm");
            }
            digest.reset();
            byte[] tmp = digest.digest(data);
            promise.resolve(getHexFromBytes(tmp));
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void getBlobHmac(ReadableMap blob, String algorithm, String key, Promise promise) {
        try {
            BlobModule blobModule = getReactApplicationContext().getNativeModule(BlobModule.class);
            byte[] data = blobModule.resolve(blob);
            if (data == null) {
                promise.reject(new Error("blob not found"));
                return;
            }
            byte[] keyData = Base64.decode(key, 0);
            if (verbose) Log.i("ReactNativeMoFs", "getBlobHash " + algorithm + " " + data.length);
            Mac mac;
            switch (algorithm) {
                case "sha1":
                    mac = Mac.getInstance("HmacSHA1");
                    break;
                case "sha256":
                    mac = Mac.getInstance("HmacSHA256");
                    break;
                case "sha512":
                    mac = Mac.getInstance("HmacSHA512");
                    break;
                default:
                    throw new RuntimeException("invalid algorithm");
            }
            mac.init(new SecretKeySpec(keyData, mac.getAlgorithm()));
            mac.reset();
            mac.update(data);
            byte[] tmp = mac.doFinal();
            promise.resolve(getHexFromBytes(tmp));
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void cryptBlob(ReadableMap blob, String algorithm, boolean encrypt, String key, String iv, Promise promise) {
        try {
            BlobModule blobModule = getReactApplicationContext().getNativeModule(BlobModule.class);
            byte[] data = blobModule.resolve(blob);
            if (data == null) {
                promise.reject(new Error("blob not found"));
                return;
            }
            byte[] keyData = Base64.decode(key, 0);
            byte[] ivData = Base64.decode(iv, 0);
            Cipher cipher;
            if ("aes-cbc".equals(algorithm)) {
                cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
                cipher.init(
                    encrypt ? Cipher.ENCRYPT_MODE : Cipher.DECRYPT_MODE,
                    new SecretKeySpec(keyData, cipher.getAlgorithm()),
                    new IvParameterSpec(ivData)
                );
            } else {
                throw new RuntimeException("invalid algorithm");
            }
            byte[] res = cipher.doFinal(data);
            String blobId = blobModule.store(res);
            WritableMap resBlob = Arguments.createMap();
            resBlob.putInt("size", res.length);
            resBlob.putInt("offset", 0);
            resBlob.putString("blobId", blobId);
            promise.resolve(resBlob);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @SuppressWarnings("unused")
    @ReactMethod
    public void getImageSize(ReadableMap blob, Promise promise) {
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
    public void getExif(ReadableMap blob, Promise promise) {
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
        // this has problems if the image is made larger.
        // Bitmap bmp2 = Bitmap.createBitmap(bmp, 0, 0, width, height, m, true);
        Bitmap bmp2 = Bitmap.createBitmap(width, height, bmp.getConfig());
        Canvas canvas = new Canvas(bmp2);
        canvas.drawBitmap(bmp, m, null);

        int quality = args.hasKey("quality") ? (int)(args.getDouble("quality") * 100) : 100;
        Bitmap.CompressFormat format;
        String mimeType;
        if (args.hasKey("encoding") && "png".equals(args.getString("encoding"))) {
            format = Bitmap.CompressFormat.PNG;
            mimeType = "image/png";
        } else if (args.hasKey("encoding") && "webp".equals(args.getString("encoding"))) {
            format = Bitmap.CompressFormat.WEBP;
            mimeType = "image/webp";
        } else {
            format = Bitmap.CompressFormat.JPEG;
            mimeType = "image/jpeg";
        }
        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        bmp2.compress(format, quality, stream);
        byte[] output = stream.toByteArray();
        String blobId = blobModule.store(output);
        WritableMap blob2 = Arguments.createMap();
        blob2.putInt("size", output.length);
        blob2.putInt("offset", 0);
        blob2.putString("blobId", blobId);
        blob2.putString("type", mimeType);
        if (blob.hasKey("name")) {
            blob2.putString("name", blob.getString("name"));
        }
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
        if (args.hasKey("type")) {
            intent.setDataAndType(uri, args.getString("type"));
        } else {
            intent.setData(uri);
        }
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
        Intent intent = new Intent();
        if (args.hasKey("pick") && args.getBoolean("pick")) {
            intent.setAction(Intent.ACTION_PICK);
        } else {
            intent.setAction(Intent.ACTION_GET_CONTENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
        }
        ArrayList<String> types = new ArrayList<>();
        if (args.hasKey("types")) {
            ReadableArray tmp = args.getArray("types");
            if (tmp == null) throw new RuntimeException("types == null");
            for (int i=0; i<tmp.size(); i++) {
                types.add(tmp.getString(i));
            }
        }
        if (types.size() == 0) {
            intent.setType("*/*");
        } else if (types.size() == 1) {
            intent.setType(types.get(0));
        } else {
            intent.setType(TextUtils.join("|", types));
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                intent.putExtra(Intent.EXTRA_MIME_TYPES, types.toArray());
            }
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR2) {
            if (args.hasKey("multiple") && args.getBoolean("multiple")) {
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
            }
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.KITKAT) {
            String title = args.hasKey("title") ? args.getString("title") : "";
            intent = Intent.createChooser(intent, title);
        }
        ActivityEventListener listener = new ActivityEventListener() {
            @Override
            public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
                if (requestCode == 13131) {
                    if (data == null) {
                        promise.resolve(null);
                    } else {
                        if (data.getClipData() != null) {
                            WritableArray res = Arguments.createArray();
                            for (int i=0; i<data.getClipData().getItemCount(); i++) {
                                Uri uri = data.getClipData().getItemAt(i).getUri();
                                if (uri != null) {
                                    res.pushString(uri.toString());
                                }
                            }
                            promise.resolve(res);
                        } else if (data.getData() != null) {
                            WritableArray res = Arguments.createArray();
                            res.pushString(data.getData().toString());
                            promise.resolve(res);
                        } else {
                            promise.resolve(null);
                        }
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
