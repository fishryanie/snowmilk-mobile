import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { Platform } from "react-native";
import { configureApi, normalizeServerUrl } from "./client";

const serverUrl = normalizeServerUrl(
  process.env.EXPO_PUBLIC_API_URL ?? "https://uangon.vercel.app",
);
const Context = createContext<{ ready: boolean; serverUrl: string } | null>(null);

async function restoreSession() {
  if (Platform.OS === "web") return "";
  const [stored, cookie] = await Promise.all([
    AsyncStorage.getItem("snowmilk-connection"),
    SecureStore.getItemAsync("snowmilk-session"),
  ]);
  if (!stored || !cookie) return "";
  const saved = JSON.parse(stored) as { serverUrl?: string };
  // Restore an existing native session only for the configured server.
  return saved.serverUrl && normalizeServerUrl(saved.serverUrl) === serverUrl
    ? cookie
    : "";
}

export function ApiProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    restoreSession()
      .catch(() => "")
      .then((cookie) => {
        if (!active) return;
        configureApi(serverUrl, cookie);
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  const value = useMemo(() => ({ ready, serverUrl }), [ready]);
  return (
    <Context.Provider value={value}>{ready ? children : null}</Context.Provider>
  );
}

export function useApi() {
  const value = useContext(Context);
  if (!value) throw new Error("ApiProvider is missing");
  return value;
}
