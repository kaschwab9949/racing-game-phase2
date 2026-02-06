export type SurfaceMaterial = 'asphalt' | 'concrete' | 'paint' | 'grass' | 'sand' | 'rumble-strip';

export interface SurfaceProperties {
  roughness: number; // 0..1
  gripBase: number; // 0..1.2
  thermalConductivity: number;
  permeability: number; // How easily dust/water flows off
}

/**
 * Handles mapping of track coordinates to physical material properties.
 */
export class SurfaceTypeLookup {
  private static readonly MATERIALS: Record<SurfaceMaterial, SurfaceProperties> = {
    'asphalt':        { roughness: 0.8,  gripBase: 1.0,  thermalConductivity: 0.75, permeability: 0.1 },
    'concrete':       { roughness: 0.6,  gripBase: 0.95, thermalConductivity: 1.1,  permeability: 0.05 },
    'paint':          { roughness: 0.3,  gripBase: 0.85, thermalConductivity: 0.5,  permeability: 0.02 },
    'grass':          { roughness: 0.9,  gripBase: 0.4,  thermalConductivity: 0.3,  permeability: 0.8 },
    'sand':           { roughness: 1.0,  gripBase: 0.3,  thermalConductivity: 0.4,  permeability: 0.9 },
    'rumble-strip':   { roughness: 0.2,  gripBase: 0.9,  thermalConductivity: 0.8,  permeability: 0.15 }
  };

  /**
   * Determine material based on lateral offset relative to track bounds.
   */
  public static getMaterial(d: number, trackWidth: number): SurfaceMaterial {
    const halfWidth = trackWidth / 2;
    const absD = Math.abs(d);

    if (absD < halfWidth - 1) {
      return 'asphalt'; // Center of track
    } else if (absD < halfWidth) {
      return 'paint'; // White lines
    } else if (absD < halfWidth + 1) {
      return 'rumble-strip'; // Curbs
    } else if (absD < halfWidth + 8) {
      return 'sand'; // Runoff
    } else {
      return 'grass'; // Beyond runtime
    }
  }

  public static getProperties(material: SurfaceMaterial): SurfaceProperties {
    return this.MATERIALS[material];
  }
}
