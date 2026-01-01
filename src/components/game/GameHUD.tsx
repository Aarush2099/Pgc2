import { motion, AnimatePresence } from "framer-motion";
import { Heart, Leaf, Trophy } from "lucide-react";

interface GameHUDProps {
  score: number;
  lives: number;
  maxLives: number;
  highScore: number;
}

export const GameHUD = ({ score, lives, maxLives, highScore }: GameHUDProps) => {
  return (
    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10">
      {/* Score */}
      <motion.div 
        className="flex items-center gap-2 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg"
        key={score}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 0.2 }}
      >
        <Leaf className="text-primary" size={24} />
        <span className="font-display text-2xl font-bold text-foreground score-glow">
          {score}
        </span>
      </motion.div>

      {/* High Score */}
      <div className="flex items-center gap-2 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg">
        <Trophy className="text-accent" size={20} />
        <span className="font-display text-lg font-semibold text-muted-foreground">
          {highScore}
        </span>
      </div>

      {/* Lives */}
      <div className="flex items-center gap-1 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg">
        <AnimatePresence mode="popLayout">
          {Array.from({ length: maxLives }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ 
                scale: i < lives ? 1 : 0.5, 
                opacity: i < lives ? 1 : 0.3 
              }}
              exit={{ scale: 0, rotate: -180 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <Heart 
                size={24} 
                className={i < lives ? "text-destructive fill-destructive" : "text-muted-foreground"}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
