import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { IMAGES } from '../constants/images';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Create animated values for logo animation
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const textFadeAnim = React.useRef(new Animated.Value(0)).current;
  const versionFadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.sequence([
      // Fade in and scale up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Start pulsing animation and fade in text
      Animated.parallel([
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(versionFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Create a continuous pulsing effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Set timeout to end the splash screen after 3 seconds
    const timer = setTimeout(() => {
      // Fade out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(versionFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Call the onFinish callback when animations complete
        onFinish();
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, pulseAnim, textFadeAnim, versionFadeAnim, onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Animated.Image
        source={IMAGES.logo}
        style={[
          styles.logo,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { scale: pulseAnim }
            ],
          },
        ]}
        resizeMode="contain"
      />
      <Animated.Text 
        style={[
          styles.loadingText,
          { opacity: textFadeAnim }
        ]}
      >
        Finding restrooms near you...
      </Animated.Text>
      <Animated.Text
        style={[
          styles.versionText,
          { opacity: versionFadeAnim }
        ]}
      >
        Version {Constants.expoConfig?.version || '1.0.0'}
      </Animated.Text>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.7,
    height: width * 0.7,
    marginBottom: 40,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
    marginTop: 20,
    opacity: 0.8,
  },
  versionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.6,
    position: 'absolute',
    bottom: 40,
  }
}); 