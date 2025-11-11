import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ImageBackground } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import bannerImage from '@/assets/images/banner.png';

export default function HomeScreen() {
  const menuItems = [
    { icon: 'description', label: 'Discharge' },
    { icon: 'calendar-today', label: 'Timetable' },
    { icon: 'group', label: 'Group and Section' },
    { icon: 'event', label: 'Exams Schedule' },
    { icon: 'school', label: 'Exam Grades' },
    { icon: 'edit', label: 'Assessment' },
    { icon: 'pie-chart', label: 'Percentage (%)' },
    { icon: 'folder', label: 'Academic transcripts' },
    { icon: 'calculate', label: 'Debts' },
    { icon: 'assignment', label: 'Academic vacation' },
    { icon: 'mail', label: 'Enrollments' },
    { icon: 'restaurant', label: 'Restauration' },
    { icon: 'apps', label: 'Other services' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* PROGRES Header Card */}
        <ImageBackground 
          source={bannerImage} 
          style={styles.progresCard}
          imageStyle={styles.progresCardImage}
          resizeMode="cover"
        />

        {/* Menu Grid */}
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuButton}>
              <MaterialIcons name={item.icon as any} size={24} color="#FFFFFF" />
              <Text style={styles.menuButtonText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 130,
    flexGrow: 1,
  },
  progresCard: {
    borderRadius: 12,
    marginBottom: 16,
    marginTop: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
    minHeight: 120,
  },
  progresCardImage: {
    borderRadius: 12,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
  },
  menuButton: {
    width: '48%',
    backgroundColor: '#019577',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 75,
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
});
