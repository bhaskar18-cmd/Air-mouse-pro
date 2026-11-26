package com.bluemouse.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(BluetoothHIDPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
