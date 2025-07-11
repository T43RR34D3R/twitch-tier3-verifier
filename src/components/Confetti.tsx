"use client";

import { useEffect, useState, useMemo } from "react";

interface ConfettiProps {
  show: boolean;
  onComplete?: () => void;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  velocityX: number;
  velocityY: number;
  rotationSpeed: number;
}

export default function Confetti({ show, onComplete }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  const colors = useMemo(() => ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3", "#54a0ff"], []);

  useEffect(() => {
    if (show) {
      const newPieces: ConfettiPiece[] = [];
      for (let i = 0; i < 50; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: -10,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          scale: Math.random() * 0.5 + 0.5,
          velocityX: (Math.random() - 0.5) * 4,
          velocityY: Math.random() * 3 + 2,
          rotationSpeed: (Math.random() - 0.5) * 10,
        });
      }
      setPieces(newPieces);

      const interval = setInterval(() => {
        setPieces(prev => 
          prev.map(piece => ({
            ...piece,
            x: piece.x + piece.velocityX,
            y: piece.y + piece.velocityY,
            rotation: piece.rotation + piece.rotationSpeed,
            velocityY: piece.velocityY + 0.1, // gravity
          })).filter(piece => piece.y < window.innerHeight + 100)
        );
      }, 16);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        setPieces([]);
        onComplete?.();
      }, 3000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [show, onComplete, colors]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map(piece => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            left: piece.x,
            top: piece.y,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
            transition: 'transform 0.016s linear',
          }}
        />
      ))}
    </div>
  );
}
