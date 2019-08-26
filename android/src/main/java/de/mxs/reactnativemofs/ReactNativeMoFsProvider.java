package de.mxs.reactnativemofs;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.os.ParcelFileDescriptor;
import android.util.Log;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.blob.BlobModule;

import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;

import javax.annotation.Nonnull;

public final class ReactNativeMoFsProvider extends ContentProvider {

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
        Log.i("XXX", "getType uri=" + uri);
        // vnd.android.cursor.item ?
//        return "image/jpeg";
        return null;
    }

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
    public ParcelFileDescriptor openFile(@Nonnull Uri uri, String mode) throws FileNotFoundException {
        Log.i("XXX", "openFile uri=" + uri + " mode=" + mode);

        if (!mode.equals("r")) {
            throw new FileNotFoundException("Cannot open " + uri.toString() + " in mode '" + mode + "'");
        }

        BlobModule blobModule = getReactContext().getNativeModule(BlobModule.class);
        if (blobModule == null) {
            throw new RuntimeException("No blob module associated with BlobProvider");
        }

        final byte[] data = blobModule.resolve(uri);
        if (data == null) {
            throw new FileNotFoundException("Cannot open " + uri.toString() + ", blob not found.");
        }

        Log.i("XXX", "data=" + data.length);

        return this.openPipeHelper(uri, "image/jpeg", null, data, new PipeDataWriter<byte[]>() {
            @Override
            public void writeDataToPipe(@Nonnull ParcelFileDescriptor output, @Nonnull Uri uri, @Nonnull String mimeType, Bundle opts, byte[] args) {
                try {
                    FileOutputStream fos = new FileOutputStream(output.getFileDescriptor());
                    fos.write(args);
                    fos.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        });

//        try {
//            ParcelFileDescriptor[] pfds = ParcelFileDescriptor.createPipe();
//            final OutputStream outputStream = new ParcelFileDescriptor.AutoCloseOutputStream(pfds[1]);
//            AsyncTask.THREAD_POOL_EXECUTOR.execute(new Runnable() {
//                @Override
//                public void run() {
//                    Log.i("XXX", "before write");
//                    try {
//                        outputStream.write(data);
//                        outputStream.close();
//                    } catch (IOException e) {
//                        e.printStackTrace();
//                    }
//                    Log.i("XXX", "after write");
//                }
//            });
//            return pfds[0];
//        } catch (IOException e) {
//            throw new RuntimeException(e);
//        }

//        ParcelFileDescriptor[] pipe;
//        try {
//            pipe = ParcelFileDescriptor.createPipe();
//        } catch (IOException exception) {
//            return null;
//        }
//        ParcelFileDescriptor readSide = pipe[0];
//        ParcelFileDescriptor writeSide = pipe[1];
//
//        OutputStream outputStream = new ParcelFileDescriptor.AutoCloseOutputStream(writeSide);
//        try {
//            outputStream.write(data);
//            outputStream.close();
//        } catch (IOException exception) {
//            return null;
//        }
//
//        return readSide;
    }

}
