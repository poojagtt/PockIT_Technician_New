package com.pockit.technician;

import android.content.Context;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.util.Base64;
import android.util.Log;
import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.security.MessageDigest;

public class HashModule extends ReactContextBaseJavaModule {
    public HashModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "HashModule";
    }

    @ReactMethod
    public void getAppHash(Promise promise) {
        try {
            String packageName = getReactApplicationContext().getPackageName();
            Signature[] sigs = getReactApplicationContext()
                    .getPackageManager()
                    .getPackageInfo(packageName, PackageManager.GET_SIGNING_CERTIFICATES)
                    .signingInfo
                    .getApkContentsSigners();

            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(sigs[0].toByteArray());
            String hash = Base64.encodeToString(md.digest(), Base64.NO_WRAP).substring(0, 11);

            promise.resolve(hash);
        } catch (Exception e) {
            promise.reject("HASH_ERROR", e);
        }
    }
}
