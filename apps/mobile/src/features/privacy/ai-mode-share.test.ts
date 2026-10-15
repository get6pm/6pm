import { beforeEach, describe, expect, it, jest } from '@jest/globals';

/** The App Group, as files by path; the group id is the one this build is configured with. */
const mockFiles = new Map<string, string>();
const mockGroup = { id: 'group.ai.sixpm.app.dev' as string | undefined };

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return { extra: { appGroup: mockGroup.id } };
    },
  },
}));

jest.mock('expo-file-system', () => {
  const path = (parent: { uri: string } | string, name: string) =>
    `${typeof parent === 'string' ? parent : parent.uri}/${name}`;
  class Directory {
    readonly uri: string;
    constructor(parent: { uri: string } | string, name: string) {
      this.uri = path(parent, name);
    }
    get exists() {
      return mockFiles.has(this.uri);
    }
    create() {
      mockFiles.set(this.uri, '');
    }
  }
  class File {
    readonly uri: string;
    constructor(parent: { uri: string } | string, name: string) {
      this.uri = path(parent, name);
    }
    get exists() {
      return mockFiles.has(this.uri);
    }
    writeSync(text: string) {
      mockFiles.set(this.uri, text);
    }
    textSync() {
      const text = mockFiles.get(this.uri);
      if (text === undefined) throw new Error('No such file');
      return text;
    }
  }
  return {
    Directory,
    File,
    Paths: {
      get appleSharedContainers() {
        return { 'group.ai.sixpm.app.dev': { uri: 'file:///group' } };
      },
    },
  };
});

import { readSharedAiMode, shareAiMode } from './ai-mode-share';

describe('the AI mode the extensions read', () => {
  beforeEach(() => {
    mockFiles.clear();
    mockGroup.id = 'group.ai.sixpm.app.dev';
  });

  it('is written to the App Group where the share extension looks for it', () => {
    expect(readSharedAiMode()).toBeNull();
    expect(shareAiMode('device')).toBe(true);
    expect(mockFiles.get('file:///group/surfaces/ai.json')).toBe('{"mode":"device"}');
    expect(readSharedAiMode()).toBe('device');
    shareAiMode('server');
    expect(readSharedAiMode()).toBe('server');
  });

  it('reads nothing from a damaged copy', () => {
    mockFiles.set('file:///group/surfaces', '');
    mockFiles.set('file:///group/surfaces/ai.json', '{"mode":"cloud"');
    expect(readSharedAiMode()).toBeNull();
    mockFiles.set('file:///group/surfaces/ai.json', '{"mode":"cloud"}');
    expect(readSharedAiMode()).toBeNull();
  });

  it('does nothing in a build without the App Group', () => {
    mockGroup.id = undefined;
    expect(shareAiMode('device')).toBe(false);
    expect(readSharedAiMode()).toBeNull();
    expect(mockFiles.size).toBe(0);
  });
});
