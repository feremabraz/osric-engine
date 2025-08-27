export type RGBA = { r: number; g: number; b: number; a: number };

export type Texture = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

export type Palette = Array<{ r: number; g: number; b: number }>;

export type LightLUT = number[];

export type MoodLUT = {
  name: string;
  multiply: { r: number; g: number; b: number };
  add: { r: number; g: number; b: number };
};
