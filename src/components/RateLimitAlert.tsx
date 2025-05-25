import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface RateLimitAlertProps {
  message: string;
  remainingTime?: number;
}

export const RateLimitAlert: React.FC<RateLimitAlertProps> = ({ message, remainingTime }) => {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {remainingTime && (
        <Text style={styles.timer}>
          Please wait {Math.ceil(remainingTime)} seconds before trying again
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffebee',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef5350'
  },
  message: {
    color: '#c62828',
    fontSize: 16,
    fontWeight: '500'
  },
  timer: {
    color: '#c62828',
    fontSize: 14,
    marginTop: 4
  }
}); 