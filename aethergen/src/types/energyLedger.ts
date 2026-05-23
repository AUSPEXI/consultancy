export interface EnergyLedgerEntry {
  time: string; // ISO timestamp
  type: 'collision' | 'allocation';
  from?: string; // previous trial key or worker id
  to?: string; // next trial key or worker id
  deltaEnergy?: number; // abstract units
  details: Record<string, unknown>;
}

export interface EnergyLedger {
  windowId: string;
  totalEnergy: number;
  entries: EnergyLedgerEntry[];
}



