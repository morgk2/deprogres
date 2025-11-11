import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform, Alert, Switch, ActivityIndicator, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useProfile } from '@/contexts/ProfileContext';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CardPreviewModal, type CardElementPositions } from '@/components/card-preview-modal';
import { CardRenderer } from '@/components/card-renderer';
import { captureRef } from 'react-native-view-shot';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

export default function AdvancedCardGenerationScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  
  const [universityLogo1, setUniversityLogo1] = useState<string | null>(null);
  const [universityLogo2, setUniversityLogo2] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [useProfilePhoto, setUseProfilePhoto] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCardPreview, setShowCardPreview] = useState(false);
  // Default positions matching the card preview modal defaults
  const getDefaultPositions = (): CardElementPositions => {
    const { height: SCREEN_HEIGHT } = Dimensions.get('window');
    const maxCardHeight = SCREEN_HEIGHT * 0.75;
    const CARD_HEIGHT = maxCardHeight;
    
    return {
      photoPosition: { x: 470, y: CARD_HEIGHT * 0.008 },
      lastNamePosition: { x: 394, y: 415 },
      firstNamePosition: { x: 436, y: 414 },
      arabicLastNamePosition: { x: 395, y: 152 },
      arabicFirstNamePosition: { x: 434, y: 161 },
      birthPosition: { x: 448, y: 270 },
      majorPosition: { x: 515, y: 249 },
      branchPosition: { x: 556, y: 210 },
      academicYearPosition: { x: 647, y: 168 },
      universityPosition: { x: 306, y: 297 },
      logoPosition: { x: 342, y: 56 },
      logo2Position: { x: 339, y: 516 },
    };
  };

  const [cardPositions, setCardPositions] = useState<CardElementPositions>(getDefaultPositions());
  const [cardTemplateUri, setCardTemplateUri] = useState<string | null>(null);
  const cardRendererRef = useRef<View>(null);

  useEffect(() => {
    // Load saved images if any
    loadSavedImages();
    // Load card template
    loadCardTemplate();
  }, []);

  useEffect(() => {
    // If useProfilePhoto is enabled and profile has a picture, use it
    if (useProfilePhoto && profile.profilePicture) {
      setPhoto(profile.profilePicture);
    } else if (useProfilePhoto && !profile.profilePicture) {
      Alert.alert('No Profile Photo', 'You need to set a profile picture first.');
      setUseProfilePhoto(false);
    }
  }, [useProfilePhoto, profile.profilePicture]);

  const loadSavedImages = async () => {
    try {
      const logo1 = await AsyncStorage.getItem('universityLogo1');
      const logo2 = await AsyncStorage.getItem('universityLogo2');
      const savedPhoto = await AsyncStorage.getItem('cardPhoto');
      
      if (logo1) setUniversityLogo1(logo1);
      if (logo2) setUniversityLogo2(logo2);
      if (savedPhoto) setPhoto(savedPhoto);
    } catch (error) {
      console.error('Error loading saved images:', error);
    }
  };

  const loadCardTemplate = async () => {
    try {
      const asset = Asset.fromModule(require('@/assets/images/card_template.jpg'));
      await asset.downloadAsync();
      if (asset.localUri) {
        setCardTemplateUri(asset.localUri);
      }
    } catch (error) {
      console.error('Error loading card template:', error);
    }
  };

  const pickImage = async (type: 'logo1' | 'logo2' | 'photo') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to select an image!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'photo' ? [3, 4] : [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        
        if (type === 'logo1') {
          setUniversityLogo1(uri);
          await AsyncStorage.setItem('universityLogo1', uri);
        } else if (type === 'logo2') {
          setUniversityLogo2(uri);
          await AsyncStorage.setItem('universityLogo2', uri);
        } else if (type === 'photo') {
          setPhoto(uri);
          await AsyncStorage.setItem('cardPhoto', uri);
          setUseProfilePhoto(false); // Disable profile photo option when manual photo is selected
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = async (type: 'logo1' | 'logo2' | 'photo') => {
    if (type === 'logo1') {
      setUniversityLogo1(null);
      await AsyncStorage.removeItem('universityLogo1');
    } else if (type === 'logo2') {
      setUniversityLogo2(null);
      await AsyncStorage.removeItem('universityLogo2');
    } else if (type === 'photo') {
      setPhoto(null);
      await AsyncStorage.removeItem('cardPhoto');
      setUseProfilePhoto(false);
    }
  };

  const handleGenerateCard = async () => {
    if (!photo && !useProfilePhoto) {
      Alert.alert('Missing Photo', 'Please import a photo or use your profile photo to generate the card.');
      return;
    }

    if (!cardTemplateUri) {
      Alert.alert('Error', 'Card template is still loading. Please wait a moment and try again.');
      return;
    }

    // Positions are always available (they have defaults)

    setIsGenerating(true);
    try {
      const photoToUse = useProfilePhoto && profile.profilePicture 
        ? profile.profilePicture 
        : photo;

      if (!photoToUse) {
        Alert.alert('Error', 'No photo available');
        setIsGenerating(false);
        return;
      }

      // Wait a moment for the card renderer to be ready and images to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Capture the card as an image
      if (!cardRendererRef.current) {
        throw new Error('Card renderer ref is not available');
      }

      const uri = await captureRef(cardRendererRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      if (!uri) {
        throw new Error('Failed to capture card image');
      }

      // Copy the captured image to a permanent location using legacy API
      const timestamp = Date.now();
      const fileName = `card_${timestamp}.png`;
      const permanentUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.copyAsync({
        from: uri,
        to: permanentUri,
      });

      // Save to AsyncStorage
      await AsyncStorage.setItem('cardImage', permanentUri);
      
      Alert.alert('Success', 'Card generated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error generating card:', error);
      Alert.alert('Error', `Failed to generate card: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShowCard = () => {
    setShowCardPreview(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Advanced Card Generation</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* University Logo 1 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>University Logo 1</Text>
            <View style={styles.imageContainer}>
              {universityLogo1 ? (
                <>
                  <ExpoImage
                    source={{ uri: universityLogo1 }}
                    style={styles.imagePreview}
                    contentFit="contain"
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage('logo1')}
                  >
                    <MaterialIcons name="delete" size={20} color="#E53935" />
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.importButton}
                  onPress={() => pickImage('logo1')}
                >
                  <MaterialIcons name="add-photo-alternate" size={32} color="#019577" />
                  <Text style={styles.importButtonText}>Import Logo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* University Logo 2 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>University Logo 2</Text>
            <View style={styles.imageContainer}>
              {universityLogo2 ? (
                <>
                  <ExpoImage
                    source={{ uri: universityLogo2 }}
                    style={styles.imagePreview}
                    contentFit="contain"
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage('logo2')}
                  >
                    <MaterialIcons name="delete" size={20} color="#E53935" />
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.importButton}
                  onPress={() => pickImage('logo2')}
                >
                  <MaterialIcons name="add-photo-alternate" size={32} color="#019577" />
                  <Text style={styles.importButtonText}>Import Logo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Photo Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Photo</Text>
            
            {/* Use Profile Photo Option */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Use profile photo</Text>
              <Switch
                value={useProfilePhoto}
                onValueChange={setUseProfilePhoto}
                trackColor={{ false: '#E0E0E0', true: '#019577' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {!useProfilePhoto && (
              <View style={styles.imageContainer}>
                {photo ? (
                  <>
                    <ExpoImage
                      source={{ uri: photo }}
                      style={styles.photoPreview}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeImage('photo')}
                    >
                      <MaterialIcons name="delete" size={20} color="#E53935" />
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.importButton}
                    onPress={() => pickImage('photo')}
                  >
                    <MaterialIcons name="add-photo-alternate" size={32} color="#019577" />
                    <Text style={styles.importButtonText}>Import Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {useProfilePhoto && profile.profilePicture && (
              <View style={styles.imageContainer}>
                <ExpoImage
                  source={{ uri: profile.profilePicture }}
                  style={styles.photoPreview}
                  contentFit="cover"
                />
                <Text style={styles.usingProfileText}>Using profile photo</Text>
              </View>
            )}
          </View>

          {/* Generate Button */}
          <TouchableOpacity 
            style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]} 
            onPress={handleGenerateCard}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <MaterialIcons name="auto-awesome" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.generateButtonText}>
              {isGenerating ? 'Generating...' : 'Generate Card'}
            </Text>
          </TouchableOpacity>

          {/* Show Card Button */}
          <TouchableOpacity 
            style={styles.showPDFButton} 
            onPress={handleShowCard}
          >
            <MaterialIcons name="credit-card" size={20} color="#019577" />
            <Text style={styles.showPDFButtonText}>Show Card</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Card Preview Modal */}
      <CardPreviewModal
        visible={showCardPreview}
        onClose={() => setShowCardPreview(false)}
        profile={{
          firstName: profile.firstName,
          lastName: profile.lastName,
          arabicFirstName: profile.arabicFirstName,
          arabicLastName: profile.arabicLastName,
          dateOfBirth: profile.dateOfBirth,
          placeOfBirth: profile.placeOfBirth,
          university: profile.university,
          major: profile.major,
          branch: profile.branch,
          academicYear: profile.academicYear,
          profilePicture: useProfilePhoto && profile.profilePicture 
            ? profile.profilePicture 
            : photo,
        }}
        universityLogo1={universityLogo1}
        universityLogo2={universityLogo2}
        onPositionsChange={setCardPositions}
      />

      {/* Hidden Card Renderer for Capture - Always rendered but hidden */}
      {cardTemplateUri ? (
        <View style={styles.hiddenCardContainer} collapsable={false} pointerEvents="none">
          <CardRenderer
            cardImageUri={cardTemplateUri}
            profile={{
              firstName: profile.firstName,
              lastName: profile.lastName,
              arabicFirstName: profile.arabicFirstName,
              arabicLastName: profile.arabicLastName,
              dateOfBirth: profile.dateOfBirth,
              placeOfBirth: profile.placeOfBirth,
              university: profile.university,
              major: profile.major,
              branch: profile.branch,
              academicYear: profile.academicYear,
              profilePicture: useProfilePhoto && profile.profilePicture 
                ? profile.profilePicture 
                : photo,
            }}
            universityLogo1={universityLogo1}
            universityLogo2={universityLogo2}
            positions={cardPositions}
            ref={cardRendererRef}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Cairo',
  },
  placeholder: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    fontFamily: 'Cairo',
  },
  imageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  photoPreview: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
  },
  importButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#019577',
    fontFamily: 'Cairo',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
  },
  removeButtonText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'Cairo',
  },
  usingProfileText: {
    fontSize: 14,
    color: '#019577',
    fontWeight: '700',
    marginTop: 8,
    fontFamily: 'Cairo',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#019577',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: 'Cairo',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  showPDFButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 20,
    gap: 8,
    borderWidth: 2,
    borderColor: '#019577',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  showPDFButtonDisabled: {
    opacity: 0.6,
  },
  showPDFButtonText: {
    color: '#019577',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: 'Cairo',
  },
  hiddenCardContainer: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    opacity: 0,
    pointerEvents: 'none',
  },
});

