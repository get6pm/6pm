/**
 * A promise queue: tasks run one after another, in the order they were asked for, and a task that
 * fails does not stop the ones behind it (its caller still sees the error). Reads, writes and
 * snapshot publishes of the money store go through one, so a reload can never publish what it read
 * before a write that finished meanwhile, and two transactions never nest.
 */
export function createQueue() {
  let tail: Promise<void> = Promise.resolve();
  return function exclusive<T>(task: () => Promise<T>): Promise<T> {
    const run = tail.then(task);
    tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
}

type AsyncActions = Record<string, (...args: never[]) => Promise<unknown>>;

/**
 * The same actions, each run in the store's turn. An action must not call another action of the
 * same set (it would wait for itself): shared steps are plain functions inside the set.
 */
export function inTurn<T extends AsyncActions>(
  exclusive: <R>(task: () => Promise<R>) => Promise<R>,
  actions: T,
): T {
  const wrapped: Record<string, unknown> = {};
  for (const [name, action] of Object.entries(actions)) {
    wrapped[name] = (...args: unknown[]) =>
      exclusive(() => (action as (...a: unknown[]) => Promise<unknown>)(...args));
  }
  return wrapped as T;
}
