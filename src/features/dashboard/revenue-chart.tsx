import { useState } from "react";
import { ScrollView } from "react-native";
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect, Line, Text as SvgText } from "react-native-svg";
import { ChartNoAxesColumn } from "lucide-react-native";
import { ThemedText, ThemedView } from "components/base";
import { Palette } from "themes";
import type { Dashboard } from "types/domain";
import { money, number } from "utils/format";

export function RevenueChart({ daily }: { daily: Dashboard["daily"] }) {
  const [availableWidth, setAvailableWidth] = useState(260);
  const days = [...daily].sort((left, right) => left.date.localeCompare(right.date));
  if (!days.some((day) => day.revenue > 0)) {
    return (
      <ThemedView gap={10} paddingVertical={28} contentCenter>
        <ThemedView square={44} radius={14} contentCenter backgroundColor={Palette.surfaceMuted}>
          <ChartNoAxesColumn color={Palette.textTertiary} size={22} strokeWidth={1.5} />
        </ThemedView>
        <ThemedText fontSize={12} lineHeight={20} textAlign="center" color={Palette.textSecondary}>
          Chưa có doanh thu trong kỳ này.{"\n"}Chọn khoảng thời gian khác để xem báo cáo.
        </ThemedText>
      </ThemedView>
    );
  }
  const maximum = Math.max(...days.map((day) => day.revenue), 1);
  const magnitude = 10 ** Math.floor(Math.log10(maximum));
  const ceiling = Math.ceil(maximum / magnitude) * magnitude;
  const divisor = ceiling >= 1000000 ? 1000000 : ceiling >= 1000 ? 1000 : 1;
  const unit = divisor === 1000000 ? "Triệu ₫" : divisor === 1000 ? "Nghìn ₫" : "₫";
  const width = Math.max(days.length * 42, availableWidth);
  const slot = width / days.length;
  const barWidth = Math.min(36, slot * 0.5);
  const chartHeight = 130;
  const baseline = 145;
  const label = "Doanh thu theo ngày: " + days.map((day) =>
    day.date.slice(8, 10) + "/" + day.date.slice(5, 7) + ": " + money(day.revenue),
  ).join("; ");

  return (
    <ThemedView gap={4} accessible accessibilityRole="image" accessibilityLabel={label}>
      <ThemedText fontSize={10} color={Palette.textTertiary}>{unit}</ThemedText>
      <ThemedView row gap={8}>
        <ThemedView width={30} height={178}>
          {[1, 0.5, 0].map((fraction) => (
            <ThemedText key={fraction} position="absolute"
              top={baseline - fraction * chartHeight - 7} right={0}
              fontSize={10} color={Palette.textTertiary}>
              {number((ceiling * fraction) / divisor)}
            </ThemedText>
          ))}
        </ThemedView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}
          onLayout={({ nativeEvent }) => setAvailableWidth(nativeEvent.layout.width)}>
          <Svg width={width} height={178}>
            <Defs>
              <SvgGradient id="revenue-bar" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={Palette.accent} stopOpacity={0.9} />
                <Stop offset="1" stopColor={Palette.accent} stopOpacity={0.4} />
              </SvgGradient>
            </Defs>
            {[0, 0.5, 1].map((fraction) => (
              <Line key={fraction} x1={0} x2={width}
                y1={baseline - fraction * chartHeight} y2={baseline - fraction * chartHeight}
                stroke={Palette.borderSubtle} strokeDasharray={fraction === 0 ? undefined : "3 5"} />
            ))}
            {days.map((day, index) => {
              const height = Math.max(day.revenue, 0) / ceiling * chartHeight;
              return (
                <Rect key={day.date} x={(index + 0.5) * slot - barWidth / 2}
                  y={baseline - height} width={barWidth} height={height}
                  fill={index === days.length - 1 ? Palette.accent : "url(#revenue-bar)"} rx={5} />
              );
            })}
            {days.map((day, index) => (
              <SvgText key={day.date} x={(index + 0.5) * slot} y={168}
                textAnchor="middle" fontSize={10} fill={Palette.textTertiary}>
                {day.date.slice(8, 10) + "/" + day.date.slice(5, 7)}
              </SvgText>
            ))}
          </Svg>
        </ScrollView>
      </ThemedView>
    </ThemedView>
  );
}
