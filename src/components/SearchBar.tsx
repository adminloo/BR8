import React, { useEffect, useRef } from 'react';
import { 
  TextInput, 
  View, 
  StyleSheet, 
  Animated, 
  TouchableWithoutFeedback,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder, 
  value, 
  onChangeText 
}) => {
  const focusAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const handleFocus = () => {
    Animated.spring(focusAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleBlur = () => {
    Animated.spring(focusAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start();
  };

  return (
    <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{
              scale: focusAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.02]
              })
            }],
            shadowOpacity: focusAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.2]
            })
          }
        ]}
      >
        <Ionicons name="search" size={20} color="#666" style={styles.icon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor="#999"
          returnKeyType="search"
        />
        {value.length > 0 && (
          <TouchableWithoutFeedback 
            onPress={() => {
              onChangeText('');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </View>
          </TouchableWithoutFeedback>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44, // Apple's minimum touch target
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 4,
    elevation: 5,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  }
}); 