/**
 * Centralized location and map constants for the GasPh application.
 * This file serves as the single source of truth for all location-related constants.
 */

import { Region } from 'react-native-maps';

// Location data interface
export interface LocationData {
  latitude: number;
  longitude: number;
  isDefaultLocation?: boolean;
}

// Default location for Metro Manila (used when location permission is denied or error occurs)
export const DEFAULT_LOCATION: LocationData = {
  latitude: 14.5995,
  longitude: 120.9842,
  isDefaultLocation: true,
};

// Default map region (Metro Manila with appropriate zoom level)
export const DEFAULT_MAP_REGION: Region = {
  ...DEFAULT_LOCATION,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

// Center of Philippines (used for country-wide view)
export const PHILIPPINES_CENTER: LocationData = {
  latitude: 12.8797,
  longitude: 121.774,
  isDefaultLocation: true,
};

// Philippines region with appropriate zoom level for country-wide view
export const PHILIPPINES_WIDE_REGION: Region = {
  ...PHILIPPINES_CENTER,
  latitudeDelta: 15,
  longitudeDelta: 15,
};

// Philippines map boundaries (to prevent panning too far)
export const PHILIPPINES_BOUNDS = {
  sw: { latitude: 4.0, longitude: 116.0 }, // Southwest corner
  ne: { latitude: 21.5, longitude: 127.5 }, // Northeast corner
};

// Zoom levels
export const MIN_ZOOM_LEVEL = 6; // Prevent zooming out too far
export const MAX_ZOOM_LEVEL = 18; // Limit max zoom

// Standard zoom levels for different scenarios
export const ZOOM_LEVELS = {
  COUNTRY: { latitudeDelta: 15, longitudeDelta: 15 }, // Whole country view
  REGION: { latitudeDelta: 1, longitudeDelta: 1 }, // Regional view
  CITY: { latitudeDelta: 0.1, longitudeDelta: 0.1 }, // City view
  NEIGHBORHOOD: { latitudeDelta: 0.01, longitudeDelta: 0.01 }, // Neighborhood view
  STREET: { latitudeDelta: 0.005, longitudeDelta: 0.005 }, // Street view
};

// Animation durations (in milliseconds)
export const ANIMATION_DURATION = {
  SHORT: 200, // For quick animations (e.g., boundary snapping)
  MEDIUM: 300, // For standard animations (e.g., marker press)
  LONG: 500, // For more noticeable animations (e.g., "My Location" button)
};

// Location request timeouts (in milliseconds)
export const LOCATION_TIMEOUT = {
  INITIAL: 20000, // Initial location request timeout
  REFRESH: 20000, // Location refresh timeout
};

// Location permission storage key
export const LOCATION_PERMISSION_KEY = 'gasph_location_permission_status';
