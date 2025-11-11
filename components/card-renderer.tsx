import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const maxCardHeight = SCREEN_HEIGHT * 0.75;
const CARD_HEIGHT = maxCardHeight;
const CARD_WIDTH = CARD_HEIGHT / 0.63;

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

export interface CardRendererProps {
  cardImageUri: string | null;
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
  positions: CardElementPositions;
}

// Static positioned element (non-draggable, for rendering)
function StaticElement({
  children,
  x,
  y,
  style,
}: {
  children: React.ReactNode;
  x: number;
  y: number;
  style?: any;
}) {
  return (
    <View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export const CardRenderer = forwardRef<View, CardRendererProps>(({
  cardImageUri,
  profile,
  universityLogo1,
  universityLogo2,
  positions,
}, ref) => {
  return (
    <View ref={ref} style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }]} collapsable={false}>
      {cardImageUri ? (
        <ExpoImage
          source={{ uri: cardImageUri }}
          style={[styles.cardImage, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
          contentFit="contain"
        />
      ) : (
        <View style={[styles.cardImage, { width: CARD_WIDTH, height: CARD_HEIGHT, backgroundColor: '#E0E0E0' }]} />
      )}

      {/* Overlay with user information - Static positioned elements */}
      <View style={styles.infoOverlay} pointerEvents="box-none">
        {/* Profile Picture */}
        {profile.profilePicture && (
          <StaticElement x={positions.photoPosition.x} y={positions.photoPosition.y} style={styles.photoContainer}>
            <ExpoImage
              source={{ uri: profile.profilePicture }}
              style={styles.photo}
              contentFit="cover"
            />
          </StaticElement>
        )}

        {/* Last Name - اللقب */}
        <StaticElement x={positions.lastNamePosition.x} y={positions.lastNamePosition.y} style={[styles.textField, { width: 150 }]}>
          <Text style={styles.textValue}>{profile.lastName || 'Test Last Name'}</Text>
        </StaticElement>

        {/* First Name - الإسم */}
        <StaticElement x={positions.firstNamePosition.x} y={positions.firstNamePosition.y} style={[styles.textField, { width: 150 }]}>
          <Text style={styles.textValue}>{profile.firstName || 'Test First Name'}</Text>
        </StaticElement>

        {/* Arabic First Name - الاسم بالعربية */}
        {profile.arabicFirstName && (
          <StaticElement x={positions.arabicFirstNamePosition.x} y={positions.arabicFirstNamePosition.y} style={[styles.textField, { width: 150 }]}>
            <Text style={styles.textValue}>{profile.arabicFirstName}</Text>
          </StaticElement>
        )}

        {/* Arabic Last Name - اللقب بالعربية */}
        {profile.arabicLastName && (
          <StaticElement x={positions.arabicLastNamePosition.x} y={positions.arabicLastNamePosition.y} style={[styles.textField, { width: 150 }]}>
            <Text style={styles.textValue}>{profile.arabicLastName}</Text>
          </StaticElement>
        )}

        {/* Date and Place of Birth - تاريخ و محال الميلاد */}
        <StaticElement x={positions.birthPosition.x} y={positions.birthPosition.y} style={[styles.textField, { width: 200 }]}>
          <Text style={styles.birthTextValue} numberOfLines={1}>
            {profile.dateOfBirth || '22/22/2002'} {profile.placeOfBirth || 'BATNA-BATNA'}
          </Text>
        </StaticElement>

        {/* Major - الميدان */}
        <StaticElement x={positions.majorPosition.x} y={positions.majorPosition.y} style={[styles.textField, { width: 150 }]}>
          <Text style={styles.textValue}>{profile.major || 'Test Major'}</Text>
        </StaticElement>

        {/* Branch - الفرع */}
        <StaticElement x={positions.branchPosition.x} y={positions.branchPosition.y} style={[styles.textField, { width: 150 }]}>
          <Text style={styles.textValue}>{profile.branch || 'Test Branch'}</Text>
        </StaticElement>

        {/* Academic Year - السنة الدراسية */}
        {profile.academicYear && (
          <StaticElement x={positions.academicYearPosition.x} y={positions.academicYearPosition.y} style={[styles.textField, { width: 150 }]}>
            <Text style={styles.textValue}>{profile.academicYear}</Text>
          </StaticElement>
        )}

        {/* University */}
        {profile.university && (
          <StaticElement x={positions.universityPosition.x} y={positions.universityPosition.y} style={[styles.textField, { width: 150 }]}>
            <Text style={styles.textValue}>{profile.university}</Text>
          </StaticElement>
        )}

        {/* University Logo 1 */}
        {universityLogo1 && (
          <StaticElement x={positions.logoPosition.x} y={positions.logoPosition.y} style={styles.logoContainer}>
            <ExpoImage
              source={{ uri: universityLogo1 }}
              style={styles.logo}
              contentFit="contain"
            />
          </StaticElement>
        )}

        {/* University Logo 2 */}
        {universityLogo2 && (
          <StaticElement x={positions.logo2Position.x} y={positions.logo2Position.y} style={styles.logoContainer}>
            <ExpoImage
              source={{ uri: universityLogo2 }}
              style={styles.logo}
              contentFit="contain"
            />
          </StaticElement>
        )}
      </View>
    </View>
  );
});

CardRenderer.displayName = 'CardRenderer';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  infoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
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
  textValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '700',
    maxWidth: 150,
    fontFamily: 'Cairo',
  },
  birthTextValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '700',
    flexShrink: 0,
    fontFamily: 'Cairo',
  },
  logoContainer: {
    width: 80,
    height: 80,
    transform: [{ rotate: '-90deg' }],
  },
  logo: {
    width: '100%',
    height: '100%',
  },
});

export { CARD_WIDTH, CARD_HEIGHT };

