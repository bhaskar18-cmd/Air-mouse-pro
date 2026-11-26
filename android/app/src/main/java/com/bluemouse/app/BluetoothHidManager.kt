package com.bluemouse.app

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothHidDevice
import android.bluetooth.BluetoothHidDeviceAppQosSettings
import android.bluetooth.BluetoothHidDeviceAppSdpSettings
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.core.content.ContextCompat
import java.util.concurrent.Executors

class BluetoothHidManager(
    private val context: Context,
    private val listener: Listener
) {
    interface Listener {
        fun onHidRegistrationChanged(state: String, error: String?)
        fun onConnectionStateChanged(state: String, device: BluetoothDevice?, reason: String?)
    }

    private val bluetoothManager: BluetoothManager? =
        context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
    val bluetoothAdapter: BluetoothAdapter?
        get() = bluetoothManager?.adapter

    private val executor = Executors.newSingleThreadExecutor()
    private val mainHandler = Handler(Looper.getMainLooper())

    @Volatile
    private var hidDeviceProxy: BluetoothHidDevice? = null

    @Volatile
    var isAppRegistered: Boolean = false
        private set

    @Volatile
    var isRegistering: Boolean = false
        private set

    @Volatile
    var connectedDevice: BluetoothDevice? = null
        private set

    @Volatile
    var connectionState: String = "disconnected"
        private set

    private var pendingRegisterAfterProxy = false

    fun hasRequiredPermissions(): Boolean {
        return getMissingPermissions().isEmpty()
    }

    fun getMissingPermissions(): List<String> {
        val missing = mutableListOf<String>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_CONNECT)
                != PackageManager.PERMISSION_GRANTED
            ) {
                missing.add(Manifest.permission.BLUETOOTH_CONNECT)
            }
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_SCAN)
                != PackageManager.PERMISSION_GRANTED
            ) {
                missing.add(Manifest.permission.BLUETOOTH_SCAN)
            }
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_ADVERTISE)
                != PackageManager.PERMISSION_GRANTED
            ) {
                missing.add(Manifest.permission.BLUETOOTH_ADVERTISE)
            }
        } else {
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH)
                != PackageManager.PERMISSION_GRANTED
            ) {
                missing.add(Manifest.permission.BLUETOOTH)
            }
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_ADMIN)
                != PackageManager.PERMISSION_GRANTED
            ) {
                missing.add(Manifest.permission.BLUETOOTH_ADMIN)
            }
        }
        return missing
    }

    fun getBluetoothHardwareState(): String {
        val adapter = bluetoothAdapter ?: return "unavailable"
        if (!hasRequiredPermissions()) return "permission_required"
        return when (adapter.state) {
            BluetoothAdapter.STATE_ON -> "enabled"
            BluetoothAdapter.STATE_TURNING_ON -> "turning_on"
            BluetoothAdapter.STATE_TURNING_OFF -> "turning_off"
            BluetoothAdapter.STATE_OFF -> "disabled"
            else -> "unknown"
        }
    }

    private val profileListener = object : BluetoothProfile.ServiceListener {
        override fun onServiceConnected(profile: Int, proxy: BluetoothProfile) {
            if (profile == BluetoothProfile.HID_DEVICE) {
                hidDeviceProxy = proxy as? BluetoothHidDevice
                if (pendingRegisterAfterProxy) {
                    pendingRegisterAfterProxy = false
                    registerHidAppInternal()
                }
            }
        }

        override fun onServiceDisconnected(profile: Int) {
            if (profile == BluetoothProfile.HID_DEVICE) {
                hidDeviceProxy = null
                isAppRegistered = false
                isRegistering = false
                connectedDevice = null
                connectionState = "disconnected"
                mainHandler.post {
                    listener.onHidRegistrationChanged("unregistered", null)
                    listener.onConnectionStateChanged("disconnected", null, "HID service disconnected")
                }
            }
        }
    }

    private val hidCallback = object : BluetoothHidDevice.Callback() {
        override fun onAppStatusChanged(pluggedDevice: BluetoothDevice?, registered: Boolean) {
            isRegistering = false
            isAppRegistered = registered
            mainHandler.post {
                if (registered) {
                    listener.onHidRegistrationChanged("registered", null)
                    if (pluggedDevice != null) {
                        connectedDevice = pluggedDevice
                        connectionState = "connected"
                        listener.onConnectionStateChanged("connected", pluggedDevice, null)
                    }
                } else {
                    connectedDevice = null
                    connectionState = "disconnected"
                    listener.onHidRegistrationChanged("unregistered", null)
                }
            }
        }

        @SuppressLint("MissingPermission")
        override fun onConnectionStateChanged(device: BluetoothDevice?, state: Int) {
            mainHandler.post {
                when (state) {
                    BluetoothProfile.STATE_CONNECTED -> {
                        connectedDevice = device
                        connectionState = "connected"
                        listener.onConnectionStateChanged("connected", device, null)
                    }
                    BluetoothProfile.STATE_CONNECTING -> {
                        connectionState = "connecting"
                        listener.onConnectionStateChanged("connecting", device, null)
                    }
                    BluetoothProfile.STATE_DISCONNECTING -> {
                        connectionState = "disconnecting"
                        listener.onConnectionStateChanged("disconnecting", device, null)
                    }
                    BluetoothProfile.STATE_DISCONNECTED -> {
                        val prev = connectedDevice ?: device
                        val wasConnecting = connectionState == "connecting"
                        connectedDevice = null
                        connectionState = if (wasConnecting) "failed" else "disconnected"
                        val reason = if (wasConnecting) {
                            "Host rejected or timed out during HID connection"
                        } else {
                            null
                        }
                        listener.onConnectionStateChanged(
                            if (wasConnecting) "failed" else "disconnected",
                            prev,
                            reason
                        )
                    }
                }
            }
        }

        @SuppressLint("MissingPermission")
        override fun onGetReport(device: BluetoothDevice?, type: Byte, id: Byte, bufferSize: Int) {
            val proxy = hidDeviceProxy ?: return
            if (!hasRequiredPermissions() || device == null) return
            val emptyReport = when (id.toInt()) {
                HidReportDescriptor.REPORT_ID_MOUSE -> ByteArray(5)
                HidReportDescriptor.REPORT_ID_KEYBOARD -> ByteArray(8)
                else -> ByteArray(0)
            }
            if (emptyReport.isNotEmpty()) {
                proxy.replyReport(device, type, id, emptyReport)
            } else {
                proxy.reportError(device, BluetoothHidDevice.ERROR_RSP_INVALID_RPT_ID)
            }
        }

        override fun onSetReport(device: BluetoothDevice?, type: Byte, id: Byte, data: ByteArray?) {
            // Optional LED status updates from host
        }

        override fun onVirtualCableUnplug(device: BluetoothDevice?) {
            connectedDevice = null
            connectionState = "disconnected"
            mainHandler.post {
                listener.onConnectionStateChanged("disconnected", device, "Host unplugged virtual HID cable")
            }
        }
    }

    fun ensureProxy(): Boolean {
        val adapter = bluetoothAdapter ?: return false
        if (hidDeviceProxy != null) return true
        return adapter.getProfileProxy(context, profileListener, BluetoothProfile.HID_DEVICE)
    }

    fun registerApp(): Pair<Boolean, String?> {
        val adapter = bluetoothAdapter ?: return Pair(false, "Bluetooth adapter unavailable")
        if (!hasRequiredPermissions()) {
            return Pair(false, "Missing Bluetooth runtime permissions")
        }
        if (!adapter.isEnabled) {
            return Pair(false, "Bluetooth is disabled")
        }
        if (isAppRegistered) {
            return Pair(true, null)
        }

        isRegistering = true
        listener.onHidRegistrationChanged("registering", null)

        if (hidDeviceProxy == null) {
            pendingRegisterAfterProxy = true
            val ok = ensureProxy()
            if (!ok) {
                isRegistering = false
                pendingRegisterAfterProxy = false
                listener.onHidRegistrationChanged("failed", "Device does not support BluetoothHidDevice profile")
                return Pair(false, "BluetoothHidDevice profile unsupported on this Android firmware")
            }
            return Pair(true, null)
        }

        return registerHidAppInternal()
    }

    @SuppressLint("MissingPermission")
    private fun registerHidAppInternal(): Pair<Boolean, String?> {
        val proxy = hidDeviceProxy ?: run {
            isRegistering = false
            return Pair(false, "HID profile proxy unavailable")
        }

        val sdpSettings = BluetoothHidDeviceAppSdpSettings(
            "BlueMouse HID",
            "Wireless Mouse & Keyboard",
            "BlueMouse",
            BluetoothHidDevice.SUBCLASS1_COMBO,
            HidReportDescriptor.DESCRIPTOR
        )

        val outQos = BluetoothHidDeviceAppQosSettings(
            BluetoothHidDeviceAppQosSettings.SERVICE_BEST_EFFORT,
            800,
            9,
            0,
            11250,
            BluetoothHidDeviceAppQosSettings.MAX
        )

        val started = proxy.registerApp(sdpSettings, null, outQos, executor, hidCallback)
        if (!started) {
            isRegistering = false
            listener.onHidRegistrationChanged("failed", "registerApp() returned false")
            return Pair(false, "BluetoothHidDevice.registerApp() failed")
        }
        return Pair(true, null)
    }

    @SuppressLint("MissingPermission")
    fun unregisterApp(): Boolean {
        val proxy = hidDeviceProxy ?: return false
        if (!hasRequiredPermissions()) return false
        releaseAllInputs()
        val result = proxy.unregisterApp()
        isAppRegistered = false
        isRegistering = false
        connectedDevice = null
        connectionState = "disconnected"
        listener.onHidRegistrationChanged("unregistered", null)
        return result
    }

    @SuppressLint("MissingPermission")
    fun getBondedDevices(): List<BluetoothDevice> {
        val adapter = bluetoothAdapter ?: return emptyList()
        if (!hasRequiredPermissions()) return emptyList()
        return adapter.bondedDevices?.toList() ?: emptyList()
    }

    @SuppressLint("MissingPermission")
    fun connect(address: String): Pair<Boolean, String?> {
        val adapter = bluetoothAdapter ?: return Pair(false, "Bluetooth unavailable")
        val proxy = hidDeviceProxy ?: return Pair(false, "HID service not initialized")
        if (!hasRequiredPermissions()) return Pair(false, "Bluetooth permissions missing")
        if (!isAppRegistered) return Pair(false, "Register HID peripheral before connecting")

        val target = try {
            adapter.getRemoteDevice(address)
        } catch (_: IllegalArgumentException) {
            return Pair(false, "Invalid Bluetooth MAC address")
        }

        connectionState = "connecting"
        listener.onConnectionStateChanged("connecting", target, null)
        val initiated = proxy.connect(target)
        if (!initiated) {
            connectionState = "failed"
            listener.onConnectionStateChanged("failed", target, "BluetoothHidDevice.connect() returned false")
            return Pair(false, "Failed to initiate HID connection to $address")
        }
        return Pair(true, null)
    }

    @SuppressLint("MissingPermission")
    fun disconnect(): Boolean {
        val proxy = hidDeviceProxy ?: return false
        val target = connectedDevice ?: return false
        if (!hasRequiredPermissions()) return false
        releaseAllInputs()
        return proxy.disconnect(target)
    }

    @SuppressLint("MissingPermission")
    fun sendMouseReport(buttons: Int, dx: Int, dy: Int, wheel: Int, hWheel: Int): Boolean {
        val proxy = hidDeviceProxy ?: return false
        val target = connectedDevice ?: return false
        if (!isAppRegistered || !hasRequiredPermissions()) return false

        val report = byteArrayOf(
            (buttons and 0x07).toByte(),
            dx.coerceIn(-127, 127).toByte(),
            dy.coerceIn(-127, 127).toByte(),
            wheel.coerceIn(-127, 127).toByte(),
            hWheel.coerceIn(-127, 127).toByte()
        )
        return proxy.sendReport(target, HidReportDescriptor.REPORT_ID_MOUSE, report)
    }

    @SuppressLint("MissingPermission")
    fun sendKeyboardReport(modifiers: Int, keycodes: List<Int>): Boolean {
        val proxy = hidDeviceProxy ?: return false
        val target = connectedDevice ?: return false
        if (!isAppRegistered || !hasRequiredPermissions()) return false

        val report = ByteArray(8)
        report[0] = (modifiers and 0xFF).toByte()
        report[1] = 0x00
        for (i in 0 until 6) {
            report[2 + i] = ((keycodes.getOrNull(i) ?: 0) and 0xFF).toByte()
        }
        return proxy.sendReport(target, HidReportDescriptor.REPORT_ID_KEYBOARD, report)
    }

    fun releaseAllInputs() {
        sendMouseReport(0, 0, 0, 0, 0)
        sendKeyboardReport(0, emptyList())
    }

    fun close() {
        releaseAllInputs()
        val adapter = bluetoothAdapter
        val proxy = hidDeviceProxy
        if (adapter != null && proxy != null) {
            adapter.closeProfileProxy(BluetoothProfile.HID_DEVICE, proxy)
        }
        hidDeviceProxy = null
        executor.shutdownNow()
    }
}
