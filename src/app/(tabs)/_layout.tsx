import { Tabs } from "expo-router";
import {
  LayoutDashboard,
  PackagePlus,
  UsersRound,
  Wallet,
  ReceiptText,
} from "lucide-react-native";
import { FontFamily, Palette } from "themes";

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="dashboard"
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Palette.surfaceBase },
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: Palette.accent,
        tabBarInactiveTintColor: Palette.textTertiary,
        tabBarStyle: {
          backgroundColor: Palette.surfaceBase,
          borderTopWidth: 0,
          elevation: 0,
          boxShadow: "none",
        },
        tabBarLabelStyle: {
          fontFamily: FontFamily.medium,
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Tổng quan",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="purchases"
        options={{
          title: "Nhập hàng",
          tabBarIcon: ({ color, size }) => (
            <PackagePlus color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="payroll"
        options={{
          title: "Tính lương",
          tabBarIcon: ({ color, size }) => (
            <UsersRound color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Chi phí",
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Chốt doanh thu",
          tabBarLabel: "Doanh thu",
          tabBarAccessibilityLabel: "Chốt doanh thu",
          tabBarIcon: ({ color, size }) => (
            <ReceiptText color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
