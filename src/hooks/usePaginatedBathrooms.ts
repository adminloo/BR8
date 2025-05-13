import { useState, useCallback } from 'react';
import { GeoFirestore } from 'geofirestore';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { firebase } from '../services/firebase';

const geoFirestore = new GeoFirestore(firebase.firestore());
const bathroomsCollection = geoFirestore.collection('bathrooms');

export function usePaginatedBathrooms(options: {
  location: Location;
  radius?: number;
  pageSize?: number;
}) {
  const [bathrooms, setBathrooms] = useState<Bathroom[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    try {
      const query = bathroomsCollection
        .near({
          center: new firebase.firestore.GeoPoint(
            options.location.latitude,
            options.location.longitude
          ),
          radius: options.radius || 2
        })
        .limit(options.pageSize || 20);

      if (lastDoc) {
        query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      const newBathrooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setBathrooms(prev => [...prev, ...newBathrooms]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === (options.pageSize || 20));
    } catch (error) {
      console.error('Error loading more bathrooms:', error);
    } finally {
      setIsLoading(false);
    }
  }, [options.location, options.radius, options.pageSize, lastDoc, hasMore]);

  return {
    bathrooms,
    isLoading,
    hasMore,
    loadMore
  };
} 