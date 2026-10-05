import { Pressable } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { ThemedView } from "components/base";
import { PageLayout, Palette } from "themes";

export type PageAction = {
  label: string;
  Icon: LucideIcon;
  onPress: () => void;
  active?: boolean;
  expanded?: boolean;
  indicator?: boolean;
};

export function PageActionBar({ actions }: { actions: PageAction[] }) {
  return (
    <ThemedView
      position="absolute"
      bottom={PageLayout.actionBottom}
      alignSelf="center"
      rowCenter
      gap={4}
      paddingHorizontal={8}
      paddingVertical={4}
      radius={30}
      backgroundColor={Palette.navigation}
      boxShadow="0 4px 14px rgba(0, 0, 0, 0.16)"
    >
      {actions.map(({ label, Icon, onPress, active, expanded, indicator }) => (
        <Pressable
          key={label}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={expanded === undefined ? undefined : { expanded }}
          onPress={onPress}
        >
          {({ pressed }) => (
            <ThemedView
              square={44}
              radius={22}
              contentCenter
              backgroundColor={
                active || pressed ? Palette.navigationSelected : "transparent"
              }
            >
              <Icon size={20} strokeWidth={1.6} color={Palette.onAccent} />
              {indicator ? (
                <ThemedView
                  position="absolute"
                  top={8}
                  right={8}
                  round={5}
                  backgroundColor={Palette.onAccent}
                />
              ) : null}
            </ThemedView>
          )}
        </Pressable>
      ))}
    </ThemedView>
  );
}
