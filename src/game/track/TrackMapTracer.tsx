import { useEffect, useRef, useState } from 'react';

const DEFAULT_MAP_PATH = '/tracks/podium-club-map.png';

export function TrackMapTracer({ mapPath = DEFAULT_MAP_PATH }: { mapPath?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [ready, setReady] = useState(false);
  const [showPoints, setShowPoints] = useState(true);

  useEffect(() => {
    drawOverlay();
  }, [points, ready, showPoints]);

  const handleImageLoad = () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    setReady(true);
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    setPoints((prev) => [...prev, { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 }]);
  };

  const drawOverlay = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!showPoints) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(80, 200, 255, 0.9)';
    ctx.lineWidth = 2;
    if (points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    }

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      ctx.fillStyle = i === 0 ? 'rgba(255, 80, 80, 0.95)' : 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, i === 0 ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const handleUndo = () => setPoints((prev) => prev.slice(0, -1));
  const handleClear = () => setPoints([]);

  const copyJson = async () => {
    const payload = JSON.stringify(points, null, 2);
    await navigator.clipboard.writeText(payload);
  };

  const copyTs = async () => {
    const lines = points.map((p) => `  { x: ${p.x}, y: ${p.y} },`);
    const content = `export const PODIUM_CLUB_TRACE = [\n${lines.join('\n')}\n];\n`;
    await navigator.clipboard.writeText(content);
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontWeight: 700 }}>Track Map Tracer</div>
      <div style={{ fontSize: 12, opacity: 0.75 }}>
        Click along the centerline in order. First point = start/finish. Top of the image is north.
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={handleUndo} disabled={!points.length}>Undo</button>
        <button onClick={handleClear} disabled={!points.length}>Clear</button>
        <button onClick={() => setShowPoints((v) => !v)}>{showPoints ? 'Hide' : 'Show'} Overlay</button>
        <button onClick={copyJson} disabled={!points.length}>Copy JSON</button>
        <button onClick={copyTs} disabled={!points.length}>Copy TS</button>
      </div>

      <div style={{ fontSize: 12, opacity: 0.7 }}>Points: {points.length}</div>

      <div style={{ position: 'relative', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, overflow: 'hidden' }}>
        <img
          ref={imgRef}
          src={mapPath}
          onLoad={handleImageLoad}
          alt="Track map"
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'crosshair' }}
        />
      </div>

      {!ready && (
        <div style={{ fontSize: 12, opacity: 0.7 }}>Loading map image…</div>
      )}
    </div>
  );
}
