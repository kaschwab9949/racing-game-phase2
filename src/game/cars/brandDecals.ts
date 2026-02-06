import type { CarDecal } from './types';

export function getDefaultBrandDecals(): CarDecal[] {
  return [
    {
      id: 'hood',
      path: '/brand/hood.png',
      placement: 'hood',
      scale: 0.002,
      opacity: 0.9,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
    },
    {
      id: 'door',
      path: '/brand/door.png',
      placement: 'door',
      scale: 0.002,
      opacity: 0.9,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
    },
    {
      id: 'roof',
      path: '/brand/roof.png',
      placement: 'roof',
      scale: 0.002,
      opacity: 0.9,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
    },
  ];
}
