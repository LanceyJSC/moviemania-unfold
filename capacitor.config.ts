
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lancey.sceneburn',
  appName: 'SceneBurn',
  webDir: 'dist',
  server: {
    url: 'https://0d45f270-b6d9-47cb-8b14-2e046a055325.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false
    }
  }
};

export default config;
