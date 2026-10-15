"use client";

import { useEffect, useState } from "react";
import { readLocal, seedDemo, type Tx } from "./data";

/**
 * Admin data source. There is no backend in this project: transactions are
 * created client-side and stored under `vcr_tx`. The dashboard therefore shows
 * this device's real transactions on top of a deterministic demo dataset, and
 * labels the demo part honestly in the UI.
 */
export function useTx() {
  const [tx, setTx] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoCount, setDemoCount] = useState(0);
  const [localCount, setLocalCount] = useState(0);

  useEffect(() => {
    const local = readLocal();
    const seed = seedDemo();
    setTx([...local, ...seed].sort((a, b) => b.time - a.time));
    setDemoCount(seed.length);
    setLocalCount(local.length);
    setLoading(false);
  }, []);

  return { tx, loading, demoCount, localCount };
}
