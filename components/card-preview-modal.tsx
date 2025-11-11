import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Asset } from 'expo-asset';
import { GestureDetector, Gesture, ScrollView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';

// Draggable component for card elements
interface DraggableElementProps {
  children: React.ReactNode;
  initialX: number;
  initialY: number;
  onPositionChange?: (x: number, y: number) => void;
  onTap?: (x: number, y: number) => void;
  elementName?: string;
  style?: any;
  cardScale?: SharedValue<number>;
  isDraggingRef?: SharedValue<boolean>;
}

function DraggableElement({ 
  children, 
  initialX, 
  initialY, 
  onPositionChange,
  onTap,
  elementName,
  style,
  cardScale,
  isDraggingRef,
}: DraggableElementProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const offsetX = useSharedValue(initialX);
  const offsetY = useSharedValue(initialY);
  const lastInitialX = useSharedValue(initialX);
  const lastInitialY = useSharedValue(initialY);

  // Extract rotation from style prop if it exists
  // Handle both single style object and array of styles
  const getRotationFromStyle = (styleProp: any): string => {
    if (!styleProp) return '0deg';
    
    // If style is an array, check all items
    if (Array.isArray(styleProp)) {
      for (const s of styleProp) {
        if (s?.transform) {
          const rotateTransform = s.transform.find((t: any) => t.rotate);
          if (rotateTransform) {
            return rotateTransform.rotate;
          }
        }
      }
    } else if (styleProp.transform) {
      // If style is a single object
      const rotateTransform = styleProp.transform.find((t: any) => t.rotate);
      if (rotateTransform) {
        return rotateTransform.rotate;
      }
    }
    
    return '0deg';
  };

  const rotation = getRotationFromStyle(style);

  useEffect(() => {
    // Only update if initial values actually changed (not from our own drag)
    if (Math.abs(lastInitialX.value - initialX) > 0.1 || Math.abs(lastInitialY.value - initialY) > 0.1) {
      offsetX.value = initialX;
      offsetY.value = initialY;
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
      lastInitialX.value = initialX;
      lastInitialY.value = initialY;
    }
  }, [initialX, initialY]);

  // Tap gesture to show coordinates - must complete before pan activates
  const tapGesture = Gesture.Tap()
    .maxDistance(15) // Allow small movement for tap
    .onEnd(() => {
      // Show coordinates when tapped
      if (onTap) {
        const currentX = offsetX.value;
        const currentY = offsetY.value;
        runOnJS(onTap)(currentX, currentY);
      }
    });

  // Pan gesture for dragging - requires movement to activate
  const panGesture = Gesture.Pan()
    .minDistance(15) // Require 15px movement before pan activates (allows tap to fire first)
    .onBegin(() => {
      // Mark that we're dragging an element
      if (isDraggingRef) {
        isDraggingRef.value = true;
      }
    })
    .onUpdate((e) => {
      // Account for card scale when dragging
      const scaleFactor = cardScale?.value || 1;
      translateX.value = savedTranslateX.value + e.translationX / scaleFactor;
      translateY.value = savedTranslateY.value + e.translationY / scaleFactor;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      const newX = offsetX.value + savedTranslateX.value;
      const newY = offsetY.value + savedTranslateY.value;
      offsetX.value = newX;
      offsetY.value = newY;
      // Update last initial values to match new position (prevents useEffect from resetting)
      lastInitialX.value = newX;
      lastInitialY.value = newY;
      if (onPositionChange) {
        runOnJS(onPositionChange)(newX, newY);
      }
      // Reset translation offsets since we've updated the position
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
      // Mark that we're no longer dragging
      if (isDraggingRef) {
        isDraggingRef.value = false;
      }
    })
    .onFinalize(() => {
      // Ensure drag state is cleared
      if (isDraggingRef) {
        isDraggingRef.value = false;
      }
    });

  // Use Exclusive so tap fires if no movement, pan fires if movement detected
  const composedGesture = Gesture.Exclusive(tapGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: rotation }, // Include rotation in animated transform
      ],
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      left: offsetX.value,
      top: offsetY.value,
    };
  });

  // Remove transform from style prop to avoid conflicts
  // Handle both single style object and array of styles
  const getStyleWithoutTransform = (styleProp: any) => {
    if (!styleProp) return {};
    
    if (Array.isArray(styleProp)) {
      // For arrays, remove transform from each style object
      return styleProp.map((s: any) => {
        if (s && s.transform) {
          const { transform, ...rest } = s;
          return rest;
        }
        return s;
      });
    } else if (styleProp.transform) {
      // For single object, remove transform
      const { transform, ...rest } = styleProp;
      return rest;
    }
    
    return styleProp;
  };

  const styleWithoutTransform = getStyleWithoutTransform(style);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[{ position: 'absolute' }, containerStyle, styleWithoutTransform, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

export interface CardElementPositions {
  photoPosition: { x: number; y: number };
  lastNamePosition: { x: number; y: number };
  firstNamePosition: { x: number; y: number };
  arabicLastNamePosition: { x: number; y: number };
  arabicFirstNamePosition: { x: number; y: number };
  birthPosition: { x: number; y: number };
  majorPosition: { x: number; y: number };
  branchPosition: { x: number; y: number };
  academicYearPosition: { x: number; y: number };
  universityPosition: { x: number; y: number };
  logoPosition: { x: number; y: number };
  logo2Position: { x: number; y: number };
}

interface CardPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  profile: {
    firstName: string;
    lastName: string;
    arabicFirstName?: string;
    arabicLastName?: string;
    dateOfBirth: string;
    placeOfBirth?: string;
    major: string;
    branch: string;
    academicYear?: string;
    university?: string;
    profilePicture?: string | null;
  };
  universityLogo1?: string | null;
  universityLogo2?: string | null;
  onPositionsChange?: (positions: CardElementPositions) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Card is in landscape mode, so width > height
// Make card as large as possible while maintaining aspect ratio
// Use screen height to determine max size since card is landscape
const maxCardHeight = SCREEN_HEIGHT * 0.75; // Use 75% of screen height
const CARD_HEIGHT = maxCardHeight;
const CARD_WIDTH = CARD_HEIGHT / 0.63; // Landscape aspect ratio (approximately 16:10)

export function CardPreviewModal({
  visible,
  onClose,
  profile,
  universityLogo1,
  universityLogo2,
  onPositionsChange,
}: CardPreviewModalProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showDebugGrid, setShowDebugGrid] = useState(true); // Enable debug grid by default

  // Element positions (stored as state so they persist)
  const [photoPosition, setPhotoPosition] = useState({ x: 470, y: CARD_HEIGHT * 0.008 });
  const [lastNamePosition, setLastNamePosition] = useState({ x: 394, y: 415 });
  const [firstNamePosition, setFirstNamePosition] = useState({ x: 436, y: 414 });
  const [arabicLastNamePosition, setArabicLastNamePosition] = useState({ x: 395, y: 152 });
  const [arabicFirstNamePosition, setArabicFirstNamePosition] = useState({ x: 434, y: 161 });
  const [birthPosition, setBirthPosition] = useState({ x: 449, y: 258 });
  const [majorPosition, setMajorPosition] = useState({ x: 515, y: 249 });
  const [branchPosition, setBranchPosition] = useState({ x: 556, y: 210 });
  const [academicYearPosition, setAcademicYearPosition] = useState({ x: 647, y: 132 });
  const [universityPosition, setUniversityPosition] = useState({ x: 306, y: 297 });
  const [logoPosition, setLogoPosition] = useState({ x: 342, y: 56 });
  const [logo2Position, setLogo2Position] = useState({ x: 339, y: 516 });

  // Notify parent of position changes
  useEffect(() => {
    if (onPositionsChange) {
      onPositionsChange({
        photoPosition,
        lastNamePosition,
        firstNamePosition,
        arabicLastNamePosition,
        arabicFirstNamePosition,
        birthPosition,
        majorPosition,
        branchPosition,
        academicYearPosition,
        universityPosition,
        logoPosition,
        logo2Position,
      });
    }
  }, [
    photoPosition,
    lastNamePosition,
    firstNamePosition,
    arabicLastNamePosition,
    arabicFirstNamePosition,
    birthPosition,
    majorPosition,
    branchPosition,
    academicYearPosition,
    universityPosition,
    logoPosition,
    logo2Position,
    onPositionsChange,
  ]);

  // Track if an element is being dragged (using shared value for gesture coordination)
  const isDraggingElement = useSharedValue(false);

  // Zoom and pan state
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    if (universityLogo1) {
      console.log('University Logo 1 URI:', universityLogo1);
    }
  }, [universityLogo1]);

  useEffect(() => {
    if (visible) {
      loadImage();
      // Reset zoom and pan when modal opens
      scale.value = withTiming(1);
      savedScale.value = 1;
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
      // Reset element positions to defaults (optional - remove if you want positions to persist)
      // setPhotoPosition({ x: 470, y: CARD_HEIGHT * 0.008 });
      // setLastNamePosition({ x: 394, y: 415 });
      // setFirstNamePosition({ x: 436, y: 414 });
      // setArabicLastNamePosition({ x: 395, y: 206 });
      // setArabicFirstNamePosition({ x: 434, y: 174 });
      // setBirthPosition({ x: 448, y: 270 });
      // setMajorPosition({ x: 515, y: 249 });
      // setBranchPosition({ x: 556, y: 210 });
      // setAcademicYearPosition({ x: 647, y: 168 });
      // setUniversityPosition({ x: 306, y: 297 });
      // setLogoPosition({ x: 342, y: 56 });
      // setLogo2Position({ x: 339, y: 516 });
    }
  }, [visible]);

  // Handler to show coordinates when element is tapped
  const showCoordinates = (elementName: string, x: number, y: number) => {
    Alert.alert(
      `${elementName} Coordinates`,
      `X: ${Math.round(x)}\nY: ${Math.round(y)}`,
      [{ text: 'OK' }]
    );
  };

  const loadImage = async () => {
    try {
      const asset = Asset.fromModule(require('../assets/images/card_template.jpg'));
      await asset.downloadAsync();
      if (asset.localUri) {
        setImageUri(asset.localUri);
      }
    } catch (error) {
      console.error('Error loading image:', error);
    }
  };

  // Pinch gesture for zooming - only works when not dragging an element
  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      // Don't allow pinch if dragging an element
      if (isDraggingElement.value) {
        return;
      }
    })
    .onUpdate((e) => {
      if (!isDraggingElement.value) {
        const newScale = savedScale.value * e.scale;
        scale.value = newScale;
      }
    })
    .onEnd(() => {
      if (!isDraggingElement.value) {
        savedScale.value = scale.value;
        // Clamp scale between 1 and 3
        if (scale.value < 1) {
          scale.value = withTiming(1);
          savedScale.value = 1;
        } else if (scale.value > 3) {
          scale.value = withTiming(3);
          savedScale.value = 3;
        }
      }
    });

  // Pan gesture for card - only works with 2+ fingers and when not dragging element
  const panGesture = Gesture.Pan()
    .minPointers(2) // Require 2 fingers to pan card (avoids conflict with element dragging)
    .onBegin(() => {
      // Don't allow pan if dragging an element
      if (isDraggingElement.value) {
        return;
      }
    })
    .onUpdate((e) => {
      if (!isDraggingElement.value) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      if (!isDraggingElement.value) {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      }
    });

  // Combine gestures - pinch and pan can work simultaneously
  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  // Animated style for the card container
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Student Card Preview</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              onPress={() => setShowDebugGrid(!showDebugGrid)} 
              style={styles.debugButton}
            >
              <MaterialIcons 
                name={showDebugGrid ? "grid-on" : "grid-off"} 
                size={20} 
                color="#019577" 
              />
              <Text style={styles.debugButtonText}>
                {showDebugGrid ? 'Hide Grid' : 'Show Grid'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.cardContainer}>
            <GestureDetector gesture={composedGesture}>
              <Animated.View style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }, animatedCardStyle]}>
              {imageUri ? (
              <ExpoImage
                source={{ uri: imageUri }}
                style={[styles.cardImage, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
                contentFit="contain"
              />
              ) : (
                <View style={[styles.cardImage, { width: CARD_WIDTH, height: CARD_HEIGHT, backgroundColor: '#E0E0E0' }]} />
              )}

              {/* Debug Grid Overlay */}
              {showDebugGrid && (
                <View style={styles.debugGrid}>
                  {/* Horizontal grid lines with numbers (1, 2, 3, ...) */}
                  {Array.from({ length: 25 }).map((_, i) => {
                    const y = (CARD_HEIGHT / 25) * i;
                    const lineNumber = i + 1; // Numbers start from 1
                    return (
                      <View key={`h-${i}`} style={[styles.gridLine, styles.gridLineHorizontal, { top: y }]}>
                        <Text style={styles.gridLabel}>{lineNumber}</Text>
                      </View>
                    );
                  })}
                  {/* Vertical grid lines with letters (A, B, C, ...) */}
                  {Array.from({ length: 25 }).map((_, i) => {
                    const x = (CARD_WIDTH / 25) * i;
                    const lineLetter = String.fromCharCode(65 + i); // A=65, B=66, etc.
                    return (
                      <View key={`v-${i}`} style={[styles.gridLine, styles.gridLineVertical, { left: x }]}>
                        <Text style={styles.gridLabelVertical}>{lineLetter}</Text>
                      </View>
                    );
                  })}
                  {/* Corner coordinates */}
                  <View style={[styles.cornerLabel, { top: 0, left: 0 }]}>
                    <Text style={styles.cornerLabelText}>0,0</Text>
                  </View>
                  <View style={[styles.cornerLabel, { top: 0, right: 0 }]}>
                    <Text style={styles.cornerLabelText}>{Math.round(CARD_WIDTH)},0</Text>
                  </View>
                  <View style={[styles.cornerLabel, { bottom: 0, left: 0 }]}>
                    <Text style={styles.cornerLabelText}>0,{Math.round(CARD_HEIGHT)}</Text>
                  </View>
                  <View style={[styles.cornerLabel, { bottom: 0, right: 0 }]}>
                    <Text style={styles.cornerLabelText}>
                      {Math.round(CARD_WIDTH)},{Math.round(CARD_HEIGHT)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Overlay with user information - All elements are draggable */}
              <View style={styles.infoOverlay} pointerEvents="box-none">
                {/* Profile Picture */}
                {profile.profilePicture && (
                  <DraggableElement
                    initialX={photoPosition.x}
                    initialY={photoPosition.y}
                    onPositionChange={(x, y) => setPhotoPosition({ x, y })}
                    onTap={(x, y) => showCoordinates('Profile Picture', x, y)}
                    elementName="Profile Picture"
                    cardScale={scale}
                    isDraggingRef={isDraggingElement}
                    style={styles.photoContainer}
                  >
                    <ExpoImage
                      source={{ uri: profile.profilePicture }}
                      style={styles.photo}
                      contentFit="cover"
                    />
                  </DraggableElement>
                )}

                {/* Last Name - اللقب */}
                <DraggableElement
                  initialX={lastNamePosition.x}
                  initialY={lastNamePosition.y}
                  onPositionChange={(x, y) => setLastNamePosition({ x, y })}
                  onTap={(x, y) => showCoordinates('Last Name (اللقب)', x, y)}
                  elementName="Last Name"
                  cardScale={scale}
                  isDraggingRef={isDraggingElement}
                  style={[styles.textField, { width: 150 }]}
                >
                  <Text style={styles.textValue}>{profile.lastName || 'Test Last Name'}</Text>
                </DraggableElement>

                {/* First Name - الإسم */}
                <DraggableElement
                  initialX={firstNamePosition.x}
                  initialY={firstNamePosition.y}
                  onPositionChange={(x, y) => setFirstNamePosition({ x, y })}
                  onTap={(x, y) => showCoordinates('First Name (الإسم)', x, y)}
                  elementName="First Name"
                  cardScale={scale}
                  isDraggingRef={isDraggingElement}
                  style={[styles.textField, { width: 150 }]}
                >
                  <Text style={styles.textValue}>{profile.firstName || 'Test First Name'}</Text>
                </DraggableElement>

                {/* Arabic First Name - الاسم بالعربية */}
                {profile.arabicFirstName && (
                  <DraggableElement
                    initialX={arabicFirstNamePosition.x}
                    initialY={arabicFirstNamePosition.y}
                    onPositionChange={(x, y) => setArabicFirstNamePosition({ x, y })}
                    onTap={(x, y) => showCoordinates('Arabic First Name (الاسم بالعربية)', x, y)}
                    elementName="Arabic First Name"
                    cardScale={scale}
                    isDraggingRef={isDraggingElement}
                    style={[styles.textField, { width: 150 }]}
                  >
                    <Text style={styles.textValue}>{profile.arabicFirstName}</Text>
                  </DraggableElement>
                )}

                {/* Arabic Last Name - اللقب بالعربية */}
                {profile.arabicLastName && (
                  <DraggableElement
                    initialX={arabicLastNamePosition.x}
                    initialY={arabicLastNamePosition.y}
                    onPositionChange={(x, y) => setArabicLastNamePosition({ x, y })}
                    onTap={(x, y) => showCoordinates('Arabic Last Name (اللقب بالعربية)', x, y)}
                    elementName="Arabic Last Name"
                    cardScale={scale}
                    isDraggingRef={isDraggingElement}
                    style={[styles.textField, { width: 150 }]}
                  >
                    <Text style={styles.textValue}>{profile.arabicLastName}</Text>
                  </DraggableElement>
                )}

                {/* Date and Place of Birth - تاريخ و محال الميلاد */}
                <DraggableElement
                  initialX={birthPosition.x}
                  initialY={birthPosition.y}
                  onPositionChange={(x, y) => setBirthPosition({ x, y })}
                  onTap={(x, y) => showCoordinates('Birth Date/Place (تاريخ و محال الميلاد)', x, y)}
                  elementName="Birth Date/Place"
                  cardScale={scale}
                  isDraggingRef={isDraggingElement}
                  style={[styles.textField, { width: 200 }]}
                >
                  <Text style={styles.birthTextValue} numberOfLines={1}>
                    {profile.dateOfBirth || '22/22/2002'} {profile.placeOfBirth || 'BATNA-BATNA'}
                  </Text>
                </DraggableElement>

                {/* Major - الميدان */}
                <DraggableElement
                  initialX={majorPosition.x}
                  initialY={majorPosition.y}
                  onPositionChange={(x, y) => setMajorPosition({ x, y })}
                  onTap={(x, y) => showCoordinates('Major (الميدان)', x, y)}
                  elementName="Major"
                  cardScale={scale}
                  isDraggingRef={isDraggingElement}
                  style={[styles.textField, { width: 150 }]}
                >
                  <Text style={styles.textValue}>{profile.major || 'Test Major'}</Text>
                </DraggableElement>

                {/* Branch - الفرع */}
                <DraggableElement
                  initialX={branchPosition.x}
                  initialY={branchPosition.y}
                  onPositionChange={(x, y) => setBranchPosition({ x, y })}
                  onTap={(x, y) => showCoordinates('Branch (الفرع)', x, y)}
                  elementName="Branch"
                  cardScale={scale}
                  isDraggingRef={isDraggingElement}
                  style={[styles.textField, { width: 150 }]}
                >
                  <Text style={styles.textValue}>{profile.branch || 'Test Branch'}</Text>
                </DraggableElement>

                {/* Academic Year - السنة الدراسية */}
                {profile.academicYear && (
                  <DraggableElement
                    initialX={academicYearPosition.x}
                    initialY={academicYearPosition.y}
                    onPositionChange={(x, y) => setAcademicYearPosition({ x, y })}
                    onTap={(x, y) => showCoordinates('Academic Year (السنة الدراسية)', x, y)}
                    elementName="Academic Year"
                    cardScale={scale}
                    isDraggingRef={isDraggingElement}
                    style={[styles.textField, { width: 150 }]}
                  >
                    <Text style={styles.textValue}>{profile.academicYear}</Text>
                  </DraggableElement>
                )}

                {/* University */}
                {profile.university && (
                  <DraggableElement
                    initialX={universityPosition.x}
                    initialY={universityPosition.y}
                    onPositionChange={(x, y) => setUniversityPosition({ x, y })}
                    onTap={(x, y) => showCoordinates('University', x, y)}
                    elementName="University"
                    cardScale={scale}
                    isDraggingRef={isDraggingElement}
                    style={[styles.textField, { width: 150 }]}
                  >
                    <Text style={styles.textValue}>{profile.university}</Text>
                  </DraggableElement>
                )}

                {/* University Logo 1 - Bottom Left */}
                <DraggableElement
                  initialX={logoPosition.x}
                  initialY={logoPosition.y}
                  onPositionChange={(x, y) => setLogoPosition({ x, y })}
                  onTap={(x, y) => showCoordinates('University Logo 1', x, y)}
                  elementName="University Logo 1"
                  cardScale={scale}
                  isDraggingRef={isDraggingElement}
                  style={styles.logoContainer}
                >
                  {universityLogo1 ? (
                    <ExpoImage
                      source={{ uri: universityLogo1 }}
                      style={styles.logo}
                      contentFit="contain"
                      onError={(error) => {
                        console.error('Error loading university logo 1:', error);
                      }}
                      onLoad={() => {
                        console.log('University logo 1 loaded successfully');
                      }}
                    />
                  ) : null}
                </DraggableElement>

                {/* University Logo 2 */}
                <DraggableElement
                  initialX={logo2Position.x}
                  initialY={logo2Position.y}
                  onPositionChange={(x, y) => setLogo2Position({ x, y })}
                  onTap={(x, y) => showCoordinates('University Logo 2', x, y)}
                  elementName="University Logo 2"
                  cardScale={scale}
                  isDraggingRef={isDraggingElement}
                  style={styles.logoContainer}
                >
                  {universityLogo2 ? (
                    <ExpoImage
                      source={{ uri: universityLogo2 }}
                      style={styles.logo}
                      contentFit="contain"
                      onError={(error) => {
                        console.error('Error loading university logo 2:', error);
                      }}
                      onLoad={() => {
                        console.log('University logo 2 loaded successfully');
                      }}
                    />
                  ) : null}
                </DraggableElement>
              </View>
              </Animated.View>
            </GestureDetector>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    fontFamily: 'Cairo',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  debugButtonText: {
    fontSize: 12,
    color: '#019577',
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
    paddingBottom: 32,
    paddingHorizontal: 0,
  },
  cardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    position: 'relative',
  },
  cardImage: {
    borderRadius: 12,
  },
  debugGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
  },
  gridLineHorizontal: {
    width: '100%',
    height: 1,
  },
  gridLineVertical: {
    height: '100%',
    width: 1,
  },
  gridLabel: {
    position: 'absolute',
    left: 2,
    top: -8,
    fontSize: 8,
    color: '#FF0000',
    fontWeight: '800',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 2,
    fontFamily: 'Cairo',
  },
  gridLabelVertical: {
    position: 'absolute',
    top: 2,
    left: -15,
    fontSize: 8,
    color: '#FF0000',
    fontWeight: '800',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 2,
    width: 30,
    textAlign: 'center',
    fontFamily: 'Cairo',
  },
  cornerLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 4,
    borderRadius: 4,
    zIndex: 20,
  },
  cornerLabelText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800',
    fontFamily: 'Cairo',
  },
  infoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15, // Above the debug grid
  },
  photoContainer: {
    width: 160,
    height: 160 * 1.2, // Maintain aspect ratio (192)
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    transform: [{ rotate: '-90deg' }],
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  textField: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    transform: [{ rotate: '-90deg' }], // Counter-clockwise for landscape mode
  },
  arabicLabel: {
    fontSize: 9,
    color: '#666',
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'right',
    fontFamily: 'Cairo',
  },
  textValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '700',
    maxWidth: 150,
    textAlign: 'right',
    fontFamily: 'Cairo',
  },
  birthTextValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 0,
    fontFamily: 'Cairo',
  },
  logoContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-90deg' }], // Counter-clockwise for landscape mode
  },
  logo: {
    width: '100%',
    height: '100%',
  },
});

