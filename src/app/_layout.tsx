import { useEffect } from "react";
import { AppState } from "react-native";
import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import { BeVietnamPro_400Regular } from "@expo-google-fonts/be-vietnam-pro/400Regular";
import { BeVietnamPro_500Medium } from "@expo-google-fonts/be-vietnam-pro/500Medium";
import { BeVietnamPro_600SemiBold } from "@expo-google-fonts/be-vietnam-pro/600SemiBold";
import { BeVietnamPro_700Bold } from "@expo-google-fonts/be-vietnam-pro/700Bold";
import { ApiProvider } from "api/provider";
import { ThemedView } from "components/base";
import { Palette } from "themes";
const client = new QueryClient();
export default function RootLayout() {
  const [loaded, error] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });
  useEffect(() => {
    const sub = AppState.addEventListener("change", (status) =>
      focusManager.setFocused(status === "active"),
    );
    return () => sub.remove();
  }, []);
  if (!loaded && !error) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={client}>
          <ApiProvider>
            <BottomSheetModalProvider>
              <StatusBar style="dark" />
              <Stack
                screenLayout={({ children }) => (
                  <ThemedView
                    flex={1}
                    safePaddingTop
                    backgroundColor={Palette.surfaceBase}
                  >
                    {children}
                  </ThemedView>
                )}
                screenOptions={{
                  contentStyle: { backgroundColor: Palette.surfaceBase },
                  headerShown: false,
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="editor"
                  options={{
                    title: "Ghi nhận dữ liệu",
                    presentation: "fullScreenModal",
                    gestureEnabled: false,
                  }}
                />
              </Stack>
            </BottomSheetModalProvider>
          </ApiProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
