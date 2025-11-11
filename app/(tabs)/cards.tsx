import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Image as ExpoImage } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FLIP_DURATION = 180;
const DRAG_DISTANCE_FOR_FULL_FLIP = 140; // pixels
const FLIP_THRESHOLD_DEGREES = 135; // 75% of 180 degrees

function normalizeRotation(value: number): number {
  'worklet';
  let normalized = ((value % 360) + 360) % 360;
  if (normalized >= 180) {
    normalized -= 360;
  }
  return normalized;
}

const CardFace = ({ cardImage }: { cardImage: string | null }) => (
  <View style={styles.cardInner}>
    {cardImage ? (
      <ExpoImage
        source={{ uri: cardImage }}
        style={styles.cardImage}
        contentFit="cover"
      />
    ) : (
      <>
        <View style={styles.wavyPattern} />
        <View style={styles.dottedLine}>
          {Array.from({ length: 20 }).map((_, index) => (
            <View key={index} style={styles.dot} />
          ))}
        </View>
      </>
    )}
  </View>
);

export default function CardsScreen() {
  const rotateY = useSharedValue(0);
  const startRotation = useSharedValue(0);
  const [cardImage, setCardImage] = useState<string | null>(null);

  const loadCardImage = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('cardImage');
      if (stored) {
        setCardImage(stored);
      } else {
        setCardImage(null);
      }
    } catch (error) {
      console.error('Error loading card image:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCardImage();
    }, [loadCardImage])
  );

  const flipCard = (direction: 1 | -1 = 1) => {
    'worklet';
    const current = normalizeRotation(rotateY.value);
    const targetRaw = current + direction * 180;
    const normalizedTarget = normalizeRotation(targetRaw);

    rotateY.value = current;
    rotateY.value = withTiming(
      targetRaw,
      {
        duration: FLIP_DURATION,
        easing: Easing.inOut(Easing.ease),
      },
      (finished) => {
        if (finished) {
          rotateY.value = normalizedTarget;
        }
      }
    );
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      const normalized = normalizeRotation(rotateY.value);
      rotateY.value = normalized;
      startRotation.value = normalized;
    })
    .onUpdate((event) => {
      'worklet';
      const dragRotation = (event.translationX / DRAG_DISTANCE_FOR_FULL_FLIP) * 180;
      rotateY.value = startRotation.value + dragRotation;
    })
    .onEnd((event) => {
      'worklet';
      const currentRotation = rotateY.value;
      const rotationDelta = currentRotation - startRotation.value;
      const velocityContribution = (event.velocityX / 1000) * 45; // degrees
      const effectiveDelta = rotationDelta + velocityContribution;

      // Always complete the flip in the direction they were swiping
      // Use a small threshold to determine direction (even tiny swipes should flip)
      const direction: 1 | -1 = effectiveDelta >= 0 ? 1 : -1;
      const targetRotation = startRotation.value + direction * 180;
      const normalizedTarget = normalizeRotation(targetRotation);
      
      rotateY.value = withTiming(
        targetRotation,
        {
          duration: FLIP_DURATION,
          easing: Easing.out(Easing.ease),
        },
        (finished) => {
          if (finished) {
            rotateY.value = normalizedTarget;
            startRotation.value = normalizedTarget;
          }
        }
      );
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    'worklet';
    flipCard(1);
  });

  const frontAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    const rawRotation = rotateY.value;
    const normalized = normalizeRotation(rawRotation);
    const opacity = Math.abs(normalized) >= 90 ? 0 : 1;

    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rawRotation}deg` },
      ],
      opacity,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    const baseRotation = rotateY.value;
    const normalizedFront = normalizeRotation(baseRotation);
    const opacity = Math.abs(normalizedFront) >= 90 ? 1 : 0;
    const backRotation = normalizeRotation(baseRotation + 180);

    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${backRotation}deg` },
      ],
      opacity,
    };
  });

  const composedGesture = Gesture.Exclusive(tapGesture, panGesture);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ID Cards</Text>
      </View>

      <View style={styles.content}>
        <GestureDetector gesture={composedGesture}>
          <View style={styles.cardContainer}>
            <Animated.View style={[styles.card, frontAnimatedStyle]}>
              <CardFace cardImage={cardImage} />
            </Animated.View>
            <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
              <CardFace cardImage={cardImage} />
            </Animated.View>
          </View>
        </GestureDetector>
      </View>
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
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  cardContainer: {
    width: '90%',
    height: '70%',
    position: 'relative',
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'absolute',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardBack: {
    position: 'absolute',
  },
  cardInner: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  wavyPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F8F8F8',
    opacity: 0.5,
  },
  dottedLine: {
    position: 'absolute',
    right: 8,
    top: '10%',
    bottom: '10%',
    width: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#019577',
    marginVertical: 4,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
});

