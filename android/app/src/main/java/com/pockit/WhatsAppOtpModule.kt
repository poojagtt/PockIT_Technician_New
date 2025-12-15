package com.pockit.technician

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.util.Log
import android.widget.Toast

class WhatsAppOtpModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "WhatsAppOtpModule"

    /**
     * Initiates the WhatsApp OTP handshake so zero/one-tap templates can broadcast codes.
     */
    @ReactMethod
    fun initiateHandshake(promise: Promise) {
        try {
            val ctx = reactApplicationContext
            Log.d("WhatsAppOtpModule", "Initiating handshake with WhatsApp apps...")
            sendOtpIntentToWhatsApp(ctx, "com.whatsapp")
            sendOtpIntentToWhatsApp(ctx, "com.whatsapp.w4b")
            Toast.makeText(ctx, "WA OTP handshake sent", Toast.LENGTH_SHORT).show()
            Log.d("WhatsAppOtpModule", "Handshake broadcast sent to WhatsApp apps successfully")
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e("WhatsAppOtpModule", "Error initiating handshake", e)
            promise.reject("HANDSHAKE_ERROR", e)
        }
    }

    /**
     * Check if either WhatsApp build is installed.
     */
    @ReactMethod
    fun isWhatsAppInstalled(promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val installed = listOf("com.whatsapp", "com.whatsapp.w4b").any {
                try {
                    pm.getPackageInfo(it, PackageManager.GET_ACTIVITIES)
                    true
                } catch (_: Exception) {
                    false
                }
            }
            promise.resolve(installed)
        } catch (e: Exception) {
            promise.reject("WA_CHECK_ERROR", e)
        }
    }

    private fun sendOtpIntentToWhatsApp(ctx: Context, packageName: String) {
        try {
            // Create PendingIntent pointing to MainActivity (required for WhatsApp to identify our app)
            val intent = Intent(ctx, MainActivity::class.java)
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            
            val pendingIntent = PendingIntent.getActivity(ctx, 0, intent, flags)

            // Create broadcast intent for WhatsApp
            val intentToWhatsApp = Intent("com.whatsapp.otp.OTP_REQUESTED")
            intentToWhatsApp.setPackage(packageName)
            
            // Create new Bundle and add PendingIntent
            val extras = Bundle()
            extras.putParcelable("_ci_", pendingIntent)
            intentToWhatsApp.putExtras(extras)

            // Send broadcast to WhatsApp
            ctx.sendBroadcast(intentToWhatsApp)
            Log.d("WhatsAppOtpModule", "Handshake sent to $packageName with PendingIntent")
        } catch (e: Exception) {
            Log.e("WhatsAppOtpModule", "Error sending handshake to $packageName", e)
        }
    }
}

