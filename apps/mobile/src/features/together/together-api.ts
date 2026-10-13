import {
  createInviteResponseSchema,
  deleteTogetherAccountResponseSchema,
  leaveResponseSchema,
  togetherStateSchema,
  type TogetherState,
} from '@6pm/domain';

import type { ApiClient } from '../api/api-client';
import type { TogetherOp } from './together-state';

export interface AppleCredential {
  readonly identityToken: string;
  readonly authorizationCode: string | null;
  readonly name: string | null;
}

/** Budget together's routes, each answering with the whole shared copy where it can. */
export interface TogetherApi {
  fetchState(): Promise<TogetherState>;
  signIn(credential: AppleCredential): Promise<TogetherState>;
  createInvite(): Promise<{ code: string; expiresAt: string }>;
  acceptInvite(code: string): Promise<TogetherState>;
  send(op: TogetherOp): Promise<TogetherState>;
  leave(): Promise<void>;
  deleteAccount(): Promise<void>;
}

const state = togetherStateSchema;

export function createTogetherApi(api: ApiClient): TogetherApi {
  return {
    fetchState: () => api.request({ path: '/v1/together', schema: state }),
    signIn: (credential) =>
      api.request({
        method: 'POST',
        path: '/v1/together/sign-in',
        schema: state,
        body: {
          identityToken: credential.identityToken,
          ...(credential.authorizationCode === null
            ? {}
            : { authorizationCode: credential.authorizationCode }),
          ...(credential.name === null ? {} : { name: credential.name }),
        },
      }),
    createInvite: () =>
      api.request({
        method: 'POST',
        path: '/v1/together/invites',
        schema: createInviteResponseSchema,
      }),
    acceptInvite: (code) =>
      api.request({
        method: 'POST',
        path: `/v1/together/invites/${encodeURIComponent(code)}/accept`,
        schema: state,
      }),
    send: (op) => {
      switch (op.kind) {
        case 'createPot':
          return api.request({
            method: 'POST',
            path: '/v1/together/pots',
            schema: state,
            body: { id: op.id, ...op.fields },
          });
        case 'editPot':
          return api.request({
            method: 'PUT',
            path: `/v1/together/pots/${op.id}`,
            schema: state,
            body: op.fields,
          });
        case 'deletePot':
          return api.request({
            method: 'DELETE',
            path: `/v1/together/pots/${op.id}`,
            schema: state,
          });
        case 'addContribution':
          return api.request({
            method: 'POST',
            path: `/v1/together/pots/${op.potId}/contributions`,
            schema: state,
            body: { id: op.id, amount: op.amount },
          });
        case 'removeContribution':
          return api.request({
            method: 'DELETE',
            path: `/v1/together/contributions/${op.id}`,
            schema: state,
          });
      }
    },
    leave: async () => {
      await api.request({
        method: 'POST',
        path: '/v1/together/leave',
        schema: leaveResponseSchema,
      });
    },
    deleteAccount: async () => {
      await api.request({
        method: 'DELETE',
        path: '/v1/together/account',
        schema: deleteTogetherAccountResponseSchema,
      });
    },
  };
}
