'use client'
import React, { useState, useEffect, useCallback } from 'react';

const BLOB_COUNT = 50;
const INTERACTION_RADIUS = 100;

const BlobBackground = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [mousePosition, setMousePosition] = useState({ x: -1000, y: -1000 });
  const [blobs, setBlobs] = useState([]);

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

  const generateRandomGreen = () => {
    const hue = Math.floor(Math.random() * 60) + 100; // Range: 100-160 (yellow-green to green)
    const saturation = Math.floor(Math.random() * 30) + 70; // Range: 70-100%
    const lightness = Math.floor(Math.random() * 30) + 40; // Range: 40-70%
    return `hsl(${hue} ${saturation}% ${lightness}%)`;
  };

  useEffect(() => {
    const newBlobs = Array.from({ length: BLOB_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      size: Math.random() * 30 + 10, // Random size between 10 and 40
      targetSize: Math.random() * 30 + 10, // Target size for smooth animation
      speedX: (Math.random() - 0.5) * 2, // Speed range: -1 to 1
      speedY: (Math.random() - 0.5) * 2, // Speed range: -1 to 1
      growthSpeed: (Math.random() * 0.6 - 0.3) * 2, // Growth speed range: -0.6 to 0.6
      color: generateRandomGreen(),
      isExponential: Math.random() < 0.3 // 30% chance of exponential growth
    }));
    setBlobs(newBlobs);
  }, [dimensions]);

  useEffect(() => {
    const moveBlobs = () => {
      setBlobs(prevBlobs => prevBlobs.map(blob => {
        let newX = blob.x + blob.speedX;
        let newY = blob.y + blob.speedY;
        let newSpeedX = blob.speedX;
        let newSpeedY = blob.speedY;
        let newTargetSize = blob.targetSize + blob.growthSpeed;

        // Bounce off edges
        if (newX < 0 || newX + blob.size > dimensions.width) {
          newSpeedX = -newSpeedX;
          newX = newX < 0 ? 0 : dimensions.width - blob.size;
        }
        if (newY < 0 || newY + blob.size > dimensions.height) {
          newSpeedY = -newSpeedY;
          newY = newY < 0 ? 0 : dimensions.height - blob.size;
        }

        // Constrain target size and reverse growth if limits reached
        if (newTargetSize < 10) {
          newTargetSize = 10;
          blob.growthSpeed = Math.abs(blob.growthSpeed);
        } else if (newTargetSize > 60) {
          newTargetSize = 60;
          blob.growthSpeed = -Math.abs(blob.growthSpeed);
        }

        // Smooth size transition
        let newSize;
        if (blob.isExponential) {
          newSize = blob.size + (newTargetSize - blob.size) * 0.1;
        } else {
          newSize = blob.size + (newTargetSize - blob.size) * 0.05;
        }

        return {
          ...blob,
          x: newX,
          y: newY,
          speedX: newSpeedX,
          speedY: newSpeedY,
          size: newSize,
          targetSize: newTargetSize,
        };
      }));
    };

    const intervalId = setInterval(moveBlobs, 20); // 50 fps for smooth animation
    return () => clearInterval(intervalId);
  }, [dimensions]);

  const handleMouseMove = useCallback((event) => {
    setMousePosition({
      x: event.clientX,
      y: event.clientY
    });
  }, []);

  return (
    <div 
      className="fixed top-0 left-0 w-screen h-screen overflow-hidden bg-gradient-to-br from-black via-black to-green-950 -z-10"
      onMouseMove={handleMouseMove}
    >
      {blobs.map(blob => {
        const distance = Math.sqrt(
          Math.pow(blob.x - mousePosition.x, 2) + Math.pow(blob.y - mousePosition.y, 2)
        );
        const isActive = distance > INTERACTION_RADIUS;
        return (
          <div
            key={blob.id}
            className={`absolute rounded-full border-2 transition-opacity duration-300 ease-in-out ${isActive ? 'opacity-70' : 'opacity-30'}`}
            style={{
              left: `${blob.x}px`,
              top: `${blob.y}px`,
              width: `${blob.size}px`,
              height: `${blob.size}px`,
              borderColor: blob.color,
              boxShadow: `0 0 10px ${blob.color}`,
              transition: 'width 0.3s ease-out, height 0.3s ease-out',
            }}
          />
        );
      })}
    </div>
  );
};

export default BlobBackground;