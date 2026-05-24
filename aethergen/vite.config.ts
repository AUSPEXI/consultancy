// Intentionally left as a shim that re-exports the JS config to avoid TS transpile issues on Windows when Vite loads config
import config from './vite.config.mjs'
export default config