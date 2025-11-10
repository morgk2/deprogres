import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProfileData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  university: string;
  major: string;
  branch: string;
  academicYear: string;
  profilePicture: string | null;
}

interface ProfileContextType {
  profile: ProfileData;
  updateProfile: (data: ProfileData) => Promise<void>;
}

const defaultProfile: ProfileData = {
  firstName: 'DENDOUGA',
  lastName: 'Abdelmoumene',
  dateOfBirth: '2004-09-13',
  placeOfBirth: 'Batna-Batna',
  university: 'université de batna 1',
  major: '',
  branch: '',
  academicYear: '',
  profilePicture: null,
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem('profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        setProfile(parsed);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const updateProfile = async (data: ProfileData) => {
    try {
      await AsyncStorage.setItem('profile', JSON.stringify(data));
      setProfile(data);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
}

