import { motion } from "framer-motion";
import { Leaf, TreeDeciduous, Sun, Cloud, Factory, Flame } from "lucide-react";

export type ItemType = "leaf" | "tree" | "sun" | "smoke" | "factory" | "fire";

export interface FallingItemData {
  id: number;
  type: ItemType;
  x: number;
  isGood: boolean;
  points: number;
}

interface FallingItemProps {
  item: FallingItemData;
  gameHeight: number;
  fallDuration: number;
  onComplete: (id: number) => void;
}

const itemConfig: Record<ItemType, { icon: typeof Leaf; color: string; size: number }> = {
  leaf: { icon: Leaf, color: "text-primary", size: 32 },
  tree: { icon: TreeDeciduous, color: "text-success", size: 40 },
  sun: { icon: Sun, color: "text-accent", size: 36 },
  smoke: { icon: Cloud, color: "text-warning", size: 38 },
  factory: { icon: Factory, color: "text-game-pollutant", size: 42 },
  fire: { icon: Flame, color: "text-destructive", size: 34 },
};

export const FallingItem = ({ item, gameHeight, fallDuration, onComplete }: FallingItemProps) => {
  const config = itemConfig[item.type];
  const Icon = config.icon;

  return (
    <motion.div
      className={`absolute ${item.isGood ? "game-glow" : "pollutant-glow"} rounded-full p-2`}
      style={{ left: item.x }}
      initial={{ y: -50, rotate: 0, scale: 0.8 }}
      animate={{ 
        y: gameHeight + 50, 
        rotate: item.isGood ? 360 : -180,
        scale: [0.8, 1, 0.8]
      }}
      transition={{ 
        y: { duration: fallDuration, ease: "linear" },
        rotate: { duration: fallDuration, ease: "linear" },
        scale: { duration: fallDuration / 2, repeat: 2, ease: "easeInOut" }
      }}
      onAnimationComplete={() => onComplete(item.id)}
    >
      <div className={`${item.isGood ? "bg-card" : "bg-muted"} rounded-full p-3 shadow-lg`}>
        <Icon 
          size={config.size} 
          className={`${config.color} ${item.isGood ? "drop-shadow-md" : ""}`}
        />
      </div>
    </motion.div>
  );
};
