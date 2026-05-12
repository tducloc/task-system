import { baseConfig, type Config } from './base';
import { devConfig } from './dev';
import { prodConfig } from './prod';

const overrides = import.meta.env.PROD ? prodConfig : devConfig;

export const config: Config = { ...baseConfig, ...overrides };
export type { Config };
