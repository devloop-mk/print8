import { randomInt } from 'crypto';
import {
  NY_SCRATCH_CELL_COUNT,
  NY_SCRATCH_PRIZES,
  NY_SCRATCH_WIN_COUNT,
  type NyScratchPrize,
  type NyScratchPrizeKey,
} from './scratch-config';

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    const current = items[i];
    const swap = items[j];
    if (current === undefined || swap === undefined) continue;
    items[i] = swap;
    items[j] = current;
  }
  return items;
}

export function pickWeightedScratchPrize(): NyScratchPrize {
  const totalWeight = NY_SCRATCH_PRIZES.reduce((sum, prize) => sum + prize.weight, 0);
  let ticket = randomInt(Math.max(1, totalWeight));
  for (const prize of NY_SCRATCH_PRIZES) {
    ticket -= prize.weight;
    if (ticket < 0) return prize;
  }
  return NY_SCRATCH_PRIZES[0];
}

/**
 * Build a 3×3 board with exactly one triple of `winningKey`.
 * Every other prize appears at most twice, so a second triple is impossible.
 */
export function generateNyScratchGrid(
  winningKey: NyScratchPrizeKey,
): NyScratchPrizeKey[] {
  const cells: Array<NyScratchPrizeKey | null> = Array.from(
    { length: NY_SCRATCH_CELL_COUNT },
    () => null,
  );
  const indices = shuffleInPlace(
    Array.from({ length: NY_SCRATCH_CELL_COUNT }, (_, index) => index),
  );
  for (let i = 0; i < NY_SCRATCH_WIN_COUNT; i += 1) {
    const index = indices[i];
    if (index === undefined) continue;
    cells[index] = winningKey;
  }

  const bag: NyScratchPrizeKey[] = [];
  for (const prize of NY_SCRATCH_PRIZES) {
    if (prize.key === winningKey) continue;
    bag.push(prize.key, prize.key);
  }
  shuffleInPlace(bag);

  let next = 0;
  for (let i = 0; i < NY_SCRATCH_CELL_COUNT; i += 1) {
    if (cells[i] != null) continue;
    const filler = bag[next];
    next += 1;
    cells[i] = filler ?? NY_SCRATCH_PRIZES.find((prize) => prize.key !== winningKey)?.key ?? winningKey;
  }

  return cells.map((cell) => cell ?? winningKey);
}
