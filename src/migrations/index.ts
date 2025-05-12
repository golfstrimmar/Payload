import * as migration_20250512_123327 from './20250512_123327';

export const migrations = [
  {
    up: migration_20250512_123327.up,
    down: migration_20250512_123327.down,
    name: '20250512_123327'
  },
];
