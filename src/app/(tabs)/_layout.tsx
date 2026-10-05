import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  LayoutDashboard,
  PackagePlus,
  UsersRound,
  Wallet,
  ReceiptText,
} from "lucide-react-native";
import { ThemedView } from "components/base";
import { FontFamily, Palette } from "themes";
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <ThemedView flex={1} backgroundColor={Palette.surfaceBase}>
      <Tabs
        initialRouteName="dashboard"
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: Palette.surfaceBase },
          tabBarHideOnKeyboard: true,
          animation: "none",
          tabBarActiveTintColor: Palette.onAccent,
          tabBarInactiveTintColor: Palette.navigationInactive,
          tabBarActiveBackgroundColor: "transparent",
          tabBarStyle: {
            position: "absolute",
            bottom: Math.max(insets.bottom, 12),
            left: 20,
            right: 20,
            height: 66,
            borderRadius: 33,
            backgroundColor: Palette.navigation,
            borderTopWidth: 0,
            paddingTop: 8,
            paddingBottom: 8,
            paddingHorizontal: 8,
            boxShadow: "0 6px 18px rgba(35, 35, 33, 0.14)",
          },
          tabBarItemStyle: { borderRadius: 25, marginHorizontal: 2 },
          tabBarLabelStyle: {
            fontFamily: FontFamily.regular,
            fontSize: 9,
            lineHeight: 13,
            flexShrink: 0,
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Tổng quan",
            tabBarIcon: (props) => (
              <ThemedView
                square={32}
                round={32}
                contentCenter
                backgroundColor={
                  props.focused ? Palette.navigationSelected : "transparent"
                }
              >
                <LayoutDashboard
                  color={props.color}
                  size={20}
                  strokeWidth={1.6}
                />
              </ThemedView>
            ),
          }}
        />
        <Tabs.Screen
          name="purchases"
          options={{
            title: "Nhập hàng",
            tabBarIcon: (props) => (
              <ThemedView
                square={32}
                round={32}
                contentCenter
                backgroundColor={
                  props.focused ? Palette.navigationSelected : "transparent"
                }
              >
                <PackagePlus color={props.color} size={20} strokeWidth={1.6} />
              </ThemedView>
            ),
          }}
        />
        <Tabs.Screen
          name="payroll"
          options={{
            title: "Tính lương",
            tabBarIcon: (props) => (
              <ThemedView
                square={32}
                round={32}
                contentCenter
                backgroundColor={
                  props.focused ? Palette.navigationSelected : "transparent"
                }
              >
                <UsersRound color={props.color} size={20} strokeWidth={1.6} />
              </ThemedView>
            ),
          }}
        />
        <Tabs.Screen
          name="expenses"
          options={{
            title: "Chi phí",
            tabBarIcon: (props) => (
              <ThemedView
                square={32}
                round={32}
                contentCenter
                backgroundColor={
                  props.focused ? Palette.navigationSelected : "transparent"
                }
              >
                <Wallet color={props.color} size={20} strokeWidth={1.6} />
              </ThemedView>
            ),
          }}
        />
        <Tabs.Screen
          name="sales"
          options={{
            title: "Chốt doanh thu",
            tabBarLabel: "Doanh thu",
            tabBarAccessibilityLabel: "Chốt doanh thu",
            tabBarIcon: (props) => (
              <ThemedView
                square={32}
                round={32}
                contentCenter
                backgroundColor={
                  props.focused ? Palette.navigationSelected : "transparent"
                }
              >
                <ReceiptText color={props.color} size={20} strokeWidth={1.6} />
              </ThemedView>
            ),
          }}
        />
      </Tabs>
    </ThemedView>
  );
}
