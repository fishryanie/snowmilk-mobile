import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { CalendarDays, ChevronDown } from "lucide-react-native";
import { ThemedText, ThemedView } from "components/base";
import { DatePicker, type DatePickerMethods } from "components/base/DatePicker";
import { FontFamily, Palette } from "themes";
import { dayKey } from "utils/format";
import { fullDayLabel, shiftDay, weekdayLabel } from "utils/calendar";

const DAYS_PER_PAGE = 7;
const PAGE_OFFSETS = [-1, 0, 1];

export function DaySelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (date: string) => void;
}) {
  const calendar = useRef<DatePickerMethods>(null);
  const strip = useRef<ScrollView>(null);
  const dragging = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [pageWidth, setPageWidth] = useState(0);
  const today = dayKey();
  const latestStart = shiftDay(today, 1 - DAYS_PER_PAGE);
  const [centerStart, setCenterStart] = useState(() => {
    const start = shiftDay(value, -3);
    return start > latestStart ? latestStart : start;
  });

  useEffect(() => () => clearTimeout(settleTimer.current), []);

  useLayoutEffect(() => {
    clearTimeout(settleTimer.current);
    if (pageWidth > 0)
      strip.current?.scrollTo({ x: pageWidth, animated: false });
  }, [centerStart, pageWidth]);

  const jumpTo = (date: string) => {
    if (date > dayKey()) return;
    clearTimeout(settleTimer.current);
    const start = shiftDay(date, -3);
    const lastStart = shiftDay(dayKey(), 1 - DAYS_PER_PAGE);
    setCenterStart(start > lastStart ? lastStart : start);
    strip.current?.scrollTo({ x: pageWidth, animated: false });
    onChange(date);
  };

  const recenter = (offset: number) => {
    if (!pageWidth) return;
    const page = Math.max(0, Math.min(2, Math.round(offset / pageWidth)));
    if (page === 1) return;
    // Recycle past pages, stopping the last page at today.
    setCenterStart((date) => {
      const start = shiftDay(date, (page - 1) * DAYS_PER_PAGE);
      const lastStart = shiftDay(dayKey(), 1 - DAYS_PER_PAGE);
      return start > lastStart ? lastStart : start;
    });
  };

  const settle = (offset: number) => {
    clearTimeout(settleTimer.current);
    if (!dragging.current) {
      // Web wheel scrolling has no momentum-end event.
      settleTimer.current = setTimeout(() => recenter(offset), 180);
    }
  };

  return (
    <ThemedView gap={12}>
      <ThemedView rowCenter gap={12}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Chọn ngày, hiện tại ${fullDayLabel(value)}`}
          onPress={() => calendar.current?.open()}
          style={{ flex: 1 }}
        >
          <ThemedView minHeight={44} rowCenter gap={8}>
            <CalendarDays size={17} color={Palette.accent} strokeWidth={1.5} />
            <ThemedText fontFamily={FontFamily.medium} fontSize={12}>
              {fullDayLabel(value)}
            </ThemedText>
            <ChevronDown size={13} color={Palette.textSecondary} />
          </ThemedView>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Về hôm nay"
          onPress={() => jumpTo(dayKey())}
        >
          <ThemedView minHeight={44} paddingHorizontal={2} rowCenter gap={6}>
            <ThemedView square={4} round={4} backgroundColor={Palette.accent} />
            <ThemedText
              color={Palette.accent}
              fontSize={11}
              fontFamily={FontFamily.medium}
            >
              Hôm nay
            </ThemedText>
          </ThemedView>
        </Pressable>
      </ThemedView>
      <View onLayout={(event) => setPageWidth(event.nativeEvent.layout.width)}>
        {pageWidth > 0 ? (
          <ScrollView
            ref={strip}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: pageWidth, y: 0 }}
            scrollEventThrottle={16}
            onScrollBeginDrag={() => {
              dragging.current = true;
              clearTimeout(settleTimer.current);
            }}
            onScrollEndDrag={(event) => {
              dragging.current = false;
              settle(event.nativeEvent.contentOffset.x);
            }}
            onScroll={(event) => {
              settle(event.nativeEvent.contentOffset.x);
            }}
            onMomentumScrollEnd={(event) => {
              clearTimeout(settleTimer.current);
              recenter(event.nativeEvent.contentOffset.x);
            }}
            accessibilityLabel="Danh sách ngày, vuốt ngang để xem ngày trước hoặc sau"
          >
            {PAGE_OFFSETS.filter(
              (page) => page !== 1 || centerStart < latestStart,
            ).map((page) => (
              <View
                key={page}
                style={{
                  width: pageWidth,
                  flexDirection: "row",
                }}
              >
                {Array.from({ length: DAYS_PER_PAGE }, (_, index) => {
                  const start = shiftDay(centerStart, page * DAYS_PER_PAGE);
                  const date = shiftDay(
                    start > latestStart ? latestStart : start,
                    index,
                  );
                  const selected = date === value;
                  const isToday = date === today;
                  return (
                    <Pressable
                      key={date}
                      accessibilityRole="button"
                      accessibilityLabel={`${fullDayLabel(date)}${isToday ? ", hôm nay" : ""}`}
                      accessibilityState={{ selected }}
                      onPress={() => {
                        if (date <= dayKey()) onChange(date);
                      }}
                      style={({ pressed }) => ({
                        flex: 1,
                        paddingHorizontal: 3,
                        opacity: pressed ? 0.65 : 1,
                      })}
                    >
                      <ThemedView
                        minHeight={70}
                        paddingVertical={4}
                        gap={9}
                        contentCenter
                      >
                        <ThemedText
                          color={
                            selected
                              ? Palette.textPrimary
                              : Palette.textSecondary
                          }
                          fontSize={11}
                          fontFamily={
                            selected ? FontFamily.medium : FontFamily.regular
                          }
                        >
                          {weekdayLabel(date)}
                        </ThemedText>
                        <ThemedView
                          minHeight={35}
                          minWidth={35}
                          paddingHorizontal={4}
                          radius={12}
                          contentCenter
                          backgroundColor={
                            selected ? Palette.surfaceMuted : "transparent"
                          }
                        >
                          <ThemedText
                            color={Palette.textPrimary}
                            fontFamily={
                              selected
                                ? FontFamily.semibold
                                : FontFamily.regular
                            }
                            fontVariant={["tabular-nums"]}
                            fontSize={16}
                            lineHeight={24}
                          >
                            {Number(date.slice(8))}
                          </ThemedText>
                        </ThemedView>
                        <ThemedView
                          square={3}
                          round={3}
                          backgroundColor={
                            isToday ? Palette.textTertiary : "transparent"
                          }
                        />
                      </ThemedView>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>
      <DatePicker
        ref={calendar}
        value={value}
        maxDate={today}
        onChange={(timestamp) => jumpTo(dayKey(new Date(timestamp * 1000)))}
      />
    </ThemedView>
  );
}
