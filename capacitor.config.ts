import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bluemouse.app',
  appName: 'BlueMouse',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#050914',
  },
  plugins: {
    Haptics: {
      enabled: true,
    },
  },
};

export default config;
