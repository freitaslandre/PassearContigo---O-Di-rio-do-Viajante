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
    },
    Camera: {
      // Plugin Camera para captura de fotos/vídeos
      permissions: ['camera', 'photos']
    },
    Geolocation: {
      // Plugin Geolocation para obter localização do dispositivo
      permissions: ['location']
    }
  }
};

export default config;
