import React, { useRef } from 'react';
import { 
  TouchableWithoutFeedback, 
  Animated, 
  StyleSheet, 
  Text 
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface AddButtonProps {
  onPress: () => void;
  label: string;
}

export const AddButton: React.FC<AddButtonProps> = ({ onPress, label }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 100,
      friction: 5
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 5
    }).start();
  };

  return (
    <TouchableWithoutFeedback 
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View 
        style={[
          styles.button,
          {
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Text style={styles.text}>{label}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 24,
    height: 50,
    minWidth: 160,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
}); 