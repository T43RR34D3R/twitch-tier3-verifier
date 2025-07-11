"use client";

import { useEffect, useState } from "react";

interface ProgressIndicatorProps {
  currentStep: number;
  steps: string[];
}

export default function ProgressIndicator({ currentStep, steps }: ProgressIndicatorProps) {
  const [animatedStep, setAnimatedStep] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedStep(currentStep);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <div className="w-full max-w-md mx-auto mb-6">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center relative flex-1">
            {/* Step Circle */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ease-in-out transform ${
                index < animatedStep
                  ? "bg-green-500 text-white scale-110"
                  : index === animatedStep
                  ? "bg-purple-600 text-white scale-110 animate-pulse"
                  : "bg-gray-300 text-gray-600 scale-100"
              }`}
            >
              {index < animatedStep ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            
            {/* Step Label */}
            <div
              className={`text-xs text-center mt-2 transition-all duration-300 ${
                index <= animatedStep ? "text-black font-medium" : "text-gray-500"
              }`}
            >
              {step}
            </div>

            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div className="absolute top-5 left-1/2 w-full h-0.5 -z-10">
                <div
                  className={`h-full transition-all duration-700 ease-in-out ${
                    index < animatedStep ? "bg-green-500" : "bg-gray-300"
                  }`}
                  style={{
                    width: index < animatedStep ? "100%" : "0%",
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
