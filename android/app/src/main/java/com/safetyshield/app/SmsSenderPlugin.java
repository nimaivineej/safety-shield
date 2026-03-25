package com.safetyshield.app;

import android.Manifest;
import android.telephony.SmsManager;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;

@CapacitorPlugin(
    name = "SmsSender",
    permissions = {
        @Permission(strings = {Manifest.permission.SEND_SMS}, alias = "sms")
    }
)
public class SmsSenderPlugin extends Plugin {

    private static final String TAG = "SmsSenderPlugin";

    @PluginMethod
    public void sendSms(PluginCall call) {
        JSArray numbersArray = call.getArray("numbers");
        String message = call.getString("message");

        if (numbersArray == null || message == null) {
            call.reject("Missing required parameters: numbers and message");
            return;
        }

        if (!getPermissionState("sms").toString().equals("granted")) {
            requestPermissionForAlias("sms", call, "smsPermissionCallback");
            return;
        }

        doSendSms(call, numbersArray, message);
    }

    @PermissionCallback
    private void smsPermissionCallback(PluginCall call) {
        if (getPermissionState("sms").toString().equals("granted")) {
            JSArray numbersArray = call.getArray("numbers");
            String message = call.getString("message");
            doSendSms(call, numbersArray, message);
        } else {
            call.reject("SMS permission denied");
        }
    }

    private void doSendSms(PluginCall call, JSArray numbersArray, String message) {
        try {
            SmsManager smsManager = SmsManager.getDefault();
            int sent = 0;

            for (int i = 0; i < numbersArray.length(); i++) {
                String number = numbersArray.getString(i).trim();
                if (!number.isEmpty()) {
                    try {
                        // Split long messages automatically
                        ArrayList<String> parts = smsManager.divideMessage(message);
                        smsManager.sendMultipartTextMessage(number, null, parts, null, null);
                        Log.d(TAG, "SMS sent to: " + number);
                        sent++;
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to send SMS to " + number + ": " + e.getMessage());
                    }
                }
            }

            JSObject result = new JSObject();
            result.put("sent", sent);
            result.put("total", numbersArray.length());
            call.resolve(result);

        } catch (Exception e) {
            call.reject("Failed to send SMS: " + e.getMessage());
        }
    }
}
