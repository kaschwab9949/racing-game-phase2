import React, { useEffect, useRef, useState } from 'react';
import type { TrackModel } from '../game/track/TrackModel';
import type { CarState } from '../game/carPhysics';
import { mmToMeters } from '../game/cars/profileMath';

export type TrackDebugState = {
    overlayVisible: boolean;
    trackLength: number;
    lapDistance: number;
    lastLapTime: number | null;
    currentLapTime: number;
    straightError: number;
    lengthError: number;
    offTrack: boolean;
    nearestCornerId: number;
    nearestCornerDist: number;
};

export type TrackDebugProps = {
    state: TrackDebugState;
    track: TrackModel;
    car: CarState;
};

export function TrackDebugOverlay({ state, track, car }: TrackDebugProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw Mini-Map
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Compute bounds
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        // Sample down for perf
        const step = 5; 
        for (let i = 0; i < track.samples.length; i += step) {
            const p = track.samples[i].pos;
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        }
        const margin = 50;
        const w = maxX - minX;
        const h = maxY - minY;
        
        const scale = Math.min((canvas.width - margin*2) / w, (canvas.height - margin*2) / h);
        const offsetX = margin - minX * scale + (canvas.width - margin*2 - w*scale)/2;
        const offsetY = margin - minY * scale + (canvas.height - margin*2 - h*scale)/2;

        const toScreen = (x: number, y: number) => ({
            x: x * scale + offsetX,
            y: y * scale + offsetY
        });

        // Draw track bounds
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#444';
        
        // Left Bound
        ctx.beginPath();
        track.samples.forEach((s, i) => {
            if (i % step !== 0) return;
            const p = toScreen(s.pos.x - s.normal.x * s.widthLeft, s.pos.y - s.normal.y * s.widthLeft);
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Right Bound
        ctx.beginPath();
        track.samples.forEach((s, i) => {
            if (i % step !== 0) return;
             const p = toScreen(s.pos.x + s.normal.x * s.widthRight, s.pos.y + s.normal.y * s.widthRight);
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Centerline
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        track.samples.forEach((s, i) => {
            if (i % step !== 0) return;
            const p = toScreen(s.pos.x, s.pos.y);
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Sectors
        track.sectors.forEach(sec => {
            const smp = track.getSampleAtS(sec.startS);
            const p = toScreen(smp.pos.x, smp.pos.y);
            ctx.fillStyle = '#f0f';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#f0f';
            ctx.font = '10px monospace';
            ctx.fillText(`S${sec.id}`, p.x + 8, p.y);
        });

        // Corners
        track.corners.forEach(c => {
            const smp = track.getSampleAtS(c.startS);
            const p = toScreen(smp.pos.x, smp.pos.y);
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#ff0';
            ctx.fillText(`T${c.id}`, p.x + 8, p.y);
        });

        // Car
        const carPos = toScreen(car.pos.x, car.pos.y);
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(carPos.x, carPos.y, 6, 0, Math.PI*2);
        ctx.fill();

        // Direction Arrows
        ctx.strokeStyle = '#0ff';
        for(let s=0; s<track.length; s+=500) {
            const smp = track.getSampleAtS(s);
            const p = toScreen(smp.pos.x, smp.pos.y);
            const tan = smp.tangent;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + tan.x * 20, p.y + tan.y * 20);
            ctx.stroke();
            
            // Arrowhead
            ctx.beginPath();
            ctx.arc(p.x + tan.x * 20, p.y + tan.y * 20, 2, 0, Math.PI*2);
            ctx.fill();
        }

    }, [track, car, state]);

    return (
        <div className="track-debug-overlay">
            <canvas ref={canvasRef} width="400" height="300" />
            <div className="track-debug-text">
                <div>Track Length: {state.trackLength.toFixed(1)}m</div>
                <div>Lap Distance: {state.lapDistance.toFixed(1)}m</div>
                <div>Current Lap: {state.currentLapTime.toFixed(2)}s</div>
                <div>Last Lap: {state.lastLapTime?.toFixed(2) ?? '--'}s</div>
                <div>Off Track: {state.offTrack ? 'Yes' : 'No'}</div>
                <div>Nearest Corner: #{state.nearestCornerId} ({state.nearestCornerDist.toFixed(1)}m)</div>
            </div>
        </div>
    );
}
