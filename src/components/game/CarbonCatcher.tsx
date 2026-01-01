import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { FallingItem, FallingItemData, ItemType } from "./FallingItem";
import { Player } from "./Player";
import { GameHUD } from "./GameHUD";
import { GameOverlay } from "./GameOverlay";

type GameState = "idle" | "playing" | "gameOver";

const GOOD_ITEMS: ItemType[] = ["leaf", "tree", "sun"];
const BAD_ITEMS: ItemType[] = ["smoke", "factory", "fire"];

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 80;
const COLLECT_ZONE_TOP = GAME_HEIGHT - 100;
const COLLECT_ZONE_BOTTOM = GAME_HEIGHT - 20;

export const CarbonCatcher = () => {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("carbonCatcherHighScore");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
  const [items, setItems] = useState<FallingItemData[]>([]);
  const [isHit, setIsHit] = useState(false);
  const [collected, setCollected] = useState(false);
  const [fallDuration, setFallDuration] = useState(3);
  
  const gameRef = useRef<HTMLDivElement>(null);
  const itemIdRef = useRef(0);
  const touchStartRef = useRef<number | null>(null);

  const maxLives = 3;

  // Spawn items
  useEffect(() => {
    if (gameState !== "playing") return;

    const spawnInterval = setInterval(() => {
      const isGood = Math.random() > 0.35; // 65% good items
      const itemTypes = isGood ? GOOD_ITEMS : BAD_ITEMS;
      const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
      
      const newItem: FallingItemData = {
        id: itemIdRef.current++,
        type,
        x: Math.random() * (GAME_WIDTH - 60) + 10,
        isGood,
        points: isGood ? (type === "sun" ? 15 : type === "tree" ? 10 : 5) : -1,
      };

      setItems(prev => [...prev, newItem]);
    }, 1200 - Math.min(score * 5, 600)); // Speed up spawning as score increases

    return () => clearInterval(spawnInterval);
  }, [gameState, score]);

  // Increase difficulty
  useEffect(() => {
    if (gameState === "playing") {
      const newDuration = Math.max(1.5, 3 - score * 0.02);
      setFallDuration(newDuration);
    }
  }, [score, gameState]);

  // Check collisions
  useEffect(() => {
    if (gameState !== "playing") return;

    const checkCollisions = () => {
      setItems(prevItems => {
        const remainingItems: FallingItemData[] = [];
        
        prevItems.forEach(item => {
          // Calculate item position based on animation progress
          const itemElement = document.querySelector(`[data-item-id="${item.id}"]`);
          if (!itemElement) {
            remainingItems.push(item);
            return;
          }

          const itemRect = itemElement.getBoundingClientRect();
          const gameRect = gameRef.current?.getBoundingClientRect();
          
          if (!gameRect) {
            remainingItems.push(item);
            return;
          }

          const itemY = itemRect.top - gameRect.top + itemRect.height / 2;
          const itemCenterX = item.x + 30;
          const playerCenterX = playerX + PLAYER_WIDTH / 2;
          
          // Check if item is in collection zone
          if (itemY >= COLLECT_ZONE_TOP && itemY <= COLLECT_ZONE_BOTTOM) {
            const distance = Math.abs(itemCenterX - playerCenterX);
            
            if (distance < 60) {
              // Collision detected!
              if (item.isGood) {
                setScore(prev => prev + item.points);
                setCollected(true);
                setTimeout(() => setCollected(false), 200);
              } else {
                setLives(prev => {
                  const newLives = prev - 1;
                  if (newLives <= 0) {
                    setGameState("gameOver");
                  }
                  return newLives;
                });
                setIsHit(true);
                setTimeout(() => setIsHit(false), 300);
              }
              return; // Don't add to remaining items
            }
          }
          
          remainingItems.push(item);
        });
        
        return remainingItems;
      });
    };

    const collisionInterval = setInterval(checkCollisions, 50);
    return () => clearInterval(collisionInterval);
  }, [gameState, playerX]);

  // Save high score
  useEffect(() => {
    if (gameState === "gameOver" && score > highScore) {
      setHighScore(score);
      localStorage.setItem("carbonCatcherHighScore", score.toString());
    }
  }, [gameState, score, highScore]);

  // Keyboard controls
  useEffect(() => {
    if (gameState !== "playing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const speed = 30;
      if (e.key === "ArrowLeft") {
        setPlayerX(prev => Math.max(0, prev - speed));
      } else if (e.key === "ArrowRight") {
        setPlayerX(prev => Math.min(GAME_WIDTH - PLAYER_WIDTH, prev + speed));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  // Touch controls
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (gameState !== "playing" || touchStartRef.current === null) return;
    
    const touchX = e.touches[0].clientX;
    const gameRect = gameRef.current?.getBoundingClientRect();
    if (!gameRect) return;

    const relativeX = touchX - gameRect.left - PLAYER_WIDTH / 2;
    setPlayerX(Math.max(0, Math.min(GAME_WIDTH - PLAYER_WIDTH, relativeX)));
  }, [gameState]);

  const handleItemComplete = useCallback((id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const startGame = useCallback(() => {
    setGameState("playing");
    setScore(0);
    setLives(maxLives);
    setItems([]);
    setPlayerX(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
    setFallDuration(3);
    itemIdRef.current = 0;
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-game-sky-start to-game-sky-end">
      <h1 className="font-display text-4xl font-bold text-foreground mb-4 drop-shadow-lg">
        🌿 Carbon Catcher
      </h1>
      
      <div
        ref={gameRef}
        className="relative overflow-hidden rounded-3xl shadow-2xl border-4 border-primary/20"
        style={{ 
          width: GAME_WIDTH, 
          height: GAME_HEIGHT,
          background: "var(--gradient-sky)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* Ground */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-16 bg-game-ground"
          style={{
            borderTopLeftRadius: "50% 20px",
            borderTopRightRadius: "50% 20px",
          }}
        />

        {/* Decorative clouds */}
        <div className="absolute top-20 left-8 w-16 h-8 bg-white/30 rounded-full blur-sm" />
        <div className="absolute top-32 right-12 w-20 h-10 bg-white/20 rounded-full blur-sm" />

        <GameHUD score={score} lives={lives} maxLives={maxLives} highScore={highScore} />

        <AnimatePresence>
          {items.map(item => (
            <div key={item.id} data-item-id={item.id}>
              <FallingItem
                item={item}
                gameHeight={GAME_HEIGHT}
                fallDuration={fallDuration}
                onComplete={handleItemComplete}
              />
            </div>
          ))}
        </AnimatePresence>

        <Player x={playerX} isHit={isHit} collected={collected} />

        <AnimatePresence>
          {gameState === "idle" && (
            <GameOverlay type="start" onStart={startGame} highScore={highScore} />
          )}
          {gameState === "gameOver" && (
            <GameOverlay 
              type="gameOver" 
              score={score} 
              highScore={highScore} 
              onStart={startGame}
              onRestart={startGame}
            />
          )}
        </AnimatePresence>
      </div>

      <p className="mt-4 text-muted-foreground text-center max-w-sm">
        Part of <a href="https://carbonconversations.lovable.dev" className="text-primary hover:underline font-semibold">Carbon Conversations</a>
      </p>
    </div>
  );
};
