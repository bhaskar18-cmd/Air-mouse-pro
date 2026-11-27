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
import android.os.Process
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

    private val callbackExecutor = Executors.newSingleThreadExecutor()
    private val reportExecutor = Executors.newSingleThreadExecutor { runnable ->
        Thread({
            try {
                Process.setThreadPriority(Process.THREAD_PRIORITY_DISPLAY)
            } catch (_: Throwable) {
            }
            runnable.run()
        }, "BlueMouse-HID-Report").apply {
            priority = Thread.MAX_PRIORITY
        }
    }
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

    @Volatile
    var lastError: String? = null
        private set

    @Volatile
    private var cachedHasPermissions: Boolean = false

    private val mouseQueueLock = Any()
    private var pendingMouseDx: Int = 0
    private var pendingMouseDy: Int = 0
    private var pendingMouseWheel: Int = 0
    private var pendingMouseHWheel: Int = 0
    private var pendingMouseButtons: Int = 0
    private var lastEnqueuedMouseButtons: Int = 0
    private var hasPendingMouseMove: Boolean = false
    private var mouseDrainScheduled: Boolean = false
    private val pendingMouseCallbacks = mutableListOf<(Boolean) -> Unit>()
    private val mouseReportBuffer = ByteArray(5)

    private var pendingRegisterAfterProxy = false
    private var explicitUnregisterInProgress = false

    private val proxyTimeoutRunnable = Runnable {
        if (pendingRegisterAfterProxy && hidDeviceProxy == null) {
            pendingRegisterAfterProxy = false
            isRegistering = false
            val msg =
                "BluetoothHidDevice profile service did not respond. This Android device or ROM may not support Bluetooth HID Device mode."
            lastError = msg
            listener.onHidRegistrationChanged("failed", msg)
        }
    }

    fun hasRequiredPermissions(): Boolean {
        val granted = getMissingPermissions().isEmpty()
        cachedHasPermissions = granted
        return granted
    }

    private fun hasPermissionsFast(): Boolean {
        if (cachedHasPermissions) return true
        return hasRequiredPermissions()
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

    @SuppressLint("MissingPermission")
    fun isDiscoverable(): Boolean {
        val adapter = bluetoothAdapter ?: return false
        if (!hasRequiredPermissions()) return false
        return try {
            adapter.scanMode == BluetoothAdapter.SCAN_MODE_CONNECTABLE_DISCOVERABLE
        } catch (_: SecurityException) {
            false
        }
    }

    private val profileListener = object : BluetoothProfile.ServiceListener {
        override fun onServiceConnected(profile: Int, proxy: BluetoothProfile) {
            if (profile == BluetoothProfile.HID_DEVICE) {
                mainHandler.removeCallbacks(proxyTimeoutRunnable)
                hidDeviceProxy = proxy as? BluetoothHidDevice
                if (pendingRegisterAfterProxy) {
                    pendingRegisterAfterProxy = false
                    registerHidAppInternal()
                }
            }
        }

        override fun onServiceDisconnected(profile: Int) {
            if (profile == BluetoothProfile.HID_DEVICE) {
                mainHandler.removeCallbacks(proxyTimeoutRunnable)
                hidDeviceProxy = null
                isAppRegistered = false
                isRegistering = false
                connectedDevice = null
                connectionState = "disconnected"
                clearPendingMouseMoves()
                mainHandler.post {
                    listener.onHidRegistrationChanged("unregistered", null)
                    listener.onConnectionStateChanged(
                        "disconnected",
                        null,
                        "Android Bluetooth HID service disconnected"
                    )
                }
            }
        }
    }

    private val hidCallback = object : BluetoothHidDevice.Callback() {
        override fun onAppStatusChanged(pluggedDevice: BluetoothDevice?, registered: Boolean) {
            val wasRegistering = isRegistering
            val wasExplicitUnregister = explicitUnregisterInProgress
            explicitUnregisterInProgress = false
            isRegistering = false
            isAppRegistered = registered

            mainHandler.post {
                if (registered) {
                    lastError = null
                    listener.onHidRegistrationChanged("registered", null)
                    if (pluggedDevice != null) {
                        connectedDevice = pluggedDevice
                        connectionState = "connected"
                        listener.onConnectionStateChanged("connected", pluggedDevice, null)
                    }
                } else if (wasRegistering && !wasExplicitUnregister) {
                    val msg =
                        "Bluetooth HID application registration was rejected by Android Bluetooth stack."
                    lastError = msg
                    connectedDevice = null
                    connectionState = "disconnected"
                    listener.onHidRegistrationChanged("failed", msg)
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
                        lastError = null
                        connectedDevice = device
                        connectionState = "connected"
                        listener.onConnectionStateChanged("connected", device, null)
                    }
                    BluetoothProfile.STATE_CONNECTING -> {
                        lastError = null
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
                        clearPendingMouseMoves()
                        val reason = if (wasConnecting) {
                            "Host rejected or timed out during HID connection. Ensure Bluetooth is paired and host supports HID input."
                        } else {
                            null
                        }
                        if (wasConnecting) {
                            lastError = reason
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
                HidReportDescriptor.REPORT_ID_CONSUMER -> ByteArray(2)
                else -> ByteArray(0)
            }
            if (emptyReport.isNotEmpty()) {
                proxy.replyReport(device, type, id, emptyReport)
            } else {
                proxy.reportError(device, BluetoothHidDevice.ERROR_RSP_INVALID_RPT_ID)
            }
        }

        override fun onSetReport(device: BluetoothDevice?, type: Byte, id: Byte, data: ByteArray?) {
            // Host LED status updates (NumLock/CapsLock/ScrollLock) arrive here
        }

        override fun onSetProtocol(device: BluetoothDevice?, protocol: Byte) {
            // Standard HID Report Protocol negotiation handled by BluetoothHidDevice
        }

        override fun onVirtualCableUnplug(device: BluetoothDevice?) {
            connectedDevice = null
            connectionState = "disconnected"
            clearPendingMouseMoves()
            mainHandler.post {
                listener.onConnectionStateChanged(
                    "disconnected",
                    device,
                    "Host unplugged virtual HID cable"
                )
            }
        }
    }

    fun ensureProxy(): Boolean {
        val adapter = bluetoothAdapter ?: return false
        if (hidDeviceProxy != null) return true
        return adapter.getProfileProxy(context, profileListener, BluetoothProfile.HID_DEVICE)
    }

    fun registerApp(): Pair<Boolean, String?> {
        val adapter = bluetoothAdapter ?: run {
            lastError = "Bluetooth hardware adapter unavailable"
            return Pair(false, lastError)
        }
        if (!hasRequiredPermissions()) {
            lastError = "Missing Bluetooth runtime permissions"
            return Pair(false, lastError)
        }
        if (!adapter.isEnabled) {
            lastError = "Bluetooth is disabled"
            return Pair(false, lastError)
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            lastError = "Android 9 (API 28) or higher is required for BluetoothHidDevice"
            return Pair(false, lastError)
        }
        if (isAppRegistered) {
            lastError = null
            return Pair(true, null)
        }

        lastError = null
        explicitUnregisterInProgress = false
        isRegistering = true
        listener.onHidRegistrationChanged("registering", null)

        if (hidDeviceProxy == null) {
            pendingRegisterAfterProxy = true
            val ok = ensureProxy()
            if (!ok) {
                isRegistering = false
                pendingRegisterAfterProxy = false
                val msg = "BluetoothHidDevice profile unsupported on this Android hardware/ROM"
                lastError = msg
                listener.onHidRegistrationChanged("failed", msg)
                return Pair(false, msg)
            }
            mainHandler.removeCallbacks(proxyTimeoutRunnable)
            mainHandler.postDelayed(proxyTimeoutRunnable, 3000L)
            return Pair(true, null)
        }

        return registerHidAppInternal()
    }

    @SuppressLint("MissingPermission")
    private fun registerHidAppInternal(): Pair<Boolean, String?> {
        val proxy = hidDeviceProxy ?: run {
            isRegistering = false
            lastError = "HID profile proxy unavailable"
            return Pair(false, lastError)
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
            4000,
            64,
            0,
            11250,
            BluetoothHidDeviceAppQosSettings.MAX
        )

        val started = proxy.registerApp(sdpSettings, null, outQos, callbackExecutor, hidCallback)
        if (!started) {
            isRegistering = false
            val msg = "BluetoothHidDevice.registerApp() returned false"
            lastError = msg
            listener.onHidRegistrationChanged("failed", msg)
            return Pair(false, msg)
        }
        return Pair(true, null)
    }

    @SuppressLint("MissingPermission")
    fun unregisterApp(): Boolean {
        val proxy = hidDeviceProxy ?: return false
        if (!hasRequiredPermissions()) return false
        explicitUnregisterInProgress = true
        releaseAllInputsSync()
        val result = proxy.unregisterApp()
        isAppRegistered = false
        isRegistering = false
        connectedDevice = null
        connectionState = "disconnected"
        lastError = null
        listener.onHidRegistrationChanged("unregistered", null)
        return result
    }

    @SuppressLint("MissingPermission")
    fun getBondedDevices(): List<BluetoothDevice> {
        val adapter = bluetoothAdapter ?: return emptyList()
        if (!hasRequiredPermissions()) return emptyList()
        return try {
            adapter.bondedDevices?.toList() ?: emptyList()
        } catch (_: SecurityException) {
            emptyList()
        }
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

        lastError = null
        connectionState = "connecting"
        listener.onConnectionStateChanged("connecting", target, null)
        val initiated = proxy.connect(target)
        if (!initiated) {
            val msg =
                "Failed to initiate HID connection to $address. Ensure the host is awake and paired as an HID receiver."
            lastError = msg
            connectionState = "failed"
            listener.onConnectionStateChanged("failed", target, msg)
            return Pair(false, msg)
        }
        return Pair(true, null)
    }

    @SuppressLint("MissingPermission")
    fun disconnect(): Boolean {
        val proxy = hidDeviceProxy ?: return false
        val target = connectedDevice ?: return false
        if (!hasRequiredPermissions()) return false
        releaseAllInputsSync()
        return proxy.disconnect(target)
    }

    @SuppressLint("MissingPermission")
    fun sendMouseReport(
        buttons: Int,
        dx: Int,
        dy: Int,
        wheel: Int,
        hWheel: Int,
        onComplete: ((Boolean) -> Unit)? = null
    ): Boolean {
        val proxy = hidDeviceProxy ?: run {
            onComplete?.invoke(false)
            return false
        }
        val target = connectedDevice ?: run {
            onComplete?.invoke(false)
            return false
        }
        if (!isAppRegistered || !hasPermissionsFast() || reportExecutor.isShutdown) {
            onComplete?.invoke(false)
            return false
        }

        val cleanButtons = buttons and 0x07
        var dispatchButtonEdge = false
        var scheduleDrain = false

        synchronized(mouseQueueLock) {
            if (cleanButtons != lastEnqueuedMouseButtons) {
                lastEnqueuedMouseButtons = cleanButtons
                dispatchButtonEdge = true
            } else {
                pendingMouseButtons = cleanButtons
                pendingMouseDx += dx
                pendingMouseDy += dy
                pendingMouseWheel += wheel
                pendingMouseHWheel += hWheel
                hasPendingMouseMove = true
                if (onComplete != null) {
                    pendingMouseCallbacks.add(onComplete)
                }
                if (!mouseDrainScheduled) {
                    mouseDrainScheduled = true
                    scheduleDrain = true
                }
            }
        }

        if (dispatchButtonEdge) {
            val edgeReport = byteArrayOf(
                cleanButtons.toByte(),
                dx.coerceIn(-127, 127).toByte(),
                dy.coerceIn(-127, 127).toByte(),
                wheel.coerceIn(-127, 127).toByte(),
                hWheel.coerceIn(-127, 127).toByte()
            )
            try {
                reportExecutor.execute {
                    // Flush any accumulated pre-click movement first so cursor lands before click
                    drainCoalescedMouseMove(proxy, target)
                    var sent = false
                    try {
                        sent = proxy.sendReport(target, HidReportDescriptor.REPORT_ID_MOUSE, edgeReport)
                    } catch (_: SecurityException) {
                        cachedHasPermissions = false
                    } finally {
                        onComplete?.invoke(sent)
                    }
                }
            } catch (_: RuntimeException) {
                onComplete?.invoke(false)
                return false
            }
            return true
        }

        if (scheduleDrain) {
            try {
                reportExecutor.execute {
                    drainCoalescedMouseMove(proxy, target)
                }
            } catch (_: RuntimeException) {
                val droppedCallbacks: List<(Boolean) -> Unit>
                synchronized(mouseQueueLock) {
                    mouseDrainScheduled = false
                    hasPendingMouseMove = false
                    pendingMouseDx = 0
                    pendingMouseDy = 0
                    pendingMouseWheel = 0
                    pendingMouseHWheel = 0
                    droppedCallbacks = pendingMouseCallbacks.toList()
                    pendingMouseCallbacks.clear()
                }
                droppedCallbacks.forEach { it(false) }
                return false
            }
        }
        return true
    }

    @SuppressLint("MissingPermission")
    private fun drainCoalescedMouseMove(proxy: BluetoothHidDevice, target: BluetoothDevice) {
        while (true) {
            var sendButtons = 0
            var sendDx = 0
            var sendDy = 0
            var sendWheel = 0
            var sendHWheel = 0
            var callbacks: List<(Boolean) -> Unit> = emptyList()
            var hasWork = false

            synchronized(mouseQueueLock) {
                if (!hasPendingMouseMove) {
                    mouseDrainScheduled = false
                    if (pendingMouseCallbacks.isNotEmpty()) {
                        callbacks = pendingMouseCallbacks.toList()
                        pendingMouseCallbacks.clear()
                    }
                    hasWork = false
                } else {
                    sendButtons = pendingMouseButtons
                    sendDx = pendingMouseDx.coerceIn(-127, 127)
                    sendDy = pendingMouseDy.coerceIn(-127, 127)
                    sendWheel = pendingMouseWheel.coerceIn(-127, 127)
                    sendHWheel = pendingMouseHWheel.coerceIn(-127, 127)

                    pendingMouseDx -= sendDx
                    pendingMouseDy -= sendDy
                    pendingMouseWheel -= sendWheel
                    pendingMouseHWheel -= sendHWheel

                    hasPendingMouseMove =
                        pendingMouseDx != 0 ||
                        pendingMouseDy != 0 ||
                        pendingMouseWheel != 0 ||
                        pendingMouseHWheel != 0

                    if (!hasPendingMouseMove) {
                        mouseDrainScheduled = false
                    }
                    if (pendingMouseCallbacks.isNotEmpty()) {
                        callbacks = pendingMouseCallbacks.toList()
                        pendingMouseCallbacks.clear()
                    }
                    hasWork = true
                }
            }

            if (!hasWork) {
                callbacks.forEach { it(true) }
                return
            }

            mouseReportBuffer[0] = (sendButtons and 0x07).toByte()
            mouseReportBuffer[1] = sendDx.toByte()
            mouseReportBuffer[2] = sendDy.toByte()
            mouseReportBuffer[3] = sendWheel.toByte()
            mouseReportBuffer[4] = sendHWheel.toByte()

            var sent = false
            try {
                if (isAppRegistered && connectedDevice != null) {
                    sent = proxy.sendReport(target, HidReportDescriptor.REPORT_ID_MOUSE, mouseReportBuffer)
                }
            } catch (_: SecurityException) {
                cachedHasPermissions = false
            } finally {
                callbacks.forEach { it(sent) }
            }
        }
    }

    private fun clearPendingMouseMoves() {
        val callbacks: List<(Boolean) -> Unit>
        synchronized(mouseQueueLock) {
            pendingMouseDx = 0
            pendingMouseDy = 0
            pendingMouseWheel = 0
            pendingMouseHWheel = 0
            pendingMouseButtons = 0
            lastEnqueuedMouseButtons = 0
            hasPendingMouseMove = false
            mouseDrainScheduled = false
            callbacks = pendingMouseCallbacks.toList()
            pendingMouseCallbacks.clear()
        }
        callbacks.forEach { it(false) }
    }

    @SuppressLint("MissingPermission")
    fun sendKeyboardReport(modifiers: Int, keycodes: List<Int>): Boolean {
        val proxy = hidDeviceProxy ?: return false
        val target = connectedDevice ?: return false
        if (!isAppRegistered || !hasPermissionsFast() || reportExecutor.isShutdown) return false

        val report = ByteArray(8)
        report[0] = (modifiers and 0xFF).toByte()
        report[1] = 0x00
        for (i in 0 until 6) {
            report[2 + i] = ((keycodes.getOrNull(i) ?: 0) and 0xFF).toByte()
        }
        reportExecutor.execute {
            try {
                proxy.sendReport(target, HidReportDescriptor.REPORT_ID_KEYBOARD, report)
            } catch (_: SecurityException) {
                cachedHasPermissions = false
            }
        }
        return true
    }

    @SuppressLint("MissingPermission")
    fun sendConsumerReport(usageCode: Int): Boolean {
        val proxy = hidDeviceProxy ?: return false
        val target = connectedDevice ?: return false
        if (!isAppRegistered || !hasPermissionsFast() || reportExecutor.isShutdown) return false

        val clamped = usageCode.coerceIn(0, 0x03FF)
        val report = byteArrayOf(
            (clamped and 0xFF).toByte(),
            ((clamped shr 8) and 0xFF).toByte()
        )
        reportExecutor.execute {
            try {
                proxy.sendReport(target, HidReportDescriptor.REPORT_ID_CONSUMER, report)
            } catch (_: SecurityException) {
                cachedHasPermissions = false
            }
        }
        return true
    }

    @SuppressLint("MissingPermission")
    private fun releaseAllInputsSync() {
        clearPendingMouseMoves()
        val proxy = hidDeviceProxy ?: return
        val target = connectedDevice ?: return
        if (!isAppRegistered || !hasPermissionsFast()) return
        try {
            proxy.sendReport(target, HidReportDescriptor.REPORT_ID_MOUSE, ByteArray(5))
            proxy.sendReport(target, HidReportDescriptor.REPORT_ID_KEYBOARD, ByteArray(8))
            proxy.sendReport(target, HidReportDescriptor.REPORT_ID_CONSUMER, ByteArray(2))
        } catch (_: SecurityException) {
            cachedHasPermissions = false
        }
    }

    fun releaseAllInputs() {
        clearPendingMouseMoves()
        sendMouseReport(0, 0, 0, 0, 0)
        sendKeyboardReport(0, emptyList())
        sendConsumerReport(0)
    }

    fun clearLastError() {
        lastError = null
    }

    fun close() {
        mainHandler.removeCallbacks(proxyTimeoutRunnable)
        releaseAllInputsSync()
        val adapter = bluetoothAdapter
        val proxy = hidDeviceProxy
        if (adapter != null && proxy != null) {
            adapter.closeProfileProxy(BluetoothProfile.HID_DEVICE, proxy)
        }
        hidDeviceProxy = null
        reportExecutor.shutdownNow()
        callbackExecutor.shutdownNow()
    }
}
