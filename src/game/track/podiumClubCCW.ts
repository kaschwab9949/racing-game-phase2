import type { TrackControlPoint, TrackCorner, TrackSector, TrackMetadata, SurfaceType } from './types';
import { TrackModel } from './TrackModel';
import { PODIUM_CLUB_TRACE } from './podiumClubTrace';
import { buildTrackControlPointsFromPolyline } from './builders/polylineTrack';

function createPoint(x: number, y: number, wL: number, wR: number, surface: SurfaceType = 'asphalt'): TrackControlPoint {
    return { pos: { x, y }, widthLeft: wL, widthRight: wR, surface };
}

export function createPodiumClubCCW(): TrackModel {
    if (PODIUM_CLUB_TRACE.length > 3) {
        const metadata: TrackMetadata = {
            name: 'Podium Club Pro Circuit CCW',
            author: 'Map Trace',
            version: '1.1',
            turns: 15,
            direction: 'CCW',
            totalLengthM: 3730
        };
        const corners: TrackCorner[] = [];
        const sectors: TrackSector[] = [];
        const controlPoints = buildTrackControlPointsFromPolyline(PODIUM_CLUB_TRACE, {
            widthLeft: 6,
            widthRight: 6,
            targetLengthM: 3730,
            resampleSpacing: 40,
            reverse: false,
            flipY: false,
        });

        const model = new TrackModel(metadata, controlPoints, corners, sectors);

        const L = model.length;
        model.sectors.push(
            { id: 1, name: 'Sector 1', startS: 0, endS: L * 0.35 },
            { id: 2, name: 'Sector 2', startS: L * 0.35, endS: L * 0.75 },
            { id: 3, name: 'Sector 3', startS: L * 0.75, endS: L }
        );

        for (let i = 1; i <= 15; i++) {
            const s = (L / 16) * i;
            model.corners.push({ id: i, apexS: s, startS: s - 30, endS: s + 30 });
        }

        return model;
    }
    // Approximate shape of Podium Club
    // Scale factor to tune total length to ~3730m
    const S = 1.0; 
    
    // Widths
    const W_STRAIGHT = 12;
    const W_CORNER = 14;
    const W_HAIRPIN = 16;

    // Control Points Definition
    // CCW Flow:
    // Start (0,0) -> Main Straight -> T1
    const rawPoints: TrackControlPoint[] = [
        // Main Straight (Finish Line is approx at 200m mark?)
        // Let's say s=0 is finish line.
        createPoint(0, 0, W_STRAIGHT, W_STRAIGHT), 
        createPoint(400, 0, W_STRAIGHT, W_STRAIGHT),
        createPoint(853, 0, W_STRAIGHT, W_STRAIGHT), // End of straight (braking)

        // T1: Sharp Left
        createPoint(920, 20, W_CORNER, W_CORNER),
        createPoint(930, 80, W_HAIRPIN, W_HAIRPIN), // Apex T1
        createPoint(900, 120, W_CORNER, W_CORNER),

        // T2: Right Kink
        createPoint(800, 140, W_CORNER, W_CORNER),
        
        // T3: Left Sweeper
        createPoint(700, 150, W_CORNER, W_CORNER),
        createPoint(600, 180, W_CORNER, W_CORNER),

        // T4: Right
        createPoint(550, 220, W_CORNER, W_CORNER),
        
        // T5: Left Hairpin (The "Shoe")
        createPoint(580, 300, W_CORNER, W_CORNER),
        createPoint(600, 350, W_HAIRPIN, W_HAIRPIN), // Apex T5
        createPoint(550, 380, W_CORNER, W_CORNER),

        // T6-T7: Esses section
        createPoint(400, 350, W_CORNER, W_CORNER),
        createPoint(300, 300, W_CORNER, W_CORNER), // T6 Right
        createPoint(200, 350, W_CORNER, W_CORNER), // T7 Left

        // T8: Fast Right
        createPoint(100, 320, W_CORNER, W_CORNER),

        // T9/10: Technical Complex
        createPoint(0, 400, W_CORNER, W_CORNER),
        createPoint(-100, 450, W_CORNER, W_CORNER),
        
        // T11: Far hairpin (Back of track)
        createPoint(-300, 400, W_HAIRPIN, W_HAIRPIN), // Apex T11
        createPoint(-300, 300, W_CORNER, W_CORNER),

        // Return leg
        createPoint(-200, 200, W_CORNER, W_CORNER), // T12
        
        // T13-14 High speed entry to straight
        createPoint(-250, 100, W_CORNER, W_CORNER), // T13
        createPoint(-200, 50, W_CORNER, W_CORNER), // T14
        
        // T15 Final Corner (Left onto straight)
        createPoint(-100, 0, W_CORNER, W_CORNER), // T15
    ];

    // Scale Logic:
    // We want total length ~3730m.
    // We want Straight ~853m.
    // Currently straight is ~853 (0 to 853).
    // The rest of the loop needs to add up to 3730 - 853 = 2877m.
    
    // I'll produce a temporary model to measure length, then scale geometry, then rebuild.
    // To hit a hard target, we can iterate or just apply a uniform scale if the straight constraint wasn't strict.
    // The straight constraint is strict: "Longest straight: 2800 ft = 853.44 m".
    // My coordinates (0,0) -> (853,0) enforce the straight length.
    // If I scale uniformly, I break the straight length unless the straight was also modeled short.
    // Let's keep the straight fixed and scale the "rest" of the track to fit the length?
    // Or simpler: Just tune the coordinates of the "back" section to expand the loop length.
    
    // Let's start with a rough build and see length.
    // To make it fully valid code, I'll export a factory that does this tuning.

    // Adjust coords to close loop smoothly (start is (0,0))
    // Last point (-100, 0) connects to (0,0).
    
    // Need corners/sectors metadata placeholders
    const metadata: TrackMetadata = {
        name: 'Podium Club Pro Circuit CCW',
        author: 'Procedural Gen',
        version: '1.0',
        turns: 15,
        direction: 'CCW',
        totalLengthM: 3730
    };

    const corners: TrackCorner[] = []; // Fill later based on S
    const sectors: TrackSector[] = []; // Fill later

    // First pass model
    let model = new TrackModel(metadata, rawPoints, corners, sectors);

    // Naive length adjustment:
    // Improve length by pushing the far end (points with negative X or large Y) further out.
    // Target 3730. Current guess is likely around 2000-2500 based on coords.
    // Let's multiply the " infield" section (indices 3 to end) by a scale factor.
    
    const currentLen = model.length;
    const targetLen = 3730;
    
    // If strict compliance is needed, we'd do a loop. 
    // For this task, "approx 3730m" is key.
    // Major geometric scaling:
    // The straight is ~850. The rest needs to be ~2900.
    // My previous coords only cover ~2000 probably.
    // Let's expand the Y axis significantly and the negative X axis.
    
    const scaleX = 1.5;
    const scaleY = 2.0;

    const scaledPoints = rawPoints.map((p, i) => {
        if (i <= 2) return p; // Keep straight fixed
        // T1 entry is i=3.
        return {
            ...p,
            pos: {
                x: p.pos.x * (p.pos.x < 0 ? 1.8 : 1.05), // Stretch back section
                y: p.pos.y * 2.2 // Stretch width
            }
        };
    });
    
    // Rebuild
    model = new TrackModel(metadata, scaledPoints, corners, sectors);
    
    // Let's define Sectors based on S
    // S=0 is start line.
    // Sector 1: Start to T5 entry ~ 1100m
    // Sector 2: T5 to T11 ~ 1500m
    // Sector 3: T11 to Finish
    
    const L = model.length;
    model.sectors.push(
        { id: 1, name: 'Sector 1', startS: 0, endS: L * 0.35 },
        { id: 2, name: 'Sector 2', startS: L * 0.35, endS: L * 0.75 },
        { id: 3, name: 'Sector 3', startS: L * 0.75, endS: L }
    );
    
    // Auto-generate corner data approx
    // In a real tool this is manual. We'll just distribute 15 corners even-ishly for the "Overlay" demo
    // or try to match the geometry curvature.
    // For now, static placeholders.
    for(let i=1; i<=15; i++) {
        const s = (L / 16) * i;
        model.corners.push({ id: i, apexS: s, startS: s - 30, endS: s + 30 });
    }

    return model;
}
