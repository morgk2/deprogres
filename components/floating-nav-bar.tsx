import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function FloatingNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const indicatorPosition = useSharedValue(0);

  const tabs = [
    { name: 'Home', icon: 'home', route: '/' },
    { name: 'Cards', icon: 'credit-card', route: '/cards' },
    { name: 'Profile', icon: 'person', route: '/profile' },
  ];

  const getActiveIndex = () => {
    if (pathname === '/' || pathname === '/(tabs)' || pathname.includes('/index') || pathname === '/(tabs)/') return 0;
    if (pathname.includes('/cards')) return 1;
    if (pathname.includes('/profile') && !pathname.includes('/edit-profile')) return 2;
    return 0;
  };

  useEffect(() => {
    const activeIndex = getActiveIndex();
    // Calculate tab width (85% of screen width, max 400, divided by 3 tabs)
    const navBarWidth = Math.min(SCREEN_WIDTH * 0.85, 400);
    const tabWidth = navBarWidth / 3;
    const targetPosition = activeIndex * tabWidth;
    
    indicatorPosition.value = withTiming(targetPosition, {
      duration: 350,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    });
  }, [pathname]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    const navBarWidth = Math.min(SCREEN_WIDTH * 0.85, 400);
    const tabWidth = navBarWidth / 3;
    
    return {
      transform: [{ translateX: indicatorPosition.value }],
      width: tabWidth,
    };
  });

  // Hide nav bar on edit-profile and advanced-card-generation pages
  if (pathname.includes('/edit-profile') || pathname.includes('/advanced-card-generation')) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <Animated.View style={[styles.activeIndicator, animatedIndicatorStyle]} />
        {tabs.map((tab, index) => {
          const isActive = getActiveIndex() === index;
          
          return (
            <TouchableOpacity
              key={index}
              style={styles.tabButton}
              onPress={() => router.push(tab.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons 
                  name={tab.icon as any} 
                  size={24} 
                  color="#FFFFFF" 
                  style={styles.icon}
                />
              </View>
              <Text style={styles.tabLabel}>{tab.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
    zIndex: 10,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#2C3E50',
    borderRadius: 15,
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '85%',
    maxWidth: 400,
    minHeight: 65,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 16,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#019577',
    borderRadius: 15,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    zIndex: 1,
  },
  icon: {
    zIndex: 1,
  },
  tabLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '700',
    zIndex: 1,
    fontFamily: 'Cairo',
  },
});

