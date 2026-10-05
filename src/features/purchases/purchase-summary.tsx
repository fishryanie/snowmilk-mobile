import { Coins, Package } from "lucide-react-native";
import { ThemedText, ThemedView } from "components/base";
import { FontFamily, Palette } from "themes";
import { money, number } from "utils/format";

export function PurchaseSummary({
  amount,
  quantity,
  pending,
  filtered,
}: {
  amount: number;
  quantity: number;
  count: number;
  pending: boolean;
  filtered: boolean;
}) {
  return (
    <ThemedView
      row
      gap={10}
      wrap
      accessibilityLabel={
        filtered ? "Tổng nhập theo bộ lọc" : "Tổng nhập trong ngày"
      }
    >
      <ThemedView
        rowCenter
        gap={7}
        paddingHorizontal={13}
        paddingVertical={9}
        radius={22}
        backgroundColor={Palette.surfaceMuted}
      >
        <Coins size={16} strokeWidth={1.5} color={Palette.textSecondary} />
        <ThemedText
          selectable
          fontSize={13}
          fontFamily={FontFamily.medium}
          fontVariant={["tabular-nums"]}
        >
          {pending ? "—" : money(amount)}
        </ThemedText>
      </ThemedView>
      <ThemedView
        rowCenter
        gap={7}
        paddingHorizontal={13}
        paddingVertical={9}
        radius={22}
        backgroundColor={Palette.surfaceMuted}
      >
        <Package size={16} strokeWidth={1.5} color={Palette.textSecondary} />
        <ThemedText selectable fontSize={12} color={Palette.textSecondary}>
          {pending ? "—" : number(quantity)} đơn vị mua
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}
