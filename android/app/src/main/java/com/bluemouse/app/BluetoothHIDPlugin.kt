package com.bluemouse.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.provider.Settings
import androidx.activity.result.ActivityResult
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

@CapacitorPlugin(
    name = "BluetoothHID",
    permissions = [
        Permission(
            alias = "bluetooth_s",
            strings = [
                Manifest.permission.BLUETOOTH_CONNECT,
                Manifest.permission.BLUETOOTH_SCAN,
                Manifest.permission.BLUETOOTH_ADVERTISE
            ]
        ),
        Permission(
            alias = "bluetooth_legacy",
            strings = [
                Manifest.permission.BLUETOOTH,
                Manifest.permission.BLUETOOTH_ADMIN
            ]
        )
    ]
)
class BluetoothHIDPlugin : Plugin(), BluetoothHidManager.Listener {

    private lateinit var hidManager: BluetoothHidManager
    private var receiverRegistered = false

    private val bluetoothReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                BluetoothAdapter.ACTION_STATE_CHANGED -> {
                    val data = JSObject().apply {
                        put("state", hidManager.getBluetoothHardwareState())
                    }
                    notifyListeners("bluetoothStateChanged", data)
                }
            }
        }
    }

    override fun load() {
        hidManager = BluetoothHidManager(context, this)
        hidManager.ensureProxy()
        registerBluetoothReceiver()
    }

    private fun registerBluetoothReceiver() {
        if (receiverRegistered) return
        val filter = IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(bluetoothReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            context.registerReceiver(bluetoothReceiver, filter)
        }
        receiverRegistered = true
    }

    override fun handleOnResume() {
        super.handleOnResume()
        hidManager.ensureProxy()
    }

    override fun handleOnPause() {
        hidManager.releaseAllInputs()
        super.handleOnPause()
    }

    override fun handleOnDestroy() {
        if (receiverRegistered) {
            try {
                context.unregisterReceiver(bluetoothReceiver)
            } catch (_: IllegalArgumentException) {
            }
            receiverRegistered = false
        }
        hidManager.close()
        super.handleOnDestroy()
    }

    override fun onHidRegistrationChanged(state: String, error: String?) {
        val data = JSObject().apply {
            put("state", state)
            if (error != null) put("error", error)
        }
        notifyListeners("hidRegistrationChanged", data)
    }

    @SuppressLint("MissingPermission")
    override fun onConnectionStateChanged(
        state: String,
        device: BluetoothDevice?,
        reason: String?
    ) {
        val data = JSObject().apply {
            put("state", state)
            if (device != null) {
                val devObj = JSObject().apply {
                    put("name", if (hidManager.hasRequiredPermissions()) device.name ?: "Bluetooth Host" else "Bluetooth Host")
                    put("address", device.address)
                    put("bondState", "bonded")
                    put("isConnected", state == "connected")
                }
                put("device", devObj)
            }
            if (reason != null) put("reason", reason)
        }
        notifyListeners("connectionStateChanged", data)
    }

    @PluginMethod
    fun checkBluetoothSupport(call: PluginCall) {
        val adapter = hidManager.bluetoothAdapter
        val missing = hidManager.getMissingPermissions()
        val result = JSObject().apply {
            put("isNativeAndroid", true)
            put("bluetoothSupported", adapter != null)
            put("hidProfileSupported", Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && adapter != null)
            put("androidSdkInt", Build.VERSION.SDK_INT)
            put("hasRequiredPermissions", missing.isEmpty())
            put("missingPermissions", JSArray(missing))
            if (adapter == null) {
                put("reason", "This Android device has no Bluetooth hardware adapter.")
            } else if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
                put("reason", "Android 9 (API 28) or higher is required for BluetoothHidDevice.")
            }
        }
        call.resolve(result)
    }

    @PluginMethod
    fun getBluetoothState(call: PluginCall) {
        val missing = hidManager.getMissingPermissions()
        val result = JSObject().apply {
            put("state", hidManager.getBluetoothHardwareState())
            put("hasRequiredPermissions", missing.isEmpty())
            put("missingPermissions", JSArray(missing))
        }
        call.resolve(result)
    }

    @PluginMethod
    fun requestPermissions(call: PluginCall) {
        val alias = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) "bluetooth_s" else "bluetooth_legacy"
        if (getPermissionState(alias) == PermissionState.GRANTED && hidManager.hasRequiredPermissions()) {
            call.resolve(JSObject().apply {
                put("granted", true)
                put("missingPermissions", JSArray())
            })
            return
        }
        requestPermissionForAlias(alias, call, "bluetoothPermissionCallback")
    }

    @PermissionCallback
    private fun bluetoothPermissionCallback(call: PluginCall) {
        val missing = hidManager.getMissingPermissions()
        if (missing.isEmpty()) {
            hidManager.ensureProxy()
        }
        call.resolve(JSObject().apply {
            put("granted", missing.isEmpty())
            put("missingPermissions", JSArray(missing))
        })
    }

    @SuppressLint("MissingPermission")
    @PluginMethod
    fun requestBluetoothEnable(call: PluginCall) {
        val adapter = hidManager.bluetoothAdapter
        if (adapter == null) {
            call.resolve(JSObject().apply {
                put("requested", false)
                put("enabled", false)
            })
            return
        }
        if (!hidManager.hasRequiredPermissions()) {
            call.reject("Grant Bluetooth permissions before enabling Bluetooth.")
            return
        }
        if (adapter.isEnabled) {
            call.resolve(JSObject().apply {
                put("requested", false)
                put("enabled", true)
            })
            return
        }
        val intent = Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)
        startActivityForResult(call, intent, "onBluetoothEnableResult")
    }

    @ActivityCallback
    private fun onBluetoothEnableResult(call: PluginCall?, result: ActivityResult) {
        val enabled = result.resultCode == Activity.RESULT_OK
        call?.resolve(JSObject().apply {
            put("requested", true)
            put("enabled", enabled)
        })
    }

    @PluginMethod
    fun registerHIDDevice(call: PluginCall) {
        val (initiated, message) = hidManager.registerApp()
        call.resolve(JSObject().apply {
            put("initiated", initiated)
            put("registered", hidManager.isAppRegistered)
            if (message != null) put("message", message)
        })
    }

    @PluginMethod
    fun unregisterHIDDevice(call: PluginCall) {
        val ok = hidManager.unregisterApp()
        call.resolve(JSObject().apply {
            put("unregistered", ok)
        })
    }

    @SuppressLint("MissingPermission")
    @PluginMethod
    fun getPairedDevices(call: PluginCall) {
        val devices = hidManager.getBondedDevices()
        val arr = JSArray()
        for (dev in devices) {
            val obj = JSObject().apply {
                put("name", dev.name ?: "Bluetooth Device")
                put("address", dev.address)
                put("bondState", "bonded")
                put("deviceClass", dev.bluetoothClass?.deviceClass ?: 0)
                put("isConnected", hidManager.connectedDevice?.address == dev.address)
            }
            arr.put(obj)
        }
        call.resolve(JSObject().apply {
            put("devices", arr)
        })
    }

    @SuppressLint("MissingPermission")
    @PluginMethod
    fun requestDiscoverability(call: PluginCall) {
        if (!hidManager.hasRequiredPermissions()) {
            call.reject("Grant Bluetooth permissions before making device discoverable.")
            return
        }
        val duration = (call.getInt("durationSeconds") ?: 120).coerceIn(30, 300)
        val intent = Intent(BluetoothAdapter.ACTION_REQUEST_DISCOVERABLE).apply {
            putExtra(BluetoothAdapter.EXTRA_DISCOVERABLE_DURATION, duration)
        }
        startActivityForResult(call, intent, "onDiscoverableResult")
    }

    @ActivityCallback
    private fun onDiscoverableResult(call: PluginCall?, result: ActivityResult) {
        val duration = if (result.resultCode > 0) result.resultCode else 0
        call?.resolve(JSObject().apply {
            put("requested", result.resultCode != Activity.RESULT_CANCELED)
            put("durationSeconds", duration)
        })
    }

    @PluginMethod
    fun openBluetoothSettings(call: PluginCall) {
        val intent = Intent(Settings.ACTION_BLUETOOTH_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
        call.resolve(JSObject().apply { put("opened", true) })
    }

    @PluginMethod
    fun connectDevice(call: PluginCall) {
        val address = call.getString("address")
        if (address.isNullOrBlank()) {
            call.resolve(JSObject().apply {
                put("initiated", false)
                put("message", "Device address is required")
            })
            return
        }
        val (initiated, message) = hidManager.connect(address)
        call.resolve(JSObject().apply {
            put("initiated", initiated)
            if (message != null) put("message", message)
        })
    }

    @PluginMethod
    fun disconnectDevice(call: PluginCall) {
        val initiated = hidManager.disconnect()
        call.resolve(JSObject().apply {
            put("initiated", initiated)
        })
    }

    @PluginMethod
    fun sendMouseReport(call: PluginCall) {
        val buttons = call.getInt("buttons") ?: 0
        val dx = call.getInt("dx") ?: 0
        val dy = call.getInt("dy") ?: 0
        val wheel = call.getInt("wheel") ?: 0
        val hWheel = call.getInt("hWheel") ?: 0
        val sent = hidManager.sendMouseReport(buttons, dx, dy, wheel, hWheel)
        call.resolve(JSObject().apply { put("sent", sent) })
    }

    @PluginMethod
    fun sendKeyboardReport(call: PluginCall) {
        val modifiers = call.getInt("modifiers") ?: 0
        val keyArray = call.getArray("keycodes")
        val keycodes = mutableListOf<Int>()
        if (keyArray != null) {
            for (i in 0 until keyArray.length()) {
                keycodes.add(keyArray.optInt(i, 0))
            }
        }
        val sent = hidManager.sendKeyboardReport(modifiers, keycodes)
        call.resolve(JSObject().apply { put("sent", sent) })
    }

    @SuppressLint("MissingPermission")
    @PluginMethod
    fun getConnectionStatus(call: PluginCall) {
        val btState = hidManager.getBluetoothHardwareState()
        val hidState = when {
            hidManager.isAppRegistered -> "registered"
            hidManager.isRegistering -> "registering"
            else -> "unregistered"
        }
        val dev = hidManager.connectedDevice
        val phase = when {
            btState == "disabled" || btState == "turning_off" -> "bluetooth_disabled"
            hidManager.connectionState == "connected" && dev != null -> "connected"
            hidManager.connectionState == "connecting" -> "pairing_in_progress"
            hidManager.connectionState == "failed" -> "connection_failed"
            hidState == "registering" -> "hid_pending"
            hidState == "registered" -> "waiting_for_pairing"
            btState == "enabled" -> "bluetooth_enabled"
            else -> "disconnected"
        }

        val result = JSObject().apply {
            put("isNativeAndroid", true)
            put("bluetoothState", btState)
            put("hidState", hidState)
            put("connectionPhase", phase)
            put("isDiscoverable", false)
            put("discoverableRemainingSeconds", 0)
            put("lastError", null as String?)
            if (dev != null) {
                put("connectedDevice", JSObject().apply {
                    put("name", if (hidManager.hasRequiredPermissions()) dev.name ?: "Bluetooth Host" else "Bluetooth Host")
                    put("address", dev.address)
                    put("bondState", "bonded")
                    put("isConnected", true)
                })
            } else {
                put("connectedDevice", null as JSObject?)
            }
        }
        call.resolve(result)
    }
}
