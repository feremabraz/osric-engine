import { createRng } from '@osric/engine';

/** Single dungeon cell with materials, light, and door flag. */
export type Cell = {
  wall: number;
  floor: number;
  ceiling: number;
  light: number;
  door: boolean;
};

/** Procedurally generated map data with player start and actors. */
export type MapData = {
  width: number;
  height: number;
  cells: Cell[];
  playerStart: { x: number; y: number; angle: number };
  actors: Array<{
    x: number;
    y: number;
    kind: string;
    facing: number;
    role?: 'hostile' | 'civilian';
  }>;
};

/** Generate a small dungeon map deterministically from a seed. */
export function generateMap(seed: number, width = 32, height = 32): MapData {
  const rng = createRng(seed);
  const cells: Cell[] = Array.from({ length: width * height }, () => ({
    wall: 1,
    floor: 1,
    ceiling: 1,
    light: 8,
    door: false,
  }));
  const carveRoom = (x: number, y: number, w: number, h: number) => {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const cx = x + i;
        const cy = y + j;
        if (cx > 0 && cy > 0 && cx < width - 1 && cy < height - 1) {
          const idx = cy * width + cx;
          cells[idx].wall = 0;
          cells[idx].light = Math.max(4, Math.min(15, Math.floor(6 + rng.float() * 6)));
        }
      }
  };
  const rooms: Array<{ x: number; y: number; w: number; h: number }> = [];
  const roomCount = 6;
  for (let r = 0; r < roomCount; r++) {
    const w = 4 + Math.floor(rng.float() * 6);
    const h = 4 + Math.floor(rng.float() * 6);
    const x = 1 + Math.floor(rng.float() * (width - w - 2));
    const y = 1 + Math.floor(rng.float() * (height - h - 2));
    rooms.push({ x, y, w, h });
    carveRoom(x, y, w, h);
  }
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1];
    const b = rooms[i];
    const x1 = a.x + Math.floor(a.w / 2);
    const y1 = a.y + Math.floor(a.h / 2);
    const x2 = b.x + Math.floor(b.w / 2);
    const y2 = b.y + Math.floor(b.h / 2);
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) cells[y1 * width + x].wall = 0;
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) cells[y * width + x2].wall = 0;
  }
  for (let i = 1; i < rooms.length; i++) {
    const b = rooms[i];
    const x = b.x + Math.floor(b.w / 2);
    const y = rooms[i - 1].y + Math.floor(rooms[i - 1].h / 2);
    const idx = y * width + x;
    if (cells[idx].wall === 0) cells[idx].door = true;
  }
  const start = rooms[0];
  const playerStart = {
    x: start.x + Math.floor(start.w / 2) + 0.5,
    y: start.y + Math.floor(start.h / 2) + 0.5,
    angle: 0,
  };
  const actors: MapData['actors'] = [];
  const kinds = ['knight', 'skeleton', 'caster'];
  for (let i = 1; i < rooms.length; i++) {
    const rr = rooms[i];
    const ax = rr.x + 1 + Math.floor(rng.float() * (rr.w - 2)) + 0.5;
    const ay = rr.y + 1 + Math.floor(rng.float() * (rr.h - 2)) + 0.5;
    const kind = kinds[i % kinds.length];
    const civilian = rng.float() < 0.33;
    actors.push({ x: ax, y: ay, kind, facing: 0, role: civilian ? 'civilian' : 'hostile' });
  }
  return { width, height, cells, playerStart, actors };
}
