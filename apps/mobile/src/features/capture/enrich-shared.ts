import type { InboxSpend } from '@6pm/domain';

/**
 * What 6pm can add to a shared receipt before saving it: the payee's name, read from the
 * receipt's number-free lines. Until naming is built the receipt is saved as the extension read it.
 */
export function enrichShared(item: InboxSpend): Promise<InboxSpend> {
  return Promise.resolve(item);
}
