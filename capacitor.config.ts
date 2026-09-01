import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'online.eidoslanguage.app',
  appName: 'Eidos Language OS',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'app.eidoslanguage.online',
  },
  android: {
    backgroundColor: '#f5f5f4',
  },
};

export default config;
