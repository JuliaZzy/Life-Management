export type TarotOrientation = "upright" | "reversed";

export type TarotCard = { id: string; name: string; image: string; keywords: string[] };

export type TarotDraw = TarotCard & { position: number; orientation: TarotOrientation; date: string };

const majorNames = ["愚人", "魔术师", "女祭司", "皇后", "皇帝", "教皇", "恋人", "战车", "力量", "隐者", "命运之轮", "正义", "倒吊人", "死神", "节制", "恶魔", "塔", "星星", "月亮", "太阳", "审判", "世界"];
const suits = ["权杖", "圣杯", "宝剑", "星币"];

export const tarotDeck: TarotCard[] = [
  ...majorNames.map((name, index) => ({ id: `major-${index}`, name, image: `/marseille/720px/${String(index).padStart(2, "0")}_${name}.png`, keywords: ["观察", "节奏"] })),
  ...suits.flatMap((suit) => Array.from({ length: 14 }, (_, index) => ({ id: `${suit}-${index + 1}`, name: `${suit}${index + 1}`, image: `/marseille/720px/${suit}${String(index + 1).padStart(2, "0")}.png`, keywords: ["行动", "复盘"] })))
];

export function shuffleTarot(seed = Math.random()) {
  const cards = [...tarotDeck];
  let cursor = Math.floor(seed * cards.length);
  for (let index = cards.length - 1; index > 0; index -= 1) {
    cursor = (cursor * 9301 + 49297) % 233280;
    const swap = cursor % (index + 1);
    [cards[index], cards[swap]] = [cards[swap], cards[index]];
  }
  return cards.map((card, index) => ({ ...card, position: index + 1, orientation: Math.random() > 0.5 ? "upright" as const : "reversed" as const }));
}

export function drawTarot(cards: ReturnType<typeof shuffleTarot>, date = new Date().toISOString().slice(0, 10)): TarotDraw {
  const card = cards[0];
  return { ...card, date };
}
