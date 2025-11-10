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
  const isFlipped = useSharedValue(0);
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

  const flipCard = () => {
    'worklet';
    const newValue = isFlipped.value === 0 ? 1 : 0;
    isFlipped.value = newValue;
    rotateY.value = withTiming(newValue * 180, {
      duration: 400,
      easing: Easing.inOut(Easing.ease),
    });
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      startRotation.value = rotateY.value;
    })
    .onUpdate((event) => {
      'worklet';
      // Convert translation to rotation (-180 to 180 range based on drag)
      // Reduced distance for easier flipping
      const dragRotation = (event.translationX / 200) * 180;
      rotateY.value = startRotation.value + dragRotation;
    })
    .onEnd((event) => {
      'worklet';
      const currentRotation = rotateY.value;
      const rotationDelta = currentRotation - startRotation.value;
      
      if (isFlipped.value === 0) {
        // Currently showing front (0 degrees)
        // Check if we've rotated enough in either direction
        if (rotationDelta > 90 || rotationDelta < -90) {
          // Complete flip to back
          isFlipped.value = 1;
          rotateY.value = withTiming(180, {
            duration: 300,
            easing: Easing.out(Easing.ease),
          });
        } else {
          // Snap back to front
          rotateY.value = withTiming(0, {
            duration: 300,
            easing: Easing.out(Easing.ease),
          });
        }
      } else {
        // Currently showing back (180 degrees)
        // Check if we've rotated enough in either direction
        if (rotationDelta > 90 || rotationDelta < -90) {
          // Complete flip to front
          isFlipped.value = 0;
          rotateY.value = withTiming(0, {
            duration: 300,
            easing: Easing.out(Easing.ease),
          });
        } else {
          // Snap back to back
          rotateY.value = withTiming(180, {
            duration: 300,
            easing: Easing.out(Easing.ease),
          });
        }
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    'worklet';
    flipCard();
  });

  const frontAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    const rotation = rotateY.value;
    
    // Calculate opacity based on rotation angle
    // Front is visible from -90 to 90 degrees
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const opacity = normalizedRotation > 90 && normalizedRotation < 270 ? 0 : 1;

    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotation}deg` }
      ],
      opacity,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    const rotation = rotateY.value + 180;
    
    // Calculate opacity based on rotation angle
    // Back is visible from 90 to 270 degrees (relative to front)
    const normalizedRotation = ((rotateY.value % 360) + 360) % 360;
    const opacity = normalizedRotation > 90 && normalizedRotation < 270 ? 1 : 0;

    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotation}deg` }
      ],
      opacity,
    };
  });

  const composedGesture = Gesture.Exclusive(tapGesture, panGesture);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ID:Cards</Text>
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
    fontWeight: 'bold',
    color: '#000',
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

