import React from "react";
import { Pressable, Text, View } from "react-native";
import { useStore } from "../src/store";
import { MAX_FREEZES, SHOP, ShopItem, balance, buy, canBuy, wear } from "../src/domain";
import { shadow } from "../src/theme";
import { C, Card, Icon, IconTile, Mascot, Pill, Screen, haptic, s } from "../src/ui";
function Price({ item, affordable }: { item: ShopItem; affordable: boolean }) {
  return (
    <Pill
      label={String(item.price)}
      icon={affordable ? "ellipse" : "lock-closed"}
      color={affordable ? C.gold : C.faint}
      background={affordable ? C.warningPale : "#F1F4F9"}
    />
  );
}
export default function Shop() {
  const { state, update } = useStore();
  const coins = balance(state);
  const { freezes, owned, outfit } = state.shop;
  const freeze = SHOP.find((i) => i.kind === "freeze")!;
  const purchase = (item: ShopItem) => {
    if (!canBuy(state, item)) return;
    haptic("success");
    void update((v) => buy(v, item.id));
  };
  return (
    <Screen>
      <View style={[s.row, { justifyContent: "center", marginBottom: 20 }]}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" }}>
          <Icon name="ellipse" color={C.white} size={20} />
        </View>
        <Text style={s.big}>{coins.toLocaleString()}</Text>
      </View>
      <Card style={s.row}>
        <IconTile name="snow" color="#0EA5E9" size={52} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={s.h3}>{freeze.title}</Text>
          <View style={[s.row, { gap: 4 }]}>
            {Array.from({ length: MAX_FREEZES }, (_, i) => (
              <Icon key={i} name={i < freezes ? "snow" : "snow-outline"} color={i < freezes ? "#0EA5E9" : C.line} size={18} />
            ))}
          </View>
        </View>
        {freezes < MAX_FREEZES ? (
          <Pressable onPress={() => purchase(freeze)} disabled={!canBuy(state, freeze)}>
            <Price item={freeze} affordable={coins >= freeze.price} />
          </Pressable>
        ) : (
          <Icon name="checkmark-circle" color={C.success} size={26} />
        )}
      </Card>
      <Text style={[s.h2, s.section, { marginTop: 10 }]}>Outfits</Text>
      <View style={[s.row, { flexWrap: "wrap", gap: 12 }]}>
        {SHOP.filter((i) => i.kind === "outfit").map((item) => {
          const has = owned.includes(item.id);
          const on = outfit === item.id;
          const affordable = coins >= item.price;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              onPress={() => {
                if (has) {
                  haptic();
                  void update((v) => wear(v, on ? null : item.id));
                } else purchase(item);
              }}
              style={({ pressed }) => [
                {
                  width: "47%",
                  backgroundColor: on ? C.primaryPale : C.white,
                  borderRadius: 22,
                  padding: 14,
                  alignItems: "center",
                  gap: 8,
                  borderWidth: 2,
                  borderColor: on ? C.primary : "transparent",
                  opacity: has || affordable ? 1 : 0.6,
                },
                shadow,
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <Mascot size={96} outfit={item.id} />
              <Text style={s.h3}>{item.title}</Text>
              {on ? (
                <Icon name="checkmark-circle" color={C.primary} size={24} />
              ) : has ? (
                <Pill label="Wear" icon="shirt" color={C.primary} />
              ) : (
                <Price item={item} affordable={affordable} />
              )}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
