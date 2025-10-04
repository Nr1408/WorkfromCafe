import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Platform, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import CafeListItem from '../../components/CafeListItem';
// import mockCafes from '../../data/mockCafes';
import { fetchCompositeCafes } from '../../services/cafeComposite';
import colors from '../../constants/colors';
import theme from '../../constants/theme';
import * as Location from 'expo-location';

const { height } = Dimensions.get('window');

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'poi.park', elementType: 'labels.text.stroke', stylers: [{ color: '#1b1b1b' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#4e4e4e' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
];

const MapScreen = ({ navigation }) => {
  const [selectedCafe, setSelectedCafe] = useState(null);
  const [cafes, setCafes] = useState([]);
  const [loadingCafes, setLoadingCafes] = useState(true);
  const [cafesError, setCafesError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const mapRef = useRef(null);

  const initialRegion = {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  useEffect(() => {
    const getLocationAsync = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setHasLocationPermission(false);
          return;
        }
        setHasLocationPermission(true);
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          mayShowUserSettingsDialog: true,
        });
        const { latitude, longitude } = position.coords;
        const nextRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setCurrentLocation({ latitude, longitude });
        // Center map to the user's location
        requestAnimationFrame(() => {
          mapRef.current?.animateToRegion(nextRegion, 600);
        });
      } catch (e) {
        console.warn('Error getting location:', e);
      }
    };
    getLocationAsync();
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingCafes(true);
        const data = await fetchCompositeCafes();
        if (active) setCafes(data);
      } catch (e) {
        if (active) setCafesError(e.message);
      } finally {
        if (active) setLoadingCafes(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const centerOnUser = async () => {
    try {
      if (!hasLocationPermission) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Location permission required', 'Enable location access to see your current position.');
          return;
        }
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = position.coords;
      setCurrentLocation({ latitude, longitude });
      mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 600);
    } catch (e) {
      console.warn('Error centering on user:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.secondaryText} />
          <Text style={styles.searchPlaceholder}>Search cafes...</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={24} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsUserLocation
        showsMyLocationButton
        customMapStyle={darkMapStyle}
      >
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="You are here"
            description="Current location"
          >
            <View style={styles.userMarker}>
              <Ionicons name="navigate" size={22} color={colors.primaryBackground} />
            </View>
          </Marker>
        )}
        {cafes.map((cafe) => (
          <Marker
            key={cafe.id}
            coordinate={{
              latitude: cafe.latitude,
              longitude: cafe.longitude,
            }}
            onPress={() => setSelectedCafe(cafe)}
          >
            <View style={styles.markerContainer}>
              <Ionicons name="cafe" size={24} color={colors.accentGreen} />
            </View>
          </Marker>
        ))}
      </MapView>

      <TouchableOpacity style={styles.locateButton} onPress={centerOnUser}>
        <Ionicons name="locate" size={24} color={colors.primaryText} />
      </TouchableOpacity>

      <View style={styles.bottomSheet}>
        <View style={styles.bottomSheetHandle} />
        <Text style={styles.bottomSheetTitle}>Nearby Cafes</Text>
        <ScrollView style={styles.cafeList} showsVerticalScrollIndicator={false}>
          {loadingCafes && <Text style={{color:colors.secondaryText, padding:4}}>Loading cafes...</Text>}
          {cafesError && <Text style={{color:'red', padding:4}}>{cafesError}</Text>}
          {cafes.map((cafe) => (
            <CafeListItem
              key={cafe.id}
              cafe={cafe}
              onPress={() => navigation.navigate('CafeDetail', { cafe })}
            />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: colors.primaryBackground,
    zIndex: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryBackground,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  searchPlaceholder: {
    color: colors.secondaryText,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSizes.medium,
  },
  filterButton: {
    padding: theme.spacing.sm,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: colors.primaryBackground,
    borderRadius: 20,
    padding: theme.spacing.sm,
    borderWidth: 2,
    borderColor: colors.accentGreen,
  },
  userMarker: {
    backgroundColor: colors.accentGreen,
    borderRadius: 14,
    padding: 6,
    borderWidth: 2,
    borderColor: '#0a0a0a',
  },
  locateButton: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: height * 0.4,
    backgroundColor: colors.secondaryBackground,
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
    backgroundColor: colors.primaryBackground,
    borderTopLeftRadius: theme.borderRadius.xlarge,
    borderTopRightRadius: theme.borderRadius.xlarge,
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.secondaryText,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  bottomSheetTitle: {
    fontSize: theme.fontSizes.xlarge,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: theme.spacing.md,
  },
  cafeList: {
    flex: 1,
  },
});

export default MapScreen;
