import { Clock, IdGenerator } from '../../core';

/** Real wall-clock used on device. */
export const systemClock: Clock = {
  now: () => Date.now(),
};

/**
 * Time-ordered, collision-resistant id generator. Good enough for local notes
 * without pulling in a uuid dependency.
 */
export const idGenerator: IdGenerator = {
  next: () =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
};
