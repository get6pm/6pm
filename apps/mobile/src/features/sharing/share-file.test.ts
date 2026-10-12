import { describe, expect, it } from '@jest/globals';

import { isShareFile, shareFileName, withShareFile, type ShareFolder } from './share-file';

function folder(initial: string[] = []) {
  const files = new Set(initial);
  const removed: string[] = [];
  const io: ShareFolder = {
    names: () => [...files],
    write: (name) => {
      files.add(name);
      return Promise.resolve(`file:///cache/${name}`);
    },
    remove: (name) => {
      if (!files.delete(name)) throw new Error('missing');
      removed.push(name);
    },
  };
  return { io, files, removed };
}

const png = new Uint8Array([137, 80, 78, 71]);

describe('shareFileName', () => {
  it('names the image after what it is and its day or month', () => {
    expect(shareFileName('receipt', '2026-10-09')).toBe('6pm-receipt-2026-10-09.png');
    expect(shareFileName('money-diary', '2026-09')).toBe('6pm-money-diary-2026-09.png');
  });

  it('drops characters a file name cannot carry', () => {
    expect(shareFileName('receipt', '09/10 18:07')).toBe('6pm-receipt-09101807.png');
    expect(shareFileName('receipt', '')).toBe('6pm-receipt.png');
  });

  it('recognises only its own files', () => {
    expect(isShareFile('6pm-receipt-2026-10-09.png')).toBe(true);
    expect(isShareFile('6pm.sqlite')).toBe(false);
    expect(isShareFile('photo.png')).toBe(false);
  });
});

describe('withShareFile', () => {
  it('hands the written file over and deletes it after the sheet closes', async () => {
    const { io, files } = folder();
    const seen = await withShareFile(io, '6pm-receipt.png', png, (uri) => {
      expect(files.has('6pm-receipt.png')).toBe(true);
      return Promise.resolve(uri);
    });
    expect(seen).toBe('file:///cache/6pm-receipt.png');
    expect(files.size).toBe(0);
  });

  it('deletes the file when sharing fails, and still reports the failure', async () => {
    const { io, files } = folder();
    await expect(
      withShareFile(io, '6pm-receipt.png', png, () => Promise.reject(new Error('no sheet'))),
    ).rejects.toThrow('no sheet');
    expect(files.size).toBe(0);
  });

  it('sweeps images an interrupted share left behind, and nothing else', async () => {
    const { io, files, removed } = folder(['6pm-receipt-2026-10-01.png', 'other.json']);
    await withShareFile(io, '6pm-money-diary-2026-09.png', png, () => Promise.resolve());
    expect(removed).toEqual(['6pm-receipt-2026-10-01.png', '6pm-money-diary-2026-09.png']);
    expect([...files]).toEqual(['other.json']);
  });

  it('does not fail the share when the file is already gone', async () => {
    const { io, files } = folder();
    await expect(
      withShareFile(io, '6pm-receipt.png', png, () => {
        files.clear();
        return Promise.resolve('done');
      }),
    ).resolves.toBe('done');
  });
});
