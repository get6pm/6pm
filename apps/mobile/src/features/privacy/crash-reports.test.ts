import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type * as CrashReportsModule from './crash-reports';

type Options = {
  beforeSend: (event: object) => object | null;
  beforeSendTransaction: (event: object) => object | null;
};

type CrashReports = typeof CrashReportsModule;

const mockSentry = {
  init: jest.fn((_: Options) => undefined),
  close: jest.fn(() => Promise.resolve()),
};
jest.mock('@sentry/react-native', () => mockSentry);

const DSN = 'https://key@sentry.example/1';

/** A fresh copy of the module, as at launch. */
function launch(dsn: string | undefined) {
  if (dsn === undefined) delete process.env['EXPO_PUBLIC_SENTRY_DSN'];
  else process.env['EXPO_PUBLIC_SENTRY_DSN'] = dsn;
  let loaded: CrashReports | undefined;
  jest.isolateModules(() => {
    loaded = jest.requireActual<CrashReports>('./crash-reports');
  });
  if (!loaded) throw new Error('crash-reports did not load');
  return loaded;
}

describe('crash reports and the AI mode', () => {
  beforeEach(() => {
    mockSentry.init.mockClear();
    mockSentry.close.mockClear();
  });

  it('are never started at a launch in on-device mode', () => {
    const reports = launch(DSN);
    reports.applyAiModeToCrashReports('device');
    expect(mockSentry.init).not.toHaveBeenCalled();
    expect(reports.crashReportsOn()).toBe(false);
  });

  it('start in server mode, and stop when on-device mode is chosen', () => {
    const reports = launch(DSN);
    reports.applyAiModeToCrashReports('server');
    expect(mockSentry.init).toHaveBeenCalledTimes(1);
    expect(reports.crashReportsOn()).toBe(true);
    const options = mockSentry.init.mock.calls[0]?.[0];
    const event = { message: 'boom' };
    expect(options?.beforeSend(event)).toBe(event);

    reports.applyAiModeToCrashReports('device');
    expect(mockSentry.close).toHaveBeenCalledTimes(1);
    expect(reports.crashReportsOn()).toBe(false);
    // A report already on its way is dropped.
    expect(options?.beforeSend(event)).toBeNull();
    expect(options?.beforeSendTransaction(event)).toBeNull();

    reports.applyAiModeToCrashReports('server');
    expect(mockSentry.init).toHaveBeenCalledTimes(2);
    expect(reports.crashReportsOn()).toBe(true);
  });

  it('start only once however often the mode is applied', () => {
    const reports = launch(DSN);
    reports.applyAiModeToCrashReports('server');
    reports.applyAiModeToCrashReports('server');
    expect(mockSentry.init).toHaveBeenCalledTimes(1);
  });

  it('never start without a DSN', () => {
    const reports = launch(undefined);
    reports.applyAiModeToCrashReports('server');
    expect(mockSentry.init).not.toHaveBeenCalled();
  });
});
