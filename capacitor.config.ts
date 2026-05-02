import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jornadaplus.app',
  appName: 'Jornada+',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
