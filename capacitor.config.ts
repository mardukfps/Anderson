import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jornadaplus.app',
  appName: 'Hora Certa',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
  }
};

export default config;
