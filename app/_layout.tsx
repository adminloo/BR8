import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SplashScreen as CustomSplash } from '../src/screens/SplashScreen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

export default function Layout() {
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const [nativeSplashHidden, setNativeSplashHidden] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Ensure native splash screen is visible
        await SplashScreen.preventAutoHideAsync();
        
        // Hide native splash after a short delay to show our custom splash
        setTimeout(async () => {
          try {
            await SplashScreen.hideAsync();
            setNativeSplashHidden(true);
          } catch (e) {
            console.warn('Error hiding native splash:', e);
            // Even if there's an error, we should proceed
            setNativeSplashHidden(true);
          }
        }, 500); // Short delay to ensure smooth transition
      } catch (e) {
        console.warn('Error handling native splash:', e);
        // Even if there's an error, we should proceed
        setNativeSplashHidden(true);
      }
    };

    initApp();
  }, []);

  // Don't show anything until we've hidden the native splash
  if (!nativeSplashHidden) {
    return null;
  }

  // Show our custom splash screen while data is loading
  if (showCustomSplash) {
    return <CustomSplash onFinish={() => setShowCustomSplash(false)} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Loo',
            headerTransparent: true,
            headerBlurEffect: 'light',
            headerStyle: {
              backgroundColor: '#007AFF',
            },
            headerTitleStyle: {
              color: '#fff',
              fontSize: 20,
              fontWeight: '600',
            },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="add-bathroom"
          options={{
            title: 'Add Bathroom',
            presentation: 'modal'
          }}
        />
        <Stack.Screen
          name="bathroom-details"
          options={{
            title: 'Details',
            presentation: 'card'
          }}
        />
        <Stack.Screen
          name="select-location"
          options={{
            title: 'Select Location',
            presentation: 'modal'
          }}
        />
      </Stack>
    </View>
  );
}
