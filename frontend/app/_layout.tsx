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
    maxWidth: 500,
    // Add a mobile frame look
    borderRadius: 24,
    marginVertical: '2%', // Use percentage for zoom flexibility
    maxHeight: '96%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
});
