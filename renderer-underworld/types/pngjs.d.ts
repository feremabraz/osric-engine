declare module 'pngjs' {
  export interface PNGOptions {
    width?: number;
    height?: number;
    colorType?: number;
    filterType?: number;
    bitDepth?: number;
    inputHasAlpha?: boolean;
  }
  export class PNG {
    constructor(options?: PNGOptions);
    width: number;
    height: number;
    data: Buffer;
    pack(): NodeJS.ReadableStream;
    parse(data: Buffer, callback?: (err: Error | null, data: PNG) => void): PNG;
    on(event: 'metadata' | 'parsed' | 'error' | 'end', cb: (...args: unknown[]) => void): this;
  }
  export namespace PNG {
    namespace sync {
      function write(png: PNG): Buffer;
      function read(buffer: Buffer): PNG;
    }
  }
}
