import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.passearcontigo.app',
  appName: 'PassearContigo',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    CapacitorHttp: {
      enabled: true
    },
    ScreenOrientation: {
      // Plugin será gerenciado via código (veja screen-orientation.service.ts)
    }
  }
};

export default config;
