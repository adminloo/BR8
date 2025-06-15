import Constants from 'expo-constants';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';

export default function DebugConfigScreen() {
  const env = Constants.expoConfig?.extra?.env || {};
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Firebase Config & Env</Text>
      <Text selectable style={styles.code}>
        {JSON.stringify(env, null, 2)}
      </Text>
      <Text style={styles.title}>Platform</Text>
      <Text>{Platform.OS}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontWeight: 'bold', fontSize: 18, marginTop: 20 },
  code: { fontFamily: 'monospace', backgroundColor: '#eee', padding: 10, marginTop: 10 }
}); 