import React from 'react';
import { carDatabase } from '../game/cars/specs';
import type { CarId } from '../game/cars/specs/types';

type CarSwitcherProps = {
  selectedCarId: CarId;
  onCarSelected: (id: CarId) => void;
  className?: string;
};

export function CarSwitcher({ selectedCarId, onCarSelected, className }: CarSwitcherProps) {
  return (
    <div className={className ? `car-switcher ${className}` : 'car-switcher'}>
      <h3>Select Car</h3>
      <ul>
        {Object.entries(carDatabase).map(([id, { spec }]) => (
          <li key={id} className={id === selectedCarId ? 'selected' : ''}>
            <button onClick={() => onCarSelected(id as CarId)}>
              {spec.displayName} ({spec.modelYear})
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
