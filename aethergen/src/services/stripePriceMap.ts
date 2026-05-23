export type PriceSku =
  | 'PLATFORM_DEV'
  | 'PLATFORM_PRO'
  | 'PLATFORM_TEAM'
  | 'PLATFORM_ENT'
  | 'DATASET_SMALL'
  | 'DATASET_MEDIUM'
  | 'DATASET_LARGE'
  | 'STREAM_BASIC'
  | 'STREAM_PRO'
  | 'STREAM_ENT'
  | 'WL_BASIC'
  | 'WL_PRO'
  | 'MODEL_SEAT'
  | 'PRED_100K'
  | 'PRED_1M';

const env = import.meta.env;

const skuToEnvKey: Record<PriceSku, string> = {
  PLATFORM_DEV: 'VITE_PRICE_DEVHUB',
  PLATFORM_PRO: 'VITE_PRICE_DEVHUB_PRO',
  PLATFORM_TEAM: 'VITE_PRICE_TEAM',
  PLATFORM_ENT: 'VITE_PRICE_ENTERPRISE',
  DATASET_SMALL: 'VITE_PRICE_DATASET_SMALL',
  DATASET_MEDIUM: 'VITE_PRICE_DATASET_MEDIUM',
  DATASET_LARGE: 'VITE_PRICE_DATASET_LARGE',
  STREAM_BASIC: 'VITE_PRICE_STREAM_BASIC',
  STREAM_PRO: 'VITE_PRICE_STREAM_PRO',
  STREAM_ENT: 'VITE_PRICE_STREAM_ENTERPRISE',
  WL_BASIC: 'VITE_PRICE_WL_BASIC',
  WL_PRO: 'VITE_PRICE_WL_PRO',
  MODEL_SEAT: 'VITE_PRICE_MODEL_SEAT',
  PRED_100K: 'VITE_PRICE_PRED_100K',
  PRED_1M: 'VITE_PRICE_PRED_1M'
};

export function getPriceIdBySku(sku: PriceSku): string | undefined {
  const key = skuToEnvKey[sku];
  const val = (env as any)[key];
  return typeof val === 'string' && val.length > 0 ? val : undefined;
}



