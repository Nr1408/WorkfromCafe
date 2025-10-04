import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  Linking,
  Animated,
  Easing,
  TextInput,
  FlatList,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { fetchNearbyCafes, fetchPlaceSuggestions } from "../../services/places";
import CafeListItem from "../../components/CafeListItem";
import colors from "../../constants/colors";
import theme from "../../constants/theme";
import * as Location from "expo-location";
import { useAuth } from "../../auth/AuthProvider";

const { height } = Dimensions.get("window");

// !!! IMPORTANT: Replace with your actual Google Places API Key !!!
// For production, consider storing this securely (e.g., react-native-dotenv)
const GOOGLE_PLACES_API_KEY = "AIzaSyCKQcxErzyKkzgBU_vZf6GgszcKtwsC-R0"; // <<< REPLACE THIS!

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#181818" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1b1b1b" }],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#2c2c2c" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a8a8a" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#373737" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3c3c3c" }],
  },
  {
    featureType: "road.highway.controlled_access",
    elementType: "geometry",
    stylers: [{ color: "#4e4e4e" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3d3d3d" }],
  },
];

const LIST_BOTTOM_SHEET_HEIGHT = height * 0.35;
const SELECTED_CAFE_CARD_HEIGHT = 150; // Adjust based on your CafeListItem's actual height

const MapScreen = ({ navigation }) => {
  const [selectedCafe, setSelectedCafe] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const mapRef = useRef(null);
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;
  const suggestDebounceRef = useRef(null);
  const [showSelectedCafeCard, setShowSelectedCafeCard] = useState(false);

  const { signOut } = useAuth();

  const initialRegion = {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const toRad = (value) => (value * Math.PI) / 180;
  const haversineMiles = (coord1, coord2) => {
    if (!coord1 || !coord2) return null;
    const R = 3958.8; // Earth radius in miles
    const dLat = toRad(coord2.latitude - coord1.latitude);
    const dLon = toRad(coord2.longitude - coord1.longitude);
    const lat1 = toRad(coord1.latitude);
    const lat2 = toRad(coord2.latitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDistance = (miles) => {
    if (miles == null) return "";
    if (miles < 1) {
      const meters = miles * 1609.34;
      if (meters < 100) return `${Math.round(meters)}m`;
      return `${Math.round(meters / 50) * 50}m`;
    }
    return `${miles.toFixed(1)} miles`;
  };

  const openDirections = (lat, lng, name) => {
    const label = encodeURIComponent(name || "Destination");
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${lat},${lng}&q=${label}`,
      // Use proper Google Maps URL scheme on Android and default platforms
      android: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });
    Linking.openURL(url).catch((e) => console.warn("Failed to open maps", e));
  };

  const loadCafes = async (lat, lng) => {
    try {
      setError(null);
      setLoading(true);
      const liveCafes = await fetchNearbyCafes({
        latitude: lat,
        longitude: lng,
        radius: 7000,
      });
      setCafes(liveCafes);
    } catch (err) {
      console.warn("Failed to fetch cafes:", err?.message || err);
      setError(err?.message || "Failed to load nearby cafes");
      setCafes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getLocationAsync = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setHasLocationPermission(false);
          return;
        }
        setHasLocationPermission(true);
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          mayShowUserSettingsDialog: true,
        });
        const { latitude, longitude } = position.coords;
        await loadCafes(latitude, longitude);
        const nextRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setCurrentLocation({ latitude, longitude });
        requestAnimationFrame(() => {
          mapRef.current?.animateToRegion(nextRegion, 600);
        });
      } catch (e) {
        console.warn("Error getting location:", e);
      }
    };
    getLocationAsync();
  }, []);

  const centerOnUser = async () => {
    try {
      if (!hasLocationPermission) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Location permission required",
            "Enable location access to see your current position."
          );
          return;
        }
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;
      setCurrentLocation({ latitude, longitude });
      mapRef.current?.animateToRegion(
        { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        600
      );
      await loadCafes(latitude, longitude);
    } catch (e) {
      console.warn("Error centering on user:", e);
    }
  };

  useEffect(() => {
    if (!currentLocation) return;
    const id = setInterval(() => {
      loadCafes(currentLocation.latitude, currentLocation.longitude);
    }, 60000);
    return () => clearInterval(id);
  }, [currentLocation?.latitude, currentLocation?.longitude]);

  useEffect(() => {
    Animated.timing(bottomSheetAnim, {
      toValue: showSelectedCafeCard ? 1 : 0,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [showSelectedCafeCard]);

  const translateYList = bottomSheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, LIST_BOTTOM_SHEET_HEIGHT],
  });

  const translateYSelectedCard = bottomSheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SELECTED_CAFE_CARD_HEIGHT, 0],
  });

  const bottomSheetHeight = showSelectedCafeCard
    ? SELECTED_CAFE_CARD_HEIGHT
    : LIST_BOTTOM_SHEET_HEIGHT;

  const handleChangeQuery = (text) => {
    setQuery(text);
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    if (!text || text.length < 2) {
      setSuggestions([]);
      return;
    }
    suggestDebounceRef.current = setTimeout(async () => {
      try {
        if (!currentLocation) return; // can still fetch without; but bias later if desired
        const list = await fetchPlaceSuggestions({
          input: text,
          latitude: currentLocation?.latitude,
          longitude: currentLocation?.longitude,
        });
        setSuggestions(list);
        setShowSuggestions(true);
      } catch (e) {
        console.warn('suggest error', e.message);
      }
    }, 300);
  };

  const selectSuggestion = async (s) => {
    setQuery(s.primary || s.description);
    setShowSuggestions(false);
    // We only have id/placeId. We'll try to use Places Nearby refresh centered around current location for now.
    // Optionally could call details API here for exact lat/lng (future improvement).
    // For now just hide suggestions.
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchWrapper}>
          <TextInput
            value={query}
            onChangeText={handleChangeQuery}
            placeholder="Search for cafes or locations..."
            placeholderTextColor={colors.secondaryText}
            style={styles.searchInput}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            returnKeyType="search"
          />
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={suggestions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionRow}
                    onPress={() => selectSuggestion(item)}
                  >
                    <Text style={styles.suggestionPrimary}>{item.primary}</Text>
                    {item.secondary ? (
                      <Text style={styles.suggestionSecondary}>{item.secondary}</Text>
                    ) : null}
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={async () => {
            try {
              await signOut();
            } catch (e) {
              console.warn("Logout failed", e);
            }
          }}
          style={styles.logoutButton}
        >
          <Ionicons
            name="log-out-outline"
            size={22}
            color={colors.primaryText}
          />
        </TouchableOpacity>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        showsUserLocation
        showsMyLocationButton
        customMapStyle={darkMapStyle}
        onPress={() => {
          setSelectedCafe(null);
          setShowSelectedCafeCard(false);
        }}
      >
        {cafes.map((cafe) => (
          <Marker
            key={cafe.id}
            coordinate={{
              latitude: cafe.latitude,
              longitude: cafe.longitude,
            }}
            onPress={() => {
              setSelectedCafe(cafe);
              setShowSelectedCafeCard(true);
            }}
          >
            <View
              style={{
                alignItems: "center",
                zIndex: selectedCafe?.id === cafe.id ? 1000 : 1,
              }}
            >
              {selectedCafe?.id === cafe.id && (
                <View style={styles.markerLabelContainer}>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={styles.markerLabelText}
                  >
                    {cafe.name}
                  </Text>
                </View>
              )}
              <View style={styles.markerContainer}>
                <Ionicons name="cafe" size={24} color={colors.accentGreen} />
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Floating buttons container */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        {/* Removed myLocationButton */}
        <TouchableOpacity
          style={styles.communityButton}
          onPress={() => navigation.navigate("Community")}
        >
          <Ionicons name="people" size={22} color={colors.accentGreen} />
        </TouchableOpacity>
      </View>

      <View
        style={{ ...styles.bottomSheetContainer, height: bottomSheetHeight }}
      >
        <Animated.View
          style={[
            styles.bottomSheetContent,
            {
              transform: [{ translateY: translateYList }],
              zIndex: showSelectedCafeCard ? -1 : 1,
            },
            { height: LIST_BOTTOM_SHEET_HEIGHT },
          ]}
        >
          <View style={styles.bottomSheetHandle} />
          <Text style={styles.bottomSheetTitle}>Nearby Cafes</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <ScrollView
            style={styles.cafeList}
            showsVerticalScrollIndicator={false}
          >
            {loading && cafes.length === 0 ? (
              <Text style={styles.loadingText}>Loading nearby cafes…</Text>
            ) : cafes.length === 0 ? (
              <Text style={styles.emptyText}>No cafes found nearby.</Text>
            ) : (
              cafes.map((cafe) => {
                const distanceMi = currentLocation
                  ? haversineMiles(currentLocation, {
                      latitude: cafe.latitude,
                      longitude: cafe.longitude,
                    })
                  : null;
                const distanceText = formatDistance(distanceMi);
                return (
                  <CafeListItem
                    key={cafe.id}
                    cafe={cafe}
                    distanceText={distanceText}
                    onDirections={() =>
                      openDirections(cafe.latitude, cafe.longitude, cafe.name)
                    }
                    onPress={() => navigation.navigate("CafeDetail", { cafe })}
                  />
                );
              })
            )}
          </ScrollView>
        </Animated.View>

        {selectedCafe && (
          <Animated.View
            style={[
              styles.selectedCafeCardContainer,
              {
                transform: [{ translateY: translateYSelectedCard }],
                zIndex: showSelectedCafeCard ? 1 : -1,
              },
              { height: SELECTED_CAFE_CARD_HEIGHT },
            ]}
          >
            <View style={styles.bottomSheetHandle} />
            <CafeListItem
              cafe={selectedCafe}
              distanceText={formatDistance(
                currentLocation
                  ? haversineMiles(currentLocation, {
                      latitude: selectedCafe.latitude,
                      longitude: selectedCafe.longitude,
                    })
                  : null
              )}
              onDirections={() =>
                openDirections(
                  selectedCafe.latitude,
                  selectedCafe.longitude,
                  selectedCafe.name
                )
              }
              onPress={() =>
                navigation.navigate("CafeDetail", { cafe: selectedCafe })
              }
            />
          </Animated.View>
        )}
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
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    backgroundColor: colors.primaryBackground,
    // Ensure header has a higher zIndex than the map for autocomplete dropdown
    zIndex: 10,
  },
  searchWrapper: { flex: 1, position: 'relative' },
  searchInput: { height: 44, borderRadius: theme.borderRadius.medium, backgroundColor: colors.secondaryBackground, color: colors.primaryText, paddingHorizontal: theme.spacing.md, fontSize: theme.fontSizes.medium },
  suggestionsContainer: { position: 'absolute', top: 48, left: 0, right: 0, backgroundColor: colors.secondaryBackground, borderRadius: theme.borderRadius.medium, maxHeight: 250, zIndex: 30, elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4 },
  suggestionRow: { paddingVertical: 10, paddingHorizontal: theme.spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderColor },
  suggestionPrimary: { color: colors.primaryText, fontSize: theme.fontSizes.medium, fontWeight: '500' },
  suggestionSecondary: { color: colors.secondaryText, fontSize: theme.fontSizes.small, marginTop: 2 },

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
  markerLabelContainer: {
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  markerLabelText: {
    color: colors.primaryText,
    fontSize: 12,
    fontWeight: "600",
  },
  bottomSheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
  },
  bottomSheetContent: {
    position: "absolute",
    width: "100%",
    backgroundColor: colors.primaryBackground,
    borderTopLeftRadius: theme.borderRadius.xlarge,
    borderTopRightRadius: theme.borderRadius.xlarge,
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  selectedCafeCardContainer: {
    position: "absolute",
    width: "100%",
    backgroundColor: colors.primaryBackground,
    borderTopLeftRadius: theme.borderRadius.xlarge,
    borderTopRightRadius: theme.borderRadius.xlarge,
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
    top: SELECTED_CAFE_CARD_HEIGHT,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.secondaryText,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: theme.spacing.md,
  },
  bottomSheetTitle: {
    fontSize: theme.fontSizes.xlarge,
    fontWeight: "600",
    color: colors.primaryText,
    marginBottom: theme.spacing.md,
  },
  cafeList: {
    flex: 1,
  },
  loadingText: {
    color: colors.secondaryText,
    padding: theme.spacing.md,
  },
  emptyText: {
    color: colors.secondaryText,
    padding: theme.spacing.md,
  },
  errorText: {
    color: colors.dangerRed,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  logoutButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
  },
  fabContainer: {
    position: "absolute",
    right: 16,
    bottom: LIST_BOTTOM_SHEET_HEIGHT + 24,
    alignItems: "center",
  },
  communityButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryBackground, // white (assuming primaryBackground is dark? If not, adjust to '#FFFFFF')
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.accentGreen,
  },
});

export default MapScreen;
