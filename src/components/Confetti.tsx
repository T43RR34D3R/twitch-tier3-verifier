"use client";

import { useEffect, useState, useMemo, useCallback } from "react";

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

  const colors = useMemo(() => ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3", "#54a0ff", "#a29bfe", "#fd79a8", "#00b894"], []);

  const createConfettiPiece = useCallback((id: number): ConfettiPiece => {
    // Use viewport width directly for guaranteed full coverage
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    
    return {
      id,
      x: Math.random() * viewportWidth,
      y: -Math.random() * 100 - 10, // Start above screen with some variation
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      scale: Math.random() * 0.6 + 0.4,
      velocityX: (Math.random() - 0.5) * 6,
      velocityY: Math.random() * 4 + 3,
      rotationSpeed: (Math.random() - 0.5) * 15,
    };
  }, [colors]);

  useEffect(() => {
    if (show) {
      // Create confetti pieces for better coverage
      const newPieces: ConfettiPiece[] = [];
      for (let i = 0; i < 120; i++) {
        newPieces.push(createConfettiPiece(i));
      }
      setPieces(newPieces);

      const interval = setInterval(() => {
        setPieces(prev => {
          const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
          return prev.map(piece => ({
            ...piece,
            x: piece.x + piece.velocityX,
            y: piece.y + piece.velocityY,
            rotation: piece.rotation + piece.rotationSpeed,
            velocityY: piece.velocityY + 0.15, // gravity
          })).filter(piece => piece.y < viewportHeight + 100);
        });
      }, 16);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        setPieces([]);
        onComplete?.();
      }, 4000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [show, onComplete, createConfettiPiece]);

  if (!show) return null;

  return (
    <div 
      className="pointer-events-none z-50"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden'
      }}
    >
      {pieces.map(piece => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            left: `${piece.x}px`,
            top: `${piece.y}px`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
            transition: 'transform 0.016s linear',
          }}
        />
      ))}
    </div>
  );
}
