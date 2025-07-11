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
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const colors = useMemo(() => ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3", "#54a0ff", "#a29bfe", "#fd79a8", "#00b894"], []);

  // Get screen dimensions safely
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const createConfettiPiece = useCallback((id: number): ConfettiPiece => ({
    id,
    x: Math.random() * dimensions.width,
    y: -Math.random() * 100 - 10, // Start above screen with some variation
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    scale: Math.random() * 0.6 + 0.4,
    velocityX: (Math.random() - 0.5) * 6,
    velocityY: Math.random() * 4 + 3,
    rotationSpeed: (Math.random() - 0.5) * 15,
  }), [dimensions.width, colors]);

  useEffect(() => {
    if (show && dimensions.width > 0) {
      // Create more confetti pieces for better coverage
      const newPieces: ConfettiPiece[] = [];
      for (let i = 0; i < 100; i++) {
        newPieces.push(createConfettiPiece(i));
      }
      setPieces(newPieces);

      const interval = setInterval(() => {
        setPieces(prev => 
          prev.map(piece => ({
            ...piece,
            x: piece.x + piece.velocityX,
            y: piece.y + piece.velocityY,
            rotation: piece.rotation + piece.rotationSpeed,
            velocityY: piece.velocityY + 0.15, // gravity
          })).filter(piece => piece.y < dimensions.height + 100)
        );
      }, 16);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        setPieces([]);
        onComplete?.();
      }, 4000); // Slightly longer duration

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [show, onComplete, dimensions, createConfettiPiece]);

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
