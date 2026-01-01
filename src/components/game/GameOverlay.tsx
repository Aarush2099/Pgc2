import { motion } from "framer-motion";
import { Play, RotateCcw, Trophy, Leaf, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameOverlayProps {
  type: "start" | "gameOver" | "paused";
  score?: number;
  highScore?: number;
  onStart: () => void;
  onRestart?: () => void;
}

export const GameOverlay = ({ type, score = 0, highScore = 0, onStart, onRestart }: GameOverlayProps) => {
  const isNewHighScore = score > 0 && score >= highScore;

  return (
    <motion.div
      className="absolute inset-0 bg-foreground/60 backdrop-blur-sm flex items-center justify-center z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-card rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl border border-border"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {type === "start" && (
          <div className="text-center">
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Leaf className="text-primary" size={40} />
            </motion.div>
            <h2 className="font-display text-3xl font-bold text-foreground mb-2">
              Carbon Catcher
            </h2>
            <p className="text-muted-foreground mb-6">
              Collect eco-items 🌿 and avoid pollution ☁️
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={onStart}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-display text-lg py-6"
              >
                <Play size={24} className="mr-2" />
                Start Game
              </Button>
              <p className="text-sm text-muted-foreground">
                Use ← → arrow keys or touch to move
              </p>
            </div>
          </div>
        )}

        {type === "gameOver" && (
          <div className="text-center">
            {isNewHighScore ? (
              <motion.div
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/20 mb-6"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Trophy className="text-accent" size={40} />
              </motion.div>
            ) : (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                <Zap className="text-muted-foreground" size={40} />
              </div>
            )}
            
            <h2 className="font-display text-3xl font-bold text-foreground mb-2">
              {isNewHighScore ? "New High Score!" : "Game Over"}
            </h2>
            
            <div className="flex justify-center gap-8 my-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-1">Score</p>
                <p className="font-display text-3xl font-bold text-primary">{score}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-1">Best</p>
                <p className="font-display text-3xl font-bold text-accent">{Math.max(score, highScore)}</p>
              </div>
            </div>

            <Button 
              onClick={onRestart || onStart}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-display text-lg py-6"
            >
              <RotateCcw size={24} className="mr-2" />
              Play Again
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
