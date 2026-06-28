'use client';

import { useCallback, useRef, useState } from 'react';

type UseUndoRedoOptions<T> = {
  maxDepth?: number;
  isEqual?: (left: T, right: T) => boolean;
};

function defaultIsEqual<T>(left: T, right: T) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function useUndoRedo<T>(
  initialValue: T | (() => T),
  options: UseUndoRedoOptions<T> = {},
) {
  const { maxDepth = 50, isEqual = defaultIsEqual } = options;
  const [present, setPresent] = useState(initialValue);
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const skipRecordRef = useRef(false);
  const [, setRevision] = useState(0);

  const bump = useCallback(() => {
    setRevision((value) => value + 1);
  }, []);

  const canUndo = pastRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  const set = useCallback(
    (value: T | ((previous: T) => T)) => {
      setPresent((previous) => {
        const next =
          typeof value === 'function'
            ? (value as (current: T) => T)(previous)
            : value;

        if (!skipRecordRef.current && !isEqual(previous, next)) {
          pastRef.current = [...pastRef.current.slice(-(maxDepth - 1)), previous];
          futureRef.current = [];
          bump();
        }

        return next;
      });
    },
    [bump, isEqual, maxDepth],
  );

  const undo = useCallback(() => {
    const past = pastRef.current;
    if (past.length === 0) return false;

    const previous = past[past.length - 1]!;
    pastRef.current = past.slice(0, -1);

    skipRecordRef.current = true;
    setPresent((current) => {
      futureRef.current = [current, ...futureRef.current];
      return previous;
    });
    skipRecordRef.current = false;
    bump();
    return true;
  }, [bump]);

  const redo = useCallback(() => {
    const future = futureRef.current;
    if (future.length === 0) return false;

    const next = future[0]!;
    futureRef.current = future.slice(1);

    skipRecordRef.current = true;
    setPresent((current) => {
      pastRef.current = [...pastRef.current, current];
      return next;
    });
    skipRecordRef.current = false;
    bump();
    return true;
  }, [bump]);

  const reset = useCallback(
    (value: T) => {
      pastRef.current = [];
      futureRef.current = [];
      skipRecordRef.current = true;
      setPresent(value);
      skipRecordRef.current = false;
      bump();
    },
    [bump],
  );

  return {
    present,
    set,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
  };
}
