import { motion } from "framer-motion";
import { ShoppingBasket } from "lucide-react";

interface PlayerProps {
  x: number;
  isHit: boolean;
  collected: boolean;
}

export const Player = ({ x, isHit, collected }: PlayerProps) => {
  return (
    <motion.div
      className="absolute bottom-4 flex flex-col items-center"
      style={{ left: x }}
      animate={{ 
        x: isHit ? [0, -5, 5, -5, 5, 0] : 0,
        scale: collected ? [1, 1.15, 1] : 1
      }}
      transition={{ 
        x: { duration: 0.3 },
        scale: { duration: 0.2 }
      }}
    >
      <div 
        className={`
          relative p-4 rounded-2xl transition-all duration-200
          ${isHit 
            ? "bg-destructive/20 border-2 border-destructive" 
            : collected 
              ? "bg-success/20 border-2 border-success" 
              : "bg-primary/20 border-2 border-primary"
          }
          game-shadow
        `}
      >
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-4 h-4 rounded-full bg-primary" />
          </motion.div>
        </div>
        <ShoppingBasket 
          size={48} 
          className={`
            transition-colors duration-200
            ${isHit ? "text-destructive" : collected ? "text-success" : "text-primary"}
          `}
        />
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-2 bg-game-ground rounded-full opacity-30" />
      </div>
    </motion.div>
  );
};
