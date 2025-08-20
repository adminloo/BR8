import Constants from 'expo-constants';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { approvePendingBathroom, rejectPendingBathroom } from '../services/firebase';

interface PendingBathroom {
  id: string;
  name: string;
  description?: string;
  address?: string;
  latitude: number;
  longitude: number;
  cityId?: string;
  status: string;
  createdAt: any;
}

export default function DebugConfigScreen() {
  const env = Constants.expoConfig?.extra?.env || {};
  const [pendingBathrooms, setPendingBathrooms] = useState<PendingBathroom[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadPendingBathrooms = async () => {
    try {
      setIsLoading(true);
      const db = getFirestore();
      const pendingRef = collection(db, 'pendingBathrooms');
      const q = query(pendingRef, where('status', '==', 'PENDING'));
      const snapshot = await getDocs(q);
      
      const pending = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PendingBathroom[];
      
      setPendingBathrooms(pending);
    } catch (error) {
      console.error('Error loading pending bathrooms:', error);
      Alert.alert('Error', 'Failed to load pending bathrooms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (pendingId: string) => {
    try {
      await approvePendingBathroom(pendingId);
      Alert.alert('Success', 'Bathroom approved successfully!');
      loadPendingBathrooms(); // Reload the list
    } catch (error) {
      console.error('Error approving bathroom:', error);
      Alert.alert('Error', 'Failed to approve bathroom');
    }
  };

  const handleReject = async (pendingId: string) => {
    Alert.prompt(
      'Reject Bathroom',
      'Enter a reason for rejection (optional):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason) => {
            try {
              await rejectPendingBathroom(pendingId, reason);
              Alert.alert('Success', 'Bathroom rejected successfully!');
              loadPendingBathrooms(); // Reload the list
            } catch (error) {
              console.error('Error rejecting bathroom:', error);
              Alert.alert('Error', 'Failed to reject bathroom');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    loadPendingBathrooms();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Firebase Config & Env</Text>
      <Text selectable style={styles.code}>
        {JSON.stringify(env, null, 2)}
      </Text>
      
      <Text style={styles.title}>Platform</Text>
      <Text>{Platform.OS}</Text>

      <Text style={styles.title}>Pending Bathrooms ({pendingBathrooms.length})</Text>
      <TouchableOpacity 
        style={styles.refreshButton} 
        onPress={loadPendingBathrooms}
        disabled={isLoading}
      >
        <Text style={styles.refreshButtonText}>
          {isLoading ? 'Loading...' : 'Refresh'}
        </Text>
      </TouchableOpacity>

      {pendingBathrooms.map((bathroom) => (
        <View key={bathroom.id} style={styles.pendingItem}>
          <Text style={styles.bathroomName}>{bathroom.name}</Text>
          <Text style={styles.bathroomDetails}>
            ID: {bathroom.id} | City: {bathroom.cityId || 'Unknown'}
          </Text>
          <Text style={styles.bathroomDetails}>
            Lat: {bathroom.latitude.toFixed(4)}, Lng: {bathroom.longitude.toFixed(4)}
          </Text>
          {bathroom.description && (
            <Text style={styles.bathroomDescription}>{bathroom.description}</Text>
          )}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.approveButton}
              onPress={() => handleApprove(bathroom.id)}
            >
              <Text style={styles.approveButtonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.rejectButton}
              onPress={() => handleReject(bathroom.id)}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {pendingBathrooms.length === 0 && !isLoading && (
        <Text style={styles.noPending}>No pending bathrooms found</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontWeight: 'bold', fontSize: 18, marginTop: 20, marginBottom: 10 },
  code: { fontFamily: 'monospace', backgroundColor: '#eee', padding: 10, marginTop: 10 },
  refreshButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  pendingItem: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  bathroomName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bathroomDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  bathroomDescription: {
    fontSize: 14,
    color: '#333',
    marginTop: 5,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 5,
  },
  approveButton: {
    backgroundColor: '#34C759',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginRight: 5,
    flex: 1,
  },
  approveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 5,
    marginLeft: 5,
    flex: 1,
  },
  rejectButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  noPending: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
}); 