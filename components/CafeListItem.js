import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../constants/colors";
import theme from "../constants/theme";

const CafeListItem = ({ cafe, onPress, distanceText, onDirections }) => {
  const animWidth = useRef(new Animated.Value(38)).current; // collapsed width

  const expand = () => {
    Animated.timing(animWidth, {
      toValue: 120,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const collapse = () => {
    Animated.timing(animWidth, {
      toValue: 38,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };
  const getMetricColor = (value, type) => {
    if (type === "wifi") {
      if (value == null) return colors.secondaryText;
      if (value >= 50) return colors.accentGreen;
      if (value >= 25) return colors.warningYellow;
      return colors.dangerRed;
    }
    if (type === "crowd") {
      if (!value) return colors.secondaryText;
      if (value === "Empty") return colors.accentGreen;
      if (value === "Moderate") return colors.warningYellow;
      return colors.dangerRed;
    }
    return colors.secondaryText;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{cafe.name}</Text>
        <Text style={styles.updateTime}>
          {distanceText || cafe.last_live_update_at}
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Ionicons
            name="wifi"
            size={16}
            color={getMetricColor(cafe.current_wifi_speed_mbps, "wifi")}
          />
          <Text
            style={[
              styles.metricText,
              { color: getMetricColor(cafe.current_wifi_speed_mbps, "wifi") },
            ]}
          >
            {cafe.current_wifi_speed_mbps != null
              ? `Wi‑Fi: ${cafe.current_wifi_speed_mbps} Mbps`
              : "Wi‑Fi: Unknown"}
          </Text>
        </View>

        <View style={styles.metric}>
          <Ionicons
            name="people"
            size={16}
            color={getMetricColor(cafe.current_crowd_level, "crowd")}
          />
          <Text
            style={[
              styles.metricText,
              { color: getMetricColor(cafe.current_crowd_level, "crowd") },
            ]}
          >
            {cafe.current_crowd_level || "Crowd: Unknown"}
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.addressRow}>
          <Ionicons
            name="location-outline"
            size={14}
            color={colors.secondaryText}
          />
          <Text style={styles.address} numberOfLines={1}>
            {cafe.address}
          </Text>
        </View>
        <Animated.View
          style={[styles.directionsAnimated, { width: animWidth }]}
        >
          <TouchableOpacity
            style={styles.directionsButton}
            onPress={onDirections}
            onPressIn={expand}
            onPressOut={collapse}
            activeOpacity={0.85}
          >
            <Ionicons
              name="navigate"
              size={16}
              color={colors.primaryBackground}
            />
            <Animated.Text
              numberOfLines={1}
              style={[
                styles.directionsText,
                {
                  opacity: animWidth.interpolate({
                    inputRange: [38, 60, 120],
                    outputRange: [0, 0.5, 1],
                  }),
                },
              ]}
            >
              Go to Maps
            </Animated.Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  name: {
    color: colors.primaryText,
    fontSize: theme.fontSizes.large,
    fontWeight: "600",
    flex: 1,
  },
  updateTime: {
    color: colors.secondaryText,
    fontSize: theme.fontSizes.small,
  },
  metricsRow: {
    flexDirection: "row",
    marginBottom: theme.spacing.sm,
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  metricText: {
    fontSize: theme.fontSizes.small,
    marginLeft: theme.spacing.xs,
    fontWeight: "500",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  address: {
    color: colors.secondaryText,
    fontSize: theme.fontSizes.small,
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  directionsAnimated: {
    overflow: "hidden",
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.accentGreen,
  },
  directionsButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.sm,
    height: "100%",
  },
  directionsText: {
    color: colors.primaryBackground,
    fontSize: theme.fontSizes.small,
    fontWeight: "700",
    marginLeft: theme.spacing.xs,
  },
});

export default CafeListItem;
