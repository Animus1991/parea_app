/**
 * Stub — documents the contract for syncing chat room membership to Firestore.
 * Deploy with Firebase Functions when a project is attached; until then this
 * file is reference-only and is not imported by the SPA.
 *
 * Pseudocode (Admin SDK):
 *
 *   onGroupMembersChanged(groupId, memberIds) {
 *     await db.doc(`chatRooms/${groupId}`).set({ memberIds }, { merge: true });
 *   }
 */

export type ChatMembershipPayload = {
  roomId: string;
  memberIds: string[];
};

export function assertMembershipPayload(payload: ChatMembershipPayload): void {
  if (!payload.roomId?.trim()) throw new Error('roomId required');
  if (!Array.isArray(payload.memberIds)) throw new Error('memberIds required');
}
