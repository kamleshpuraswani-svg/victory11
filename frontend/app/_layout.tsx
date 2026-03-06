import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { View, Text, StyleSheet, useWindowDimensions, Platform } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();

  // Apply constraint only on web and large screens
  const isLargeWeb = Platform.OS === 'web' && width > 500;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={styles.outerContainer}>
        <View style={[
          styles.innerContainer,
          isLargeWeb && styles.constrainedWidth
        ]}>
          {isLargeWeb && (
            <>
              {/* Mock Status Bar for Web */}
              <View style={styles.mockStatusBar}>
                <Text style={styles.mockTime}>9:41</Text>
                <View style={styles.mockNotch} />
                <View style={styles.mockIcons}>
                  <Text style={styles.mockIconText}>📶 🔋</Text>
                </View>
              </View>
            </>
          )}
          <View style={{ flex: 1, width: '100%' }}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
          </View>
          <StatusBar style="auto" />
        </View>
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#0f172a', // Dark navy background for the "laptop" area
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
  },
  constrainedWidth: {
    width: '100%',
    maxWidth: 400, // standard mobile width
    aspectRatio: 9 / 19.5, // modern phone ratio
    maxHeight: '94%',
    borderRadius: 44, // iPhone-like corners
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.6,
    shadowRadius: 36,
    elevation: 25,
    borderWidth: 10, // Thick bezel
    borderColor: '#1e293b',
    backgroundColor: '#fff',
  },
  mockStatusBar: {
    height: 44,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
  },
  mockTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  mockNotch: {
    width: 120,
    height: 25,
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    position: 'absolute',
    left: '50%',
    marginLeft: -60,
    top: 0,
  },
  mockIcons: {
    flexDirection: 'row',
  },
  mockIconText: {
    fontSize: 12,
  }
});
