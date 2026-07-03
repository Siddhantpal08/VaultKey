import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

type QRScanScreenProps = StackScreenProps<RootStackParamList, 'QRScan'>;

export default function QRScanScreen({ navigation }: QRScanScreenProps): React.JSX.Element {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    void getCameraPermissions();
  }, []);

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    // otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example
    if (data.startsWith('otpauth://')) {
      try {
        const url = new URL(data);
        const secret = url.searchParams.get('secret');
        if (secret) {
          navigation.navigate('AddPassword', {
            prefillTotpSecret: secret,
            prefillUrl: url.searchParams.get('issuer') || '',
          });
          return;
        }
      } catch (e) {
        // Invalid URL
      }
    }
    
    Alert.alert('Invalid QR Code', 'This QR code does not contain a valid TOTP secret.', [
      { text: 'OK', onPress: () => setScanned(false) }
    ]);
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text style={styles.text}>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text style={styles.text}>No access to camera</Text></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
          <Ionicons name="close" size={28} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Scan QR Code</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.cameraContainer}>
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.overlay}>
          <View style={styles.scanBox} />
          <Text style={styles.helperText}>Point at a 2FA QR Code</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  text: { color: Colors.textPrimary, fontSize: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backRow: { padding: 4 },
  title: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  cameraContainer: { flex: 1, position: 'relative' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: Colors.accent,
    backgroundColor: 'transparent',
    borderRadius: 24,
  },
  helperText: {
    color: '#fff',
    marginTop: 24,
    fontSize: 16,
    fontWeight: '600',
  }
});
