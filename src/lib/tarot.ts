export type TarotOrientation = "upright" | "reversed";

export type TarotCard = { id: string; name: string; image: string; keywords: string[] };

export type TarotDraw = TarotCard & { position: number; orientation: TarotOrientation; date: string };

export { describeTarotCard } from "./tarot-readings";

const majorNames = ["愚人", "魔术师", "女祭司", "皇后", "皇帝", "教皇", "恋人", "战车", "力量", "隐者", "命运之轮", "正义", "倒吊人", "死神", "节制", "恶魔", "塔", "星星", "月亮", "太阳", "审判", "世界"];
const suits = ["权杖", "圣杯", "宝剑", "星币"];
const majorFiles = [
  "00_Le_Mat", "01_Le_Bateleur", "02_La_Papesse", "03_L_Imperatrice", "04_L_Empereur", "05_Le_Pape",
  "06_L_Amoureux", "07_Le_Chariot", "11_La_Force", "09_L_Ermite", "10_La_Roue_de_Fortune", "08_La_Justice",
  "12_Le_Pendu", "13_La_Mort", "14_Temperance", "15_Le_Diable", "16_La_Maison_Dieu", "17_L_Etoile",
  "18_La_Lune", "19_Le_Soleil", "20_Le_Jugement", "21_Le_Monde"
];
const suitFiles: Record<string, string> = { "权杖": "Wands", "圣杯": "Cups", "宝剑": "Swords", "星币": "Pents" };

export const tarotDeck: TarotCard[] = [
  ...majorNames.map((name, index) => ({ id: `major-${index}`, name, image: `/marseille/720px/${majorFiles[index]}.png`, keywords: ["观察", "节奏"] })),
  ...suits.flatMap((suit) => Array.from({ length: 14 }, (_, index) => ({ id: `${suit}-${index + 1}`, name: `${suit}${index + 1}`, image: `/marseille/720px/${suitFiles[suit]}${String(index + 1).padStart(2, "0")}.png`, keywords: ["行动", "复盘"] })))
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
