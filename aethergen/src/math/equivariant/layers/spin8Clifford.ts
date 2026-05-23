/*
  Spin(8)-equivariant, Clifford-aware layer (stub)
  Research tooling only; not cryptography.
*/

export type BladeId = number; // bitmask 0..(1<<8)-1 for Cℓ(8)

export interface Multivector {
  // map from basis blade id to coefficient
  components: Map<BladeId, number>;
}

export interface Spinor {
  // minimal placeholder; in practice use appropriate rep
  values: Float32Array; // length 16 for 8D minimal real rep (illustrative)
}

export interface CliffordOpsConfig {
  signature?: number[]; // metric signature, default +1^8
}

export class CliffordOps {
  private readonly signature: number[];

  constructor(cfg?: CliffordOpsConfig) {
    this.signature = (cfg?.signature && cfg.signature.length === 8)
      ? cfg.signature.slice()
      : Array(8).fill(1);
  }

  // Geometric product of basis blades (bitset ids)
  // Returns sign (+/-1) and resulting blade id
  geometricProductBlades(a: BladeId, b: BladeId): { sign: number; blade: BladeId } {
    let sign = 1;
    let result = a;
    // For each set bit in b, grade-1 vector, accumulate swaps
    for (let i = 0; i < 8; i++) {
      const mask = 1 << i;
      if (b & mask) {
        // Count swaps: number of set bits in result with lower index
        const lower = result & ((1 << i) - 1);
        const swaps = this.popcount(lower);
        if (swaps % 2 !== 0) sign = -sign;
        // Clifford metric: e_i * e_i = signature[i]
        if (result & mask) {
          // same basis vector appears twice -> remove and multiply by metric
          result ^= mask;
          if (this.signature[i] < 0) sign = -sign; // reflect metric sign
        } else {
          result |= mask;
        }
      }
    }
    return { sign, blade: result };
  }

  private popcount(x: number): number {
    let c = 0;
    while (x) { x &= x - 1; c++; }
    return c;
  }

  // Multivector geometric product (sparse map)
  geometricProduct(a: Multivector, b: Multivector): Multivector {
    const out = new Map<BladeId, number>();
    for (const [ba, ca] of a.components) {
      for (const [bb, cb] of b.components) {
        const { sign, blade } = this.geometricProductBlades(ba, bb);
        const prev = out.get(blade) || 0;
        out.set(blade, prev + sign * ca * cb);
      }
    }
    return { components: out };
  }
}

export interface Spin8EquivariantLayerConfig {
  hiddenSize: number;
}

// Minimal stub: pass-through preserving types; hook for equivariance constraints
export class Spin8EquivariantLayer {
  private readonly cfg: Spin8EquivariantLayerConfig;

  constructor(cfg: Spin8EquivariantLayerConfig) {
    this.cfg = cfg;
  }

  forward(input: { multivector?: Multivector; spinor?: Spinor }): { multivector?: Multivector; spinor?: Spinor } {
    // Placeholder: no-op. Implement irreps-tied transforms here.
    return input;
  }
}
