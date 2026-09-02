import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';

import { copy } from '@/lib/copy';
import { theme } from '@/theme';

import { Text } from './Text';

type Props = {
  /** Local file URIs already chosen. */
  value: string[];
  onChange: (uris: string[]) => void;
  max: number;
  label?: string;
  hint?: string;
};

/**
 * Photo strip with camera + library entry points. Holds local URIs only;
 * uploading happens once at submit time (lib/storage), so an abandoned form
 * never leaves orphan files in the bucket.
 */
export function PhotoPicker({ value, onChange, max, label, hint }: Props) {
  const full = value.length >= max;

  async function addFrom(source: 'camera' | 'library') {
    const remaining = max - value.length;
    if (remaining <= 0) return;

    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(copy.common.appName, copy.photos.permissionDenied);
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: 'images',
      quality: 0.6,
    };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync({
            ...options,
            allowsMultipleSelection: true,
            selectionLimit: remaining,
          });

    if (result.canceled) return;
    onChange([...value, ...result.assets.map((asset) => asset.uri)].slice(0, max));
  }

  return (
    <View style={styles.wrap}>
      {label ? <Text variant="label">{label}</Text> : null}

      <View style={styles.grid}>
        {value.map((uri) => (
          <View key={uri} style={styles.thumbWrap}>
            <Image source={{ uri }} style={styles.thumb} accessibilityIgnoresInvertColors />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.photos.remove}
              hitSlop={8}
              onPress={() => onChange(value.filter((item) => item !== uri))}
              style={styles.remove}
            >
              <Ionicons name="close" size={14} color={theme.colors.textOnPrimary} />
            </Pressable>
          </View>
        ))}

        {full ? null : (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.photos.takePhoto}
              onPress={() => void addFrom('camera')}
              style={({ pressed }) => [styles.add, pressed && styles.pressed]}
            >
              <Ionicons name="camera-outline" size={22} color={theme.colors.primary} />
              <Text variant="caption" color="primary">
                {copy.photos.camera}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.photos.fromLibrary}
              onPress={() => void addFrom('library')}
              style={({ pressed }) => [styles.add, pressed && styles.pressed]}
            >
              <Ionicons name="images-outline" size={22} color={theme.colors.primary} />
              <Text variant="caption" color="primary">
                {copy.photos.gallery}
              </Text>
            </Pressable>
          </>
        )}
      </View>

      <Text variant="caption" color="textSecondary">
        {hint ?? copy.photos.hint(value.length, max)}
      </Text>
    </View>
  );
}

const THUMB = 88;

const styles = StyleSheet.create({
  wrap: { gap: theme.spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  thumbWrap: { width: THUMB, height: THUMB },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    backgroundColor: theme.colors.surfaceMuted,
  },
  remove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.text,
  },
  add: {
    width: THUMB,
    height: THUMB,
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    borderWidth: theme.layout.hairline,
    borderStyle: 'dashed',
    borderColor: theme.colors.primaryBorder,
    backgroundColor: theme.colors.primarySurface,
  },
  pressed: { opacity: 0.8 },
});
