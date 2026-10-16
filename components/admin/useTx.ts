"use client";

import { useEffect, useState } from "react";
import { readLocal, type Tx } from "./data";

/**
 * Admin data source. There is no backend in this project: transactions are
 * written by the public checkout into `vcr_tx` on this device, so the dashboard
 * shows exactly those orders — and nothing else.
 */
export function useTx() {
  const [tx, setTx] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTx(readLocal().sort((a, b) => b.time - a.time));
    setLoading(false);
  }, []);

  return { tx, loading };
}
