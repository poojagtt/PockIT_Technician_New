package com.pockit.technician

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.modules.core.DeviceEventManagerModule

class OtpReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val message = intent.getStringExtra("message") ?: return

        val otp = Regex("\\d{4,6}").find(message)?.value
        if (otp != null) {
            sendEvent(context, "ON_OTP_RECEIVED", otp)
        }
    }

    private fun sendEvent(context: Context, eventName: String, data: String) {
        try {
            // ✅ Correct way for RN 0.61+
            val reactInstanceManager =
                (context.applicationContext as ReactApplication)
                    .reactNativeHost
                    .reactInstanceManager

            val reactContext = reactInstanceManager.currentReactContext ?: return

            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, data)

        } catch (e: Exception) {
            Log.e("OtpReceiver", "Error sending event", e)
        }
    }
}
