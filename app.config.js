import 'dotenv/config';

export default {
  expo: {
    name: "BR5",
    slug: "BR5",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    scheme: "br5",
    splash: {
      image: "./assets/LooLogoStart.png",
      resizeMode: "contain",
      backgroundColor: "#000000"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.loo1.br8",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "We need your location to find bathrooms near you",
        NSLocationAlwaysAndWhenInUseUsageDescription: "We need your location to find bathrooms near you and provide updates about nearby facilities",
        NSLocationAlwaysUsageDescription: "We need your location to find bathrooms near you and provide updates about nearby facilities",
        UIBackgroundModes: [
          "location"
        ]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      permissions: [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION"
      ],
      package: "com.loo1.br8"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          image: "./assets/LooLogoStart.png",
          resizeMode: "contain",
          backgroundColor: "#000000"
        }
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission: "$(PRODUCT_NAME) needs access to your location to find nearby bathrooms.",
          locationAlwaysAndWhenInUsePermission: "$(PRODUCT_NAME) needs access to your location to find nearby bathrooms.",
          locationAlwaysPermission: "$(PRODUCT_NAME) needs access to your location to find nearby bathrooms.",
          isIosBackgroundLocationEnabled: true
        }
      ]
    ],
    extra: {
      env: {
        FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
        FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
        FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
        FIREBASE_IOS_APP_ID: process.env.FIREBASE_IOS_APP_ID,
        FIREBASE_ANDROID_APP_ID: process.env.FIREBASE_ANDROID_APP_ID,
        FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
        ENVIRONMENT: process.env.ENVIRONMENT,
        FIRESTORE_EMULATOR_HOST: "10.0.0.99:9199",
        FIREBASE_EMULATOR_HOST: "10.0.0.99",
        FIREBASE_AUTH_EMULATOR_HOST: "10.0.0.99:9099"
      },
      eas: {
        projectId: "2bedda58-809d-4d93-acf4-243bc7b7f4b4"
      }
    }
  }
}; 