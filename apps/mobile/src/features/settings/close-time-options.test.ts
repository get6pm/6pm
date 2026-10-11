import { describe, expect, it } from '@jest/globals';

import {
  CLOSE_HOURS,
  CLOSE_MINUTES,
  closeTimeAtWheels,
  closeWheelIndexes,
} from './close-time-options';

describe('the close time wheels', () => {
  it('cover 15:00 to 23:45 in quarter hours', () => {
    expect(CLOSE_HOURS[0]).toBe('15');
    expect(CLOSE_HOURS.at(-1)).toBe('23');
    expect(CLOSE_MINUTES).toEqual(['00', '15', '30', '45']);
  });

  it('round-trip every time the app allows, including ones the old five stops missed', () => {
    for (const time of ['15:00', '19:15', '21:45', '23:45']) {
      const { hour, minute } = closeWheelIndexes(time);
      expect(closeTimeAtWheels(hour, minute)).toBe(time);
    }
  });

  it('rests a time off the lists on the nearest edge instead of failing', () => {
    expect(closeWheelIndexes('07:10')).toEqual({ hour: 0, minute: 0 });
    expect(closeTimeAtWheels(99, 0)).toBeNull();
  });
});
