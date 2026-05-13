import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jornadaplus.app',
  appName: 'Jornada+',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
  }
};

export default config;
