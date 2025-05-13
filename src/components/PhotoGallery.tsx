import React from 'react';
import { View, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  photos: string[];
  onAddPhoto?: () => void;
}

export const PhotoGallery: React.FC<Props> = ({ photos, onAddPhoto }) => {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {photos.map((photo, index) => (
          <Image
            key={index}
            source={{ uri: photo }}
            style={styles.photo}
          />
        ))}
        {onAddPhoto && (
          <TouchableOpacity style={styles.addButton} onPress={onAddPhoto}>
            <Ionicons name="add-circle" size={32} color="#007AFF" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  photo: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginRight: 8,
  },
  addButton: {
    width: 200,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
}); 