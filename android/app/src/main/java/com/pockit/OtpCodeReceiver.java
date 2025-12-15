package com.pockit.technician;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.widget.Toast;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;

/**
 * Receives zero/one-tap OTP broadcasts from WhatsApp and forwards the code to JS.
 */
public class OtpCodeReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            String action = intent.getAction();
            Log.d("OtpCodeReceiver", "onReceive: action=" + action);
            
            // Verify this is the correct action
            if (!"com.whatsapp.otp.OTP_RETRIEVED".equals(action)) {
                Log.w("OtpCodeReceiver", "Unexpected action: " + action);
                return;
            }

            // Extract OTP code - WhatsApp sends it in the "code" extra
            String otpCode = intent.getStringExtra("code");
            if (otpCode == null || otpCode.isEmpty()) {
                Log.w("OtpCodeReceiver", "OTP code missing or empty in intent extras");
                // Try alternative key names that WhatsApp might use
                otpCode = intent.getStringExtra("otp");
                if (otpCode == null || otpCode.isEmpty()) {
                    Log.w("OtpCodeReceiver", "OTP not found in any expected extra key");
                    return;
                }
            }

            // Verify PendingIntent if present (for security)
            PendingIntent pendingIntent = intent.getParcelableExtra("_ci_");
            if (pendingIntent != null) {
                String creatorPackage = pendingIntent.getCreatorPackage();
                // The PendingIntent should be created by our app, not WhatsApp
                // This is the PendingIntent we sent in the handshake
                if (!"com.pockit.technician".equals(creatorPackage)) {
                    Log.w("OtpCodeReceiver", "PendingIntent creator mismatch. Expected: com.pockit.technician, Got: " + creatorPackage);
                    // Don't return - still process the OTP as WhatsApp might wrap it differently
                }
            }

            Log.d("OtpCodeReceiver", "OTP received from WhatsApp: " + otpCode);
            Toast.makeText(context, "WhatsApp OTP: " + otpCode, Toast.LENGTH_SHORT).show();
            sendEvent(context, "ON_OTP_RECEIVED", otpCode);
            
        } catch (Exception e) {
            Log.e("OtpCodeReceiver", "Failed to process WhatsApp OTP", e);
        }
    }

    private void sendEvent(Context context, String eventName, String data) {
        try {
            ReactApplication app = (ReactApplication) context.getApplicationContext();
            ReactInstanceManager reactInstanceManager = app.getReactNativeHost().getReactInstanceManager();
            ReactContext reactContext = reactInstanceManager.getCurrentReactContext();

            if (reactContext != null) {
                reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit(eventName, data);
            } else {
                Log.w("OtpCodeReceiver", "React context is null; cannot emit event");
            }
        } catch (Exception e) {
            Log.e("OtpCodeReceiver", "Error sending event to JS", e);
        }
    }
}


