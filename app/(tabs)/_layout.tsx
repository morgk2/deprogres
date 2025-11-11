import { Tabs } from 'expo-router';
import React from 'react';
import { TabNavigator } from '@/components/tab-navigator';
import { FloatingNavBar } from '@/components/floating-nav-bar';
import { View, StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            display: 'none',
          },
        }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="cards" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="edit-profile" options={{ presentation: 'card' }} />
        <Tabs.Screen name="advanced-card-generation" options={{ presentation: 'card' }} />
      </Tabs>
      <TabNavigator />
      <FloatingNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
