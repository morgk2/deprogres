import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useProfile } from '@/contexts/ProfileContext';
import { Image as ExpoImage } from 'expo-image';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const fullName = `${profile.firstName} ${profile.lastName}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            {profile.profilePicture ? (
              <ExpoImage
                source={{ uri: profile.profilePicture }}
                style={styles.profileImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <MaterialIcons name="person" size={60} color="#FFFFFF" />
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{fullName}</Text>
            <Text style={styles.profileUniversity}>{profile.university}</Text>
          </View>
        </View>

        {/* Place of Birth Card */}
        <View style={styles.detailCard}>
          <MaterialIcons name="place" size={24} color="#019577" />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Place of Birth</Text>
            <Text style={styles.detailValue}>{profile.placeOfBirth}</Text>
          </View>
        </View>

        {/* Date of Birth Card */}
        <View style={styles.detailCard}>
          <MaterialIcons name="calendar-today" size={24} color="#019577" />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Date of Birth</Text>
            <Text style={styles.detailValue}>{profile.dateOfBirth}</Text>
          </View>
        </View>

        {/* Change Language Card */}
        <View style={styles.detailCard}>
          <MaterialIcons name="language" size={24} color="#019577" />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Change Language</Text>
          </View>
          <TouchableOpacity style={styles.languageButton}>
            <Text style={styles.languageButtonText}>en-US</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button (hidden edit profile feature) */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => router.push('/(tabs)/edit-profile')}
        >
          <Text style={styles.logoutButtonText}>LOGOUT</Text>
        </TouchableOpacity>
      </ScrollView>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    fontFamily: 'Cairo',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'Cairo',
  },
  profileUniversity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Cairo',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  detailTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
  detailValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  languageButton: {
    borderWidth: 1,
    borderColor: '#019577',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  languageButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  logoutButton: {
    backgroundColor: '#E53935',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: 'Cairo',
  },
});

