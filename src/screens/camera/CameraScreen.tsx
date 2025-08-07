import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Layout,
  Text,
  Button,
  Icon,
  IconProps,
  Card,
  List,
  ListItem,
  Spinner,
  Modal,
  TopNavigation,
  TopNavigationAction,
} from '@ui-kitten/components';
import { Camera, CameraType, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// Services and utilities
import apiService from '../../services/apiService';
import i18n from '../../i18n';
import { MedGuardColors } from '../../theme/colors';
import { Spacing } from '../../theme/typography';

// Types
interface PrescriptionOCRResult {
  prescriptionNumber: string;
  doctorName: string;
  patientName: string;
  medications: Array<{
    name: string;
    strength: string;
    dosage: string;
    frequency: string;
    quantity: string;
    instructions: string;
    confidence: number;
  }>;
  icd10Codes: string[];
  confidence: number;
  processingTime: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Icon components
const CameraIcon = (props: IconProps) => <Icon {...props} name='camera-outline' />;
const FlipIcon = (props: IconProps) => <Icon {...props} name='flip-2-outline' />;
const FlashIcon = (props: IconProps) => <Icon {...props} name='flash-outline' />;
const FlashOffIcon = (props: IconProps) => <Icon {...props} name='flash-off-outline' />;
const GalleryIcon = (props: IconProps) => <Icon {...props} name='image-outline' />;
const CloseIcon = (props: IconProps) => <Icon {...props} name='close-outline' />;
const CheckIcon = (props: IconProps) => <Icon {...props} name='checkmark-outline' />;
const BackIcon = (props: IconProps) => <Icon {...props} name='arrow-back-outline' />;

const CameraScreen: React.FC = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [flashMode, setFlashMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<PrescriptionOCRResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          i18n.t('camera.permission_required'),
          i18n.t('camera.permission_required'),
          [
            { text: i18n.t('common.cancel'), onPress: () => navigation.goBack() },
            { text: i18n.t('camera.grant_permission'), onPress: requestCameraPermission },
          ]
        );
      }
    } catch (error) {
      console.error('Request camera permission error:', error);
      setHasPermission(false);
    }
  };

  const takePicture = async () => {
    try {
      if (!cameraRef.current) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      setCapturedImage(photo.uri);
      await processImage(photo.uri);
    } catch (error) {
      console.error('Take picture error:', error);
      Alert.alert(
        i18n.t('common.error'),
        i18n.t('camera.scan_error')
      );
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          i18n.t('common.error'),
          'Gallery permission required'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setCapturedImage(imageUri);
        await processImage(imageUri);
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert(
        i18n.t('common.error'),
        i18n.t('camera.scan_error')
      );
    }
  };

  const processImage = async (imageUri: string) => {
    try {
      setIsProcessing(true);
      
      // Compress image if too large
      const imageInfo = await FileSystem.getInfoAsync(imageUri);
      let processedImageUri = imageUri;
      
      if (imageInfo.exists && imageInfo.size > 5 * 1024 * 1024) {
        // Image is larger than 5MB, compress it
        const compressedImage = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.6,
        });
        
        if (!compressedImage.canceled && compressedImage.assets[0]) {
          processedImageUri = compressedImage.assets[0].uri;
        }
      }

      // Process OCR
      const result = await apiService.processPrescriptionOCR(processedImageUri);
      setOcrResult(result);
      setShowResults(true);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Process image error:', error);
      Alert.alert(
        i18n.t('camera.scan_error'),
        (error as Error)?.message || i18n.t('errors.unknown_error'),
        [
          { text: i18n.t('camera.retry_scan'), onPress: retryScan },
          { text: i18n.t('camera.manual_entry'), onPress: navigateToManualEntry },
        ]
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsProcessing(false);
    }
  };

  const retryScan = () => {
    setCapturedImage(null);
    setOcrResult(null);
    setShowResults(false);
  };

  const navigateToManualEntry = () => {
    navigation.navigate('Medications', {
      screen: 'AddMedication',
    });
  };

  const addMedicationsToList = () => {
    if (!ocrResult) return;

    navigation.navigate('Medications', {
      screen: 'AddMedication',
      params: { ocrResult },
    });
  };

  const toggleCameraType = () => {
    setCameraType(current =>
      current === 'back' ? 'front' : 'back'
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleFlash = () => {
    setFlashMode(current => !current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderCameraOverlay = () => (
    <View style={styles.cameraOverlay}>
      {/* Top controls */}
      <View style={[styles.topControls, { paddingTop: insets.top }]}>
        <TopNavigationAction
          icon={BackIcon}
          onPress={() => navigation.goBack()}
          style={styles.overlayButton}
        />
        <Text category="h6" style={styles.instructionText}>
          {i18n.t('camera.scan_instruction')}
        </Text>
        <TopNavigationAction
          icon={flashMode ? FlashIcon : FlashOffIcon}
          onPress={toggleFlash}
          style={styles.overlayButton}
        />
      </View>

      {/* Scanning area indicator */}
      <View style={styles.scanningArea}>
        <View style={styles.scanningFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={pickImageFromGallery}
        >
          <Icon
            name="image-outline"
            style={styles.controlIcon}
            fill={MedGuardColors.primary.cleanWhite}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.captureButton}
          onPress={takePicture}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Spinner size="large" status="control" />
          ) : (
            <Icon
              name="camera"
              style={styles.captureIcon}
              fill={MedGuardColors.primary.cleanWhite}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleCameraType}
        >
          <Icon
            name="flip-2-outline"
            style={styles.controlIcon}
            fill={MedGuardColors.primary.cleanWhite}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProcessingOverlay = () => (
    <Modal
      visible={isProcessing && !showResults}
      backdropStyle={styles.backdrop}
    >
      <Card disabled={true} style={styles.processingModal}>
        <View style={styles.processingContent}>
          <Spinner size="giant" />
          <Text category="h6" style={styles.processingText}>
            {i18n.t('camera.processing')}
          </Text>
          <Text category="s1" appearance="hint" style={styles.processingHint}>
            {i18n.t('camera.scan_instruction')}
          </Text>
        </View>
      </Card>
    </Modal>
  );

  const renderResultsModal = () => (
    <Modal
      visible={showResults}
      backdropStyle={styles.backdrop}
      onBackdropPress={() => setShowResults(false)}
    >
      <Card disabled={true} style={styles.resultsModal}>
        <View style={styles.resultsHeader}>
          <Text category="h5">{i18n.t('camera.scan_complete')}</Text>
          <Button
            appearance="ghost"
            accessoryLeft={CloseIcon}
            onPress={() => setShowResults(false)}
          />
        </View>

        {ocrResult && (
          <View style={styles.resultsContent}>
            {/* Prescription Details */}
            <Card style={styles.prescriptionCard}>
              <Text category="h6" style={styles.sectionTitle}>
                {i18n.t('camera.prescription_details')}
              </Text>
              
              {ocrResult.prescriptionNumber && (
                <View style={styles.detailRow}>
                  <Text category="s2">{i18n.t('camera.prescription_number')}:</Text>
                  <Text category="s1">{ocrResult.prescriptionNumber}</Text>
                </View>
              )}
              
              {ocrResult.doctorName && (
                <View style={styles.detailRow}>
                  <Text category="s2">{i18n.t('camera.doctor_name')}:</Text>
                  <Text category="s1">{ocrResult.doctorName}</Text>
                </View>
              )}
              
              {ocrResult.patientName && (
                <View style={styles.detailRow}>
                  <Text category="s2">{i18n.t('camera.patient_name')}:</Text>
                  <Text category="s1">{ocrResult.patientName}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text category="s2">{i18n.t('camera.confidence_level')}:</Text>
                <Text 
                  category="s1" 
                  style={{ 
                    color: ocrResult.confidence > 0.8 
                      ? MedGuardColors.alerts.successGreen 
                      : MedGuardColors.alerts.warningAmber 
                  }}
                >
                  {Math.round(ocrResult.confidence * 100)}%
                </Text>
              </View>
            </Card>

            {/* Medications Found */}
            <Card style={styles.medicationsCard}>
              <Text category="h6" style={styles.sectionTitle}>
                {i18n.t('camera.medications_found')} ({ocrResult.medications.length})
              </Text>
              
              <List
                data={ocrResult.medications}
                renderItem={({ item, index }) => (
                  <ListItem
                    title={item.name}
                    description={`${item.strength} - ${item.frequency}\n${item.instructions}`}
                    accessoryRight={() => (
                      <View style={styles.medicationMeta}>
                        <Text 
                          category="caption1"
                          style={{
                            color: item.confidence > 0.8
                              ? MedGuardColors.alerts.successGreen
                              : MedGuardColors.alerts.warningAmber
                          }}
                        >
                          {Math.round(item.confidence * 100)}%
                        </Text>
                      </View>
                    )}
                    style={styles.medicationItem}
                  />
                )}
                keyExtractor={(item, index) => index.toString()}
              />
            </Card>

            {/* Review Warning */}
            <Card style={styles.warningCard} status="warning">
              <Text category="s1" style={styles.warningText}>
                {i18n.t('camera.review_before_adding')}
              </Text>
            </Card>

            {/* Actions */}
            <View style={styles.resultsActions}>
              <Button
                style={styles.actionButton}
                accessoryLeft={CheckIcon}
                onPress={addMedicationsToList}
              >
                {i18n.t('camera.add_to_medications')}
              </Button>
              
              <Button
                style={styles.actionButton}
                appearance="outline"
                onPress={retryScan}
              >
                {i18n.t('camera.retry_scan')}
              </Button>
            </View>
          </View>
        )}
      </Card>
    </Modal>
  );

  if (hasPermission === null) {
    return (
      <Layout style={styles.container}>
        <View style={styles.centerContent}>
          <Spinner size="large" />
          <Text category="s1" style={styles.loadingText}>
            {i18n.t('common.loading')}
          </Text>
        </View>
      </Layout>
    );
  }

  if (hasPermission === false) {
    return (
      <Layout style={styles.container}>
        <View style={styles.centerContent}>
          <Icon
            name="camera-off-outline"
            style={styles.errorIcon}
            fill={MedGuardColors.extended.mediumGray}
          />
          <Text category="h6" style={styles.errorTitle}>
            {i18n.t('camera.permission_required')}
          </Text>
          <Button
            style={styles.permissionButton}
            onPress={requestCameraPermission}
          >
            {i18n.t('camera.grant_permission')}
          </Button>
        </View>
      </Layout>
    );
  }

  return (
    <Layout style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        flash={flashMode ? 'on' : 'off'}
        ratio="16:9"
      >
        {renderCameraOverlay()}
      </CameraView>
      
      {renderProcessingOverlay()}
      {renderResultsModal()}
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  overlayButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  instructionText: {
    color: MedGuardColors.primary.cleanWhite,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scanningArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningFrame: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.6,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: MedGuardColors.primary.trustBlue,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIcon: {
    width: 24,
    height: 24,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: MedGuardColors.primary.trustBlue,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: MedGuardColors.primary.cleanWhite,
  },
  captureIcon: {
    width: 32,
    height: 32,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  errorIcon: {
    width: 64,
    height: 64,
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  permissionButton: {
    minWidth: 200,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  processingModal: {
    width: screenWidth * 0.8,
  },
  processingContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  processingText: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  processingHint: {
    textAlign: 'center',
  },
  resultsModal: {
    width: screenWidth * 0.95,
    maxHeight: screenHeight * 0.9,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  resultsContent: {
    maxHeight: screenHeight * 0.7,
  },
  prescriptionCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    color: MedGuardColors.primary.trustBlue,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: MedGuardColors.extended.borderGray,
  },
  medicationsCard: {
    marginBottom: Spacing.md,
  },
  medicationItem: {
    paddingVertical: Spacing.sm,
  },
  medicationMeta: {
    alignItems: 'flex-end',
  },
  warningCard: {
    marginBottom: Spacing.md,
  },
  warningText: {
    textAlign: 'center',
  },
  resultsActions: {
    gap: Spacing.sm,
  },
  actionButton: {
    marginBottom: Spacing.xs,
  },
});

export default CameraScreen;
