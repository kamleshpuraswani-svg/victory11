import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();

  // Apply constraint only on web and large screens
  const isLargeScreen = Platform.OS === 'web' && width > 500;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={styles.outerContainer}>
        <View style={[
          styles.innerContainer,
          isLargeScreen && styles.constrainedWidth
        ]}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </View>
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#0f172a', // Darker navy for better contrast
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
  },
  constrainedWidth: {
    width: '100%',
    maxWidth: 420, // More standard mobile width
    aspectRatio: 9 / 19.5, // Modern smartphone aspect ratio
    maxHeight: '92%',
    borderRadius: 40, // More rounded corners like an iPhone
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 25,
    borderWidth: 8, // Thicker 'bezel'
    borderColor: '#1e293b', // Match the dark theme
    backgroundColor: '#fff',
  },
});
