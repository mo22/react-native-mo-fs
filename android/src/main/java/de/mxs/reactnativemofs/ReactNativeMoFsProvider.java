package de.mxs.reactnativemofs;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.webkit.MimeTypeMap;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.blob.BlobModule;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;

import javax.annotation.Nonnull;

public final class ReactNativeMoFsProvider extends ContentProvider {

    private ReactContext getReactContext() {
        Context context = getContext();
        if (context == null) {
            throw new RuntimeException("getContext() null");
        }
        Context applicationContext = context.getApplicationContext();
        if (!(applicationContext instanceof ReactApplication)) {
            throw new RuntimeException("getApplicationContext() not ReactApplication");
        }
        ReactNativeHost host = ((ReactApplication) applicationContext).getReactNativeHost();
        ReactContext reactContext = host.getReactInstanceManager().getCurrentReactContext();
        if (reactContext == null) {
            throw new RuntimeException("reactContext null");
        }
        return reactContext;
    }

    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public Cursor query(@Nonnull Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
        return null;
    }

    @Override
    public Uri insert(@Nonnull Uri uri, ContentValues values) {
        return null;
    }

    @Override
    public int delete(@Nonnull Uri uri, String selection, String[] selectionArgs) {
        return 0;
    }

    @Override
    public int update(@Nonnull Uri uri, ContentValues values, String selection, String[] selectionArgs) {
        return 0;
    }

    @Override
    public String getType(@Nonnull Uri uri) {
        String path = uri.getPath();
        if (path == null) throw new RuntimeException("path == null");
        if (path.startsWith("/blob/")) {
            return uri.getQueryParameter("type");
        } else {
            String[] tmp = path.split("\\.");
            return MimeTypeMap.getSingleton().getMimeTypeFromExtension(tmp[tmp.length - 1]);
        }
    }

    @Override
    public ParcelFileDescriptor openFile(@Nonnull Uri uri, String mode) throws FileNotFoundException {
        if (!mode.equals("r")) {
            throw new FileNotFoundException("Cannot open " + uri.toString() + " in mode '" + mode + "'");
        }
        String path = uri.getPath();
        if (path == null) throw new RuntimeException("path == null");
        if (path.startsWith("/files/")) {
            File file = new File(getReactContext().getFilesDir(), path.substring("/files/".length()));
            if (!file.exists()) throw new FileNotFoundException("file " + file.getAbsolutePath() + " not found");
            return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);
        } else if (path.startsWith("/cache/")) {
            File file = new File(getReactContext().getCacheDir(), path.substring("/cache/".length()));
            if (!file.exists()) throw new FileNotFoundException("file " + file.getAbsolutePath() + " not found");
            return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);
        } else if (path.startsWith("/root/")) {
            File file = new File("/", path.substring("/root/".length()));
            if (!file.exists()) throw new FileNotFoundException("file " + file.getAbsolutePath() + " not found");
            return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);
        } else if (path.startsWith("/blob/")) {
            BlobModule blobModule = getReactContext().getNativeModule(BlobModule.class);
            if (blobModule == null) {
                throw new RuntimeException("No blob module associated with BlobProvider");
            }
            final byte[] data = blobModule.resolve(uri);
            if (data == null) {
                throw new FileNotFoundException("Cannot open " + uri.toString() + ", blob not found.");
            }
            return this.openPipeHelper(uri, "image/jpeg", null, data, (output, uri1, mimeType, opts, args) -> {
                try {
                    FileOutputStream fos = new FileOutputStream(output.getFileDescriptor());
                    fos.write(args);
                    fos.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            });

        } else {
            throw new FileNotFoundException("path " + path + " not found");
        }
    }

}
