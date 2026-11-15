// @vitest-environment node
/**
 * Firestore security rules, tested against the real emulator.
 * Run: npm run test:rules   (starts the emulator, runs this file, stops it)
 * Skipped in the normal unit run when no emulator is reachable.
 */
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

const emulator = process.env.FIRESTORE_EMULATOR_HOST;

describe.skipIf(!emulator)('firestore.rules', () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    const [host, port] = (emulator as string).split(':');
    env = await initializeTestEnvironment({
      projectId: 'nakamas-rules-test',
      firestore: { rules: readFileSync('firestore.rules', 'utf8'), host, port: Number(port) },
    });
  });

  beforeEach(async () => {
    await env.clearFirestore();
  });

  afterAll(async () => {
    await env?.cleanup();
  });

  const profile = (uid: string, extra: Record<string, unknown> = {}) => ({ uid, name: 'Alex', city: 'Athens', interests: ['Music'], ...extra });

  describe('profiles', () => {
    it('lets a user create and read only their own profile', async () => {
      const alice = env.authenticatedContext('alice').firestore();
      const bob = env.authenticatedContext('bob').firestore();
      await assertSucceeds(setDoc(doc(alice, 'profiles/alice'), profile('alice')));
      await assertSucceeds(getDoc(doc(alice, 'profiles/alice')));
      await assertFails(getDoc(doc(bob, 'profiles/alice')));
      await assertFails(setDoc(doc(bob, 'profiles/alice'), profile('alice')));
    });

    it('refuses signed-out access', async () => {
      const anon = env.unauthenticatedContext().firestore();
      await assertFails(getDoc(doc(anon, 'profiles/alice')));
      await assertFails(setDoc(doc(anon, 'profiles/alice'), profile('alice')));
    });

    it('never lets a client grant itself privileged fields', async () => {
      const alice = env.authenticatedContext('alice').firestore();
      for (const key of ['isAdmin', 'isOrganizer', 'trustTier', 'linkedUserId', 'reliabilityScore', 'badges', 'idVerified']) {
        await assertFails(setDoc(doc(alice, 'profiles/alice'), profile('alice', { [key]: true })));
      }
      await assertSucceeds(setDoc(doc(alice, 'profiles/alice'), profile('alice')));
      await assertFails(updateDoc(doc(alice, 'profiles/alice'), { isAdmin: true }));
      await assertSucceeds(updateDoc(doc(alice, 'profiles/alice'), { bio: 'Hi' }));
    });

    it('validates shape and forbids deletes', async () => {
      const alice = env.authenticatedContext('alice').firestore();
      await assertFails(setDoc(doc(alice, 'profiles/alice'), profile('alice', { name: '' })));
      await assertFails(setDoc(doc(alice, 'profiles/alice'), profile('alice', { bio: 'x'.repeat(501) })));
      await assertFails(setDoc(doc(alice, 'profiles/alice'), profile('mallory')));
      await assertSucceeds(setDoc(doc(alice, 'profiles/alice'), profile('alice')));
      await assertFails(deleteDoc(doc(alice, 'profiles/alice')));
    });
  });

  describe('chat rooms', () => {
    beforeEach(async () => {
      // Rooms are written by a trusted backend only.
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'chatRooms/g1'), { memberIds: ['alice', 'bob'] });
      });
    });

    const message = (senderId: string, body = 'hello') => ({ senderId, body, createdAt: serverTimestamp() });

    it('lets members read and post as themselves', async () => {
      const alice = env.authenticatedContext('alice').firestore();
      await assertSucceeds(getDoc(doc(alice, 'chatRooms/g1')));
      await assertSucceeds(addDoc(collection(alice, 'chatRooms/g1/messages'), message('alice')));
    });

    it('keeps non-members out of an existing room', async () => {
      const eve = env.authenticatedContext('eve').firestore();
      await assertFails(getDoc(doc(eve, 'chatRooms/g1')));
      await assertFails(addDoc(collection(eve, 'chatRooms/g1/messages'), message('eve')));
    });

    it('blocks spoofed senders, extra fields, empty or huge bodies, edits and deletes', async () => {
      const alice = env.authenticatedContext('alice').firestore();
      await assertFails(addDoc(collection(alice, 'chatRooms/g1/messages'), message('bob')));
      await assertFails(addDoc(collection(alice, 'chatRooms/g1/messages'), { ...message('alice'), pinned: true }));
      await assertFails(addDoc(collection(alice, 'chatRooms/g1/messages'), message('alice', '')));
      await assertFails(addDoc(collection(alice, 'chatRooms/g1/messages'), message('alice', 'x'.repeat(4001))));
      const ref = doc(alice, 'chatRooms/g1/messages/m1');
      await assertSucceeds(setDoc(ref, message('alice')));
      await assertFails(updateDoc(ref, { body: 'edited' }));
      await assertFails(deleteDoc(ref));
    });

    it('never lets a client create or change a room', async () => {
      const alice = env.authenticatedContext('alice').firestore();
      await assertFails(setDoc(doc(alice, 'chatRooms/g2'), { memberIds: ['alice'] }));
      await assertFails(updateDoc(doc(alice, 'chatRooms/g1'), { memberIds: ['alice', 'eve'] }));
    });

    it('keeps the demo behaviour for rooms the backend has not created yet', async () => {
      const alice = env.authenticatedContext('alice').firestore();
      const anon = env.unauthenticatedContext().firestore();
      await assertSucceeds(addDoc(collection(alice, 'chatRooms/local-demo/messages'), message('alice')));
      await assertFails(addDoc(collection(anon, 'chatRooms/local-demo/messages'), message('alice')));
    });
  });

  it('denies every other path', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(getDoc(doc(alice, 'events/e1')));
    await assertFails(setDoc(doc(alice, 'anything/x'), { a: 1 }));
  });
});
