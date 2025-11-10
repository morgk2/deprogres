import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { usePathname } from 'expo-router';
import HomeScreen from '@/app/(tabs)/index';
import CardsScreen from '@/app/(tabs)/cards';
import ProfileScreen from '@/app/(tabs)/profile';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function TabNavigator() {
  const pathname = usePathname();
  const translateX = useSharedValue(0);
  const previousIndex = useRef(0);

  const getTabIndex = (route: string): number => {
    if (route === '/' || route === '/(tabs)' || route.includes('/index') || route === '/(tabs)/') return 0;
    if (route.includes('/cards')) return 1;
    if (route.includes('/profile') && !route.includes('/edit-profile')) return 2;
    return previousIndex.current; // Keep previous index for edit-profile
  };

  const isEditProfile = pathname.includes('/edit-profile');

  useEffect(() => {
    if (!isEditProfile) {
      const newIndex = getTabIndex(pathname);
      if (newIndex !== previousIndex.current && newIndex >= 0 && newIndex <= 2) {
        const targetX = -newIndex * SCREEN_WIDTH;
        
        translateX.value = withTiming(targetX, {
          duration: 350,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        });
        
        previousIndex.current = newIndex;
      }
    }
  }, [pathname, isEditProfile]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: isEditProfile ? 0 : 1,
    };
  });

  if (isEditProfile) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View style={[styles.contentContainer, animatedStyle]}>
        <View style={styles.screen} pointerEvents={getTabIndex(pathname) === 0 ? 'auto' : 'none'}>
          <HomeScreen />
        </View>
        <View style={styles.screen} pointerEvents={getTabIndex(pathname) === 1 ? 'auto' : 'none'}>
          <CardsScreen />
        </View>
        <View style={styles.screen} pointerEvents={getTabIndex(pathname) === 2 ? 'auto' : 'none'}>
          <ProfileScreen />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 3,
    height: '100%',
  },
  screen: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
});

