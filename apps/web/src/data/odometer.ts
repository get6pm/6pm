/** The odometer counts down through these totals, each step starting at the matching `at`. */
export const odoSteps = [18500000, 11664000, 8864000, 6864000, 312000] as const;
export const odoStepAt = [0.1, 0.28, 0.46, 0.64] as const;

/** Eight digits with a dot after the second and the fifth: 18.500.000. */
export const odoSlots = [0, 1, 'dot', 2, 3, 4, 'dot', 5, 6, 7] as const;
