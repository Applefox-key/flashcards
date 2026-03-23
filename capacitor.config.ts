import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.flashminds.app',
  appName: 'FlashMinds',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
