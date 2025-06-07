import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IconSymbol } from '../../components/ui/IconSymbol';

interface Props {
  isAccessible: boolean;
  hasChangingTables: boolean;
  requiresKey: boolean;
}

export const AccessTypeInfo: React.FC<Props> = ({
  isAccessible,
  hasChangingTables,
  requiresKey,
}) => {
  return (
    <View style={styles.container}>
      {isAccessible && (
        <View style={styles.item}>
          <IconSymbol name="figure.roll" size={24} color="#007AFF" />
          <Text style={styles.text}>Wheelchair Accessible</Text>
        </View>
      )}
      {hasChangingTables && (
        <View style={styles.item}>
          <IconSymbol name="figure.and.child.holdinghands" size={24} color="#007AFF" />
          <Text style={styles.text}>Changing Tables</Text>
        </View>
      )}
      {requiresKey && (
        <View style={styles.item}>
          <Ionicons name="key" size={24} color="#007AFF" />
          <Text style={styles.text}>Requires Key/Code</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  text: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
}); 