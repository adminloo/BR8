import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  isVerified: boolean;
}

export const VerificationBadge: React.FC<Props> = ({ isVerified }) => {
  return (
    <View style={styles.container}>
      <Ionicons
        name={isVerified ? "checkmark-circle" : "alert-circle"}
        size={20}
        color={isVerified ? "#4CAF50" : "#FFC107"}
      />
      <Text style={styles.text}>
        {isVerified ? "Verified Location" : "Unverified"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
  },
  text: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
}); 