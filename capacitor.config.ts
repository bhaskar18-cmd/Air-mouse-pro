import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bluemouse.app',
  appName: 'BlueMouse',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#111318',
  },
  plugins: {
    Haptics: {
      enabled: true,
    },
  },
};

export default config;
