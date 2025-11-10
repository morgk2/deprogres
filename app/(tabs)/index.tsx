import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

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
        <View style={styles.progresCard}>
          <View style={styles.progresContent}>
            <Text style={styles.progresTitle}>PROGRES</Text>
            <Text style={styles.progresArabic}>
              وزارة التعليم العالي والبحث العلمي
            </Text>
            <View style={styles.progresSubtitle}>
              <Text style={styles.progresFrench}>
                Ministère de l'Enseignement Supérieur et de la Recherche Scientifique
              </Text>
              <MaterialIcons name="flag" size={16} color="#FFFFFF" style={styles.flagIcon} />
            </View>
          </View>
        </View>

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
    backgroundColor: '#019577',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginTop: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progresContent: {
    alignItems: 'center',
  },
  progresTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  progresArabic: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  progresSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progresFrench: {
    fontSize: 10,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  flagIcon: {
    marginLeft: 4,
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
    fontWeight: '500',
  },
});
