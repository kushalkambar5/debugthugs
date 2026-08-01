import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  initialize,
  getSdkStatus,
  requestPermission,
  readRecords,
  insertRecords,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

// Permissions list mapping to the 14 data types requested
const PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'write', recordType: 'Steps' },
  { accessType: 'read', recordType: 'Distance' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'TotalCaloriesBurned' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'Weight' },
  { accessType: 'write', recordType: 'Weight' },
  { accessType: 'read', recordType: 'Height' },
  { accessType: 'read', recordType: 'Hydration' },
  { accessType: 'read', recordType: 'Nutrition' },
  { accessType: 'read', recordType: 'MenstruationFlow' },
  { accessType: 'read', recordType: 'OvulationTest' },
  { accessType: 'read', recordType: 'BloodGlucose' },
  { accessType: 'read', recordType: 'BloodPressure' },
] as const;

function App() {
  const [sdkStatus, setSdkStatus] = useState<string>('Checking...');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [fetchedData, setFetchedData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  const get7DaysAgoRange = () => {
    const endTime = new Date();
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - 7);
    return {
      operator: 'between' as const,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    };
  };

  const checkSdkAndInit = async () => {
    try {
      const status = await getSdkStatus();
      let statusStr = 'Unknown';
      if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
        statusStr = 'AVAILABLE';
      } else if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
        statusStr = 'UNAVAILABLE';
      } else if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
        statusStr = 'PROVIDER UPDATE REQUIRED';
      }

      setSdkStatus(statusStr);
      addLog(`SDK Status: ${statusStr}`);

      if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
        const initResult = await initialize();
        setIsInitialized(initResult);
        addLog(`Health Connect client initialized: ${initResult}`);
      } else {
        addLog('Health Connect SDK is not available on this device.');
      }
    } catch (error: any) {
      addLog(`SDK Init Error: ${error.message}`);
    }
  };

  const requestHealthPermissions = async () => {
    try {
      addLog('Requesting health permissions...');
      const granted = await requestPermission(PERMISSIONS as any);
      addLog(`Permissions granted list: ${JSON.stringify(granted)}`);
      Alert.alert('Permissions Checked', 'Check logs for details on granted permissions.');
    } catch (error: any) {
      addLog(`Permission Error: ${error.message}`);
      Alert.alert('Permission Error', error.message);
    }
  };

  const writeSampleSteps = async () => {
    try {
      const startTime = new Date();
      startTime.setMinutes(startTime.getMinutes() - 30);
      const endTime = new Date();
      const result = await insertRecords([
        {
          recordType: 'Steps',
          count: 2500,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      ]);
      addLog(`Steps inserted successfully: ${JSON.stringify(result)}`);
      Alert.alert('Success', '2500 steps inserted!');
    } catch (error: any) {
      addLog(`Error inserting steps: ${error.message}`);
      Alert.alert('Insert Error', error.message);
    }
  };

  const writeSampleWeight = async () => {
    try {
      const result = await insertRecords([
        {
          recordType: 'Weight',
          weight: { value: 76.2, unit: 'kilograms' },
          time: new Date().toISOString(),
        },
      ]);
      addLog(`Weight inserted successfully: ${JSON.stringify(result)}`);
      Alert.alert('Success', 'Weight (76.2 kg) inserted!');
    } catch (error: any) {
      addLog(`Error inserting weight: ${error.message}`);
      Alert.alert('Insert Error', error.message);
    }
  };

  const safeReadRecords = async (
    recordType: any,
    startTime: Date,
    endTime: Date,
    depth = 0
  ): Promise<any[]> => {
    if (depth > 6) {
      addLog(`Skipping corrupted interval for ${recordType}: ${startTime.toISOString()} to ${endTime.toISOString()}`);
      return [];
    }

    try {
      const res = await readRecords(recordType, {
        timeRangeFilter: {
          operator: 'between',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      });
      return res.records;
    } catch (err: any) {
      const errMsg = err.message || '';
      if (
        errMsg.includes('startTime must be before endTime') ||
        (errMsg.includes('startTime') && errMsg.includes('endTime'))
      ) {
        const startMs = startTime.getTime();
        const endMs = endTime.getTime();

        if (endMs - startMs <= 1000) {
          addLog(`Skipping corrupted sub-second record for ${recordType} at ${startTime.toISOString()}`);
          return [];
        }

        const midMs = Math.floor((startMs + endMs) / 2);
        const midDate = new Date(midMs);

        const leftRecords = await safeReadRecords(recordType, startTime, midDate, depth + 1);
        const rightRecords = await safeReadRecords(recordType, midDate, endTime, depth + 1);

        return [...leftRecords, ...rightRecords];
      } else {
        throw err;
      }
    }
  };

  const fetchHealthData = async () => {
    if (!isInitialized) {
      Alert.alert('Not Initialized', 'Please initialize the client first.');
      return;
    }
    setIsLoading(true);
    addLog('Fetching last 7 days of health data...');
    const data: Record<string, any> = {};
    const range = get7DaysAgoRange();
    const startTime = new Date(range.startTime);
    const endTime = new Date(range.endTime);

    const recordTypesToRead = [
      'Steps',
      'Distance',
      'ActiveCaloriesBurned',
      'TotalCaloriesBurned',
      'HeartRate',
      'SleepSession',
      'Weight',
      'Height',
      'Hydration',
      'BloodGlucose',
      'BloodPressure',
      'Nutrition',
      'MenstruationFlow',
      'OvulationTest',
    ] as const;

    for (const type of recordTypesToRead) {
      try {
        const records = await safeReadRecords(type, startTime, endTime);
        data[type] = records;
        addLog(`Successfully read ${records.length} records for ${type}`);
      } catch (err: any) {
        data[type] = { error: err.message };
        addLog(`Error reading ${type}: ${err.message}`);
      }
    }

    setFetchedData(data);
    setIsLoading(false);
  };

  useEffect(() => {
    checkSdkAndInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Health Connect App</Text>
        <Text style={styles.headerSub}>Unified Health & Fitness Data Viewer</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Connection status section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status</Text>
          <View style={styles.row}>
            <Text style={styles.label}>SDK Status:</Text>
            <Text style={[styles.value, sdkStatus === 'AVAILABLE' ? styles.statusOk : styles.statusErr]}>
              {sdkStatus}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Client Init:</Text>
            <Text style={[styles.value, isInitialized ? styles.statusOk : styles.statusErr]}>
              {isInitialized ? 'Yes' : 'No'}
            </Text>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.buttonSecondary} onPress={checkSdkAndInit}>
              <Text style={styles.buttonText}>Refresh Status</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonPrimary} onPress={requestHealthPermissions}>
              <Text style={styles.buttonText}>Request Permissions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Write sample data section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Write Sample Data (Testing)</Text>
          <Text style={styles.cardSub}>Insert mock values to see reading functionality in action</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.buttonGreen} onPress={writeSampleSteps}>
              <Text style={styles.buttonText}>Write Steps (2500)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonGreen} onPress={writeSampleWeight}>
              <Text style={styles.buttonText}>Write Weight (76.2 kg)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fetch data actions */}
        <TouchableOpacity style={styles.buttonFetch} onPress={fetchHealthData} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonFetchText}>Fetch Last 7 Days Data</Text>
          )}
        </TouchableOpacity>

        {/* Display Fetched Data */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fetched Health Records</Text>
          {Object.keys(fetchedData).length === 0 ? (
            <Text style={styles.noDataText}>No data fetched yet. Tap "Fetch Last 7 Days Data" above.</Text>
          ) : (
            Object.entries(fetchedData).map(([type, records]) => {
              const isError = records && typeof records === 'object' && 'error' in records;
              const hasData = Array.isArray(records) && records.length > 0;
              return (
                <View key={type} style={styles.recordGroup}>
                  <Text style={styles.recordTypeHeader}>
                    {type} {hasData ? `(${records.length} items)` : ''}
                  </Text>
                  {isError ? (
                    <Text style={styles.errorText}>Permission denied or reading failed: {records.error}</Text>
                  ) : hasData ? (
                    <ScrollView horizontal style={styles.recordsScroll}>
                      <View style={styles.recordsContainer}>
                        <Text style={styles.jsonText}>{JSON.stringify(records, null, 2)}</Text>
                      </View>
                    </ScrollView>
                  ) : (
                    <Text style={styles.noRecordsText}>No records found for this period.</Text>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Log Viewer */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Console Logs</Text>
          <View style={styles.logContainer}>
            {logs.length === 0 ? (
              <Text style={styles.logText}>No logs generated.</Text>
            ) : (
              logs.map((log, index) => (
                <Text key={index} style={styles.logText}>
                  {log}
                </Text>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2b2b2b',
    backgroundColor: '#1a1a1a',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSub: {
    color: '#a0a0a0',
    fontSize: 12,
    marginTop: 4,
  },
  scrollContent: {
    padding: 12,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2b2b2b',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardSub: {
    color: '#a0a0a0',
    fontSize: 12,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    color: '#cccccc',
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusOk: {
    color: '#4caf50',
  },
  statusErr: {
    color: '#f44336',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: '#2196f3',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: '#424242',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonGreen: {
    flex: 1,
    backgroundColor: '#2e7d32',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  buttonFetch: {
    backgroundColor: '#6200ee',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonFetchText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noDataText: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 12,
  },
  recordGroup: {
    borderBottomWidth: 1,
    borderBottomColor: '#2b2b2b',
    paddingVertical: 10,
  },
  recordTypeHeader: {
    color: '#2196f3',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recordsScroll: {
    maxHeight: 180,
  },
  recordsContainer: {
    backgroundColor: '#222222',
    padding: 8,
    borderRadius: 4,
  },
  jsonText: {
    color: '#00e676',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  errorText: {
    color: '#ff5252',
    fontSize: 12,
  },
  noRecordsText: {
    color: '#777777',
    fontSize: 12,
  },
  logContainer: {
    backgroundColor: '#000000',
    padding: 8,
    borderRadius: 4,
    maxHeight: 200,
  },
  logText: {
    color: '#00ff00',
    fontFamily: 'monospace',
    fontSize: 11,
    marginBottom: 2,
  },
});

export default App;
