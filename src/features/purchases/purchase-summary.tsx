import { Coins, Package } from "lucide-react-native";
import { ThemedText, ThemedView } from "components/base";
import { SummaryPill } from "components/molecules/page-heading";
import { FontFamily, NumericFontVariant, Palette } from "themes";
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
      <SummaryPill
        icon={
          <Coins size={16} strokeWidth={1.5} color={Palette.textSecondary} />
        }
      >
        <ThemedText
          selectable
          fontSize={13}
          fontFamily={FontFamily.medium}
          fontVariant={NumericFontVariant}
        >
          {pending ? "—" : money(amount)}
        </ThemedText>
      </SummaryPill>
      <SummaryPill
        icon={
          <Package size={16} strokeWidth={1.5} color={Palette.textSecondary} />
        }
      >
        <ThemedText selectable fontSize={12} color={Palette.textSecondary}>
          {pending ? "—" : number(quantity)} đơn vị mua
        </ThemedText>
      </SummaryPill>
    </ThemedView>
  );
}
