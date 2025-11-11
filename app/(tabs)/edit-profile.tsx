import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useProfile } from '@/contexts/ProfileContext';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [arabicFirstName, setArabicFirstName] = useState(profile.arabicFirstName || '');
  const [arabicLastName, setArabicLastName] = useState(profile.arabicLastName || '');
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth);
  const [placeOfBirth, setPlaceOfBirth] = useState(profile.placeOfBirth);
  const [university, setUniversity] = useState(profile.university);
  const [major, setMajor] = useState(profile.major);
  const [branch, setBranch] = useState(profile.branch);
  const [academicYear, setAcademicYear] = useState(profile.academicYear);
  const [profilePicture, setProfilePicture] = useState<string | null>(profile.profilePicture);

  useEffect(() => {
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setArabicFirstName(profile.arabicFirstName || '');
    setArabicLastName(profile.arabicLastName || '');
    setDateOfBirth(profile.dateOfBirth);
    setPlaceOfBirth(profile.placeOfBirth);
    setUniversity(profile.university);
    setMajor(profile.major);
    setBranch(profile.branch);
    setAcademicYear(profile.academicYear);
    setProfilePicture(profile.profilePicture);
  }, [profile]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to select a profile picture!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera permissions to take a photo!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Profile Picture',
      'Choose an option',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
  };

  const handleImportCard = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to select an image!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await AsyncStorage.setItem('cardImage', result.assets[0].uri);
        Alert.alert('Success', 'Card image imported successfully!');
      }
    } catch (error) {
      console.error('Error importing card image:', error);
      Alert.alert('Error', 'Failed to import card image. Please try again.');
    }
  };

  const handleAdvancedCardGeneration = () => {
    router.push('/(tabs)/advanced-card-generation');
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        firstName,
        lastName,
        arabicFirstName,
        arabicLastName,
        dateOfBirth,
        placeOfBirth,
        university,
        major,
        branch,
        academicYear,
        profilePicture,
      });
      Alert.alert('Success', 'Profile saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const handleInputFocus = (event: any, inputIndex: number) => {
    setTimeout(() => {
      const scrollOffset = inputIndex * 100; // Approximate offset per input
      scrollViewRef.current?.scrollTo({
        y: scrollOffset,
        animated: true,
      });
    }, 100);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
        {/* Profile Picture Editor */}
        <View style={styles.profilePictureSection}>
          <Text style={styles.sectionLabel}>Profile Picture</Text>
          <View style={styles.profilePictureContainer}>
            <TouchableOpacity onPress={showImagePickerOptions} style={styles.profilePictureButton}>
              {profilePicture ? (
                <ExpoImage
                  source={{ uri: profilePicture }}
                  style={styles.profilePicture}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.profilePicturePlaceholder}>
                  <MaterialIcons name="person" size={60} color="#999" />
                  <Text style={styles.profilePicturePlaceholderText}>Tap to add photo</Text>
                </View>
              )}
              <View style={styles.editIconContainer}>
                <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            {profilePicture && (
              <TouchableOpacity onPress={removeProfilePicture} style={styles.removeButton}>
                <MaterialIcons name="delete" size={20} color="#E53935" />
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name"
            placeholderTextColor="#999"
            onFocus={(e) => handleInputFocus(e, 0)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Arabic First Name</Text>
          <TextInput
            style={styles.input}
            value={arabicFirstName}
            onChangeText={setArabicFirstName}
            placeholder="Enter Arabic first name"
            placeholderTextColor="#999"
            onFocus={(e) => handleInputFocus(e, 1)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name"
            placeholderTextColor="#999"
            onFocus={(e) => handleInputFocus(e, 2)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Arabic Last Name</Text>
          <TextInput
            style={styles.input}
            value={arabicLastName}
            onChangeText={setArabicLastName}
            placeholder="Enter Arabic last name"
            placeholderTextColor="#999"
            onFocus={(e) => handleInputFocus(e, 3)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
            onFocus={(e) => handleInputFocus(e, 4)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Place of Birth</Text>
          <TextInput
            style={styles.input}
            value={placeOfBirth}
            onChangeText={setPlaceOfBirth}
            placeholder="Enter place of birth"
            placeholderTextColor="#999"
            onFocus={(e) => handleInputFocus(e, 5)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>University</Text>
          <TextInput
            style={styles.input}
            value={university}
            onChangeText={setUniversity}
            placeholder="Enter university"
            placeholderTextColor="#999"
            onFocus={(e) => handleInputFocus(e, 6)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Major</Text>
          <TextInput
            style={styles.input}
            value={major}
            onChangeText={setMajor}
            placeholder="Enter major"
            placeholderTextColor="#999"
            onFocus={(e) => handleInputFocus(e, 7)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Branch</Text>
          <TextInput
            style={styles.input}
            value={branch}
            onChangeText={setBranch}
            placeholder="Enter branch"
            placeholderTextColor="#999"
            onFocus={(e) => handleInputFocus(e, 8)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Academic Year</Text>
          <TextInput
            style={styles.input}
            value={academicYear}
            onChangeText={setAcademicYear}
            placeholder="Enter academic year"
            placeholderTextColor="#999"
            onFocus={(e) => handleInputFocus(e, 9)}
          />
        </View>

        <TouchableOpacity style={styles.importCardButton} onPress={handleImportCard}>
          <MaterialIcons name="credit-card" size={20} color="#019577" />
          <Text style={styles.importCardButtonText}>Import Card</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.advancedCardButton} onPress={handleAdvancedCardGeneration}>
          <MaterialIcons name="auto-awesome" size={20} color="#019577" />
          <View style={styles.advancedCardButtonTextContainer}>
            <Text style={styles.advancedCardButtonText}>Advanced Card Generation</Text>
            <Text style={styles.recommendedText}>(recommended)</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  profilePictureSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
    alignSelf: 'flex-start',
    fontFamily: 'Cairo',
  },
  profilePictureContainer: {
    alignItems: 'center',
    gap: 12,
  },
  profilePictureButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicture: {
    width: '100%',
    height: '100%',
  },
  profilePicturePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  profilePicturePlaceholderText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#019577',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
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
  inputGroup: {
    marginBottom: 20,
  },
  importCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#019577',
    gap: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  importCardButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#019577',
    fontFamily: 'Cairo',
  },
  advancedCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#019577',
    gap: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  advancedCardButtonTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  advancedCardButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#019577',
    fontFamily: 'Cairo',
  },
  recommendedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#019577',
    fontStyle: 'italic',
    fontFamily: 'Cairo',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    fontFamily: 'Cairo',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
  saveButton: {
    backgroundColor: '#019577',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: 'Cairo',
  },
});

