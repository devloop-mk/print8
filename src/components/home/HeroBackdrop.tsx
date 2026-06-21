'use client';

import { ParallaxFloat } from '@/components/motion/ParallaxFloat';
import { BrandWatermark } from '@/components/brand/BrandWatermark';

export function HeroBackdrop() {
  return (
    <ParallaxFloat
      strength={0.16}
      scaleStrength={0.0002}
      className="pointer-events-none absolute inset-0"
    >
      <BrandWatermark
        variant="on-dark"
        size="xl"
        position="right"
      />
    </ParallaxFloat>
  );
}
