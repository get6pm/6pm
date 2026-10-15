import { describe, expect, it, jest } from '@jest/globals';

import { CATEGORY_ICONS } from '@6pm/domain';
import { t } from '@6pm/i18n';

import type { ApiClient } from '../api/api-client';
import { ApiRequestError } from '../api/api-error';
import { DEFAULT_CATEGORIES } from '../../data/onboarding';
import { ICON_PACKS } from './icon-packs';
import { askCategoryIcon, mayAutoPick, usableIcons } from './icon-suggestion';

describe('the icons a name can choose from', () => {
  it('are exactly the icons the packs draw, so the server knows every one', () => {
    const drawn = ICON_PACKS.flatMap((pack) => pack.icons);
    expect([...drawn].sort()).toEqual([...CATEGORY_ICONS].sort());
  });

  it('are the free pack alone until Max is on', () => {
    expect(usableIcons(false)).toEqual(ICON_PACKS.find((pack) => pack.free)?.icons);
    expect(usableIcons(true)).toHaveLength(CATEGORY_ICONS.length);
  });
});

describe('when the editor may choose the icon', () => {
  it('chooses for a new category', () => {
    expect(mayAutoPick({ name: '', icon: 'pets' })).toBe(true);
  });

  it('chooses for a category still wearing the icon its name points to', () => {
    expect(mayAutoPick({ name: 'Cà phê', icon: 'local_cafe' })).toBe(true);
  });

  it('never replaces an icon picked by hand', () => {
    expect(mayAutoPick({ name: 'Cà phê', icon: 'pets' })).toBe(false);
  });

  // Groceries starts on a basket no pack draws and Shopping on the mall, not the bag its name finds.
  it.each(
    DEFAULT_CATEGORIES.filter(([id]) => id !== 'groceries' && id !== 'shopping').map(
      ([id, icon]) => ({ id, icon }),
    ),
  )('keeps the starter $id, named in either language, following its name', ({ id, icon }) => {
    for (const language of ['en', 'vi'] as const) {
      expect(mayAutoPick({ name: t(language, `onboarding.category.${id}`), icon })).toBe(true);
    }
  });
});

describe('asking the server for an icon', () => {
  const icons = ['restaurant', 'local_cafe', 'pets'];
  const answering = (answer: Promise<unknown>) =>
    jest.fn(() => answer) as unknown as ApiClient['request'];

  it('sends the trimmed name and the usable icons, and takes the answer', async () => {
    const request = answering(Promise.resolve({ icon: 'pets' }));
    await expect(askCategoryIcon(request, '  Chó mèo ', icons)).resolves.toBe('pets');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/v1/category-icon',
        body: { name: 'Chó mèo', icons },
      }),
    );
  });

  it('keeps the icon it has when the server is unsure, answers outside the list, or fails', async () => {
    await expect(
      askCategoryIcon(answering(Promise.resolve({ icon: null })), 'x', icons),
    ).resolves.toBeNull();
    await expect(
      askCategoryIcon(answering(Promise.resolve({ icon: 'movie' })), 'x', icons),
    ).resolves.toBeNull();
    await expect(
      askCategoryIcon(
        answering(Promise.reject(new ApiRequestError('network', 'offline', true))),
        'x',
        icons,
      ),
    ).resolves.toBeNull();
  });
});
