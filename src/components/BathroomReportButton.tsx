import React, { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { ReportModal } from './ReportModal';

interface Bathroom {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isAccessible: boolean;
  hasChangingTables: boolean;
  requiresKey: boolean;
}

export const BathroomReportButton: React.FC<{
  bathroom: Bathroom;
}> = ({ bathroom }) => {
  const [isReportModalVisible, setReportModalVisible] = useState(false);

  const handleReport = async (issue: {
    type: string;
    details: string;
  }) => {
    // TODO: Implement report submission
    console.log('Reporting issue:', issue);
    setReportModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity onPress={() => setReportModalVisible(true)}>
        <Text>Report Issue</Text>
      </TouchableOpacity>

      <ReportModal 
        visible={isReportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onSubmit={handleReport}
        bathroomDetails={bathroom}
      />
    </>
  );
}; 