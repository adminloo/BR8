import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Report {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
}

interface Props {
  reports: Report[];
}

export const LastReportsSection: React.FC<Props> = ({ reports }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="alert-circle" size={24} color="#007AFF" />
        <Text style={styles.title}>Recent Reports</Text>
      </View>
      {reports.length === 0 ? (
        <Text style={styles.noReports}>No recent reports</Text>
      ) : (
        reports.map((report) => (
          <View key={report.id} style={styles.reportItem}>
            <Text style={styles.reportType}>{report.type}</Text>
            <Text style={styles.reportDescription}>{report.description}</Text>
            <Text style={styles.timestamp}>
              {report.timestamp.toLocaleDateString()}
            </Text>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  noReports: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  reportItem: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  reportType: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
}); 