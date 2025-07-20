import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.0d45f270b6d947cb8b142e046a055325',
  appName: 'moviemania-unfold',
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