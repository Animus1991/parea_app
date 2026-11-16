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

  describe('wall & audiences (Φ26)', () => {
    // alice ⇄ bob ⇄ carol, alice ⇄ dave; eve is a stranger.
    beforeEach(async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore();
        await setDoc(doc(db, 'socialGraph/alice'), { connections: ['bob', 'dave'], blocked: [] });
        await setDoc(doc(db, 'socialGraph/bob'), { connections: ['alice', 'carol'], blocked: [] });
        await setDoc(doc(db, 'socialGraph/carol'), { connections: ['bob'], blocked: [] });
        await setDoc(doc(db, 'socialGraph/dave'), { connections: ['alice'], blocked: [] });
        await setDoc(doc(db, 'audienceLists/close'), { ownerId: 'alice', name: 'Close', memberIds: ['bob'], createdAt: 1 });
        const post = (id: string, audience: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
          setDoc(doc(db, `wallPosts/${id}`), { authorId: 'alice', wallOwnerId: 'alice', text: id, audience, createdAt: 1, ...extra });
        await post('pub', { base: 'public' });
        await post('conn', { base: 'connections' });
        await post('except', { base: 'connections', excludeIds: ['bob'] });
        await post('spec', { base: 'specific', includeIds: ['bob'] });
        await post('list', { base: 'list', listId: 'close' });
        await post('me', { base: 'only_me' });
        await post('fof', { base: 'friends_of_friends', reachIds: ['carol'] });
        await post('closed', { base: 'connections' }, { commentsDisabled: true });
        // bob wrote on alice's wall; alice keeps others' posts to herself.
        await setDoc(doc(db, 'wallPosts/onAlice'), { authorId: 'bob', wallOwnerId: 'alice', text: 'hi', audience: { base: 'connections' }, createdAt: 1 });
        await setDoc(doc(db, 'wallSettings/alice'), { othersPostsAudience: { base: 'only_me' }, whoCanPost: { base: 'connections' }, whoCanComment: { base: 'connections' } });
        await setDoc(doc(db, 'wallSettings/carol'), { whoCanPost: { base: 'only_me' } });
      });
    });

    const as = (uid: string) => env.authenticatedContext(uid).firestore();
    const read = (uid: string, id: string) => getDoc(doc(as(uid), `wallPosts/${id}`));

    it('enforces every audience on reads', async () => {
      await assertSucceeds(read('eve', 'pub'));
      await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'wallPosts/pub')));
      await assertSucceeds(read('bob', 'conn'));
      await assertFails(read('eve', 'conn'));
      await assertFails(read('bob', 'except'));
      await assertSucceeds(read('dave', 'except'));
      await assertSucceeds(read('bob', 'spec'));
      await assertFails(read('dave', 'spec'));
      await assertSucceeds(read('bob', 'list'));
      await assertFails(read('dave', 'list'));
      await assertFails(read('bob', 'me'));
      await assertSucceeds(read('alice', 'me'));
      await assertSucceeds(read('carol', 'fof'));
      await assertFails(read('eve', 'fof'));
    });

    it('lets blocks win over a public audience', async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'socialGraph/alice'), { connections: ['bob', 'dave'], blocked: ['eve'] });
      });
      await assertFails(read('eve', 'pub'));
    });

    it('applies the wall owner’s setting to posts others wrote there', async () => {
      await assertSucceeds(read('bob', 'onAlice')); // author
      await assertSucceeds(read('alice', 'onAlice')); // wall owner
      await assertFails(read('dave', 'onAlice')); // alice: others' posts → only me
    });

    it('only lets people the owner allows write on a wall, as themselves', async () => {
      const newPost = (author: string, owner: string, audience: Record<string, unknown> = { base: 'connections' }) => ({
        authorId: author, wallOwnerId: owner, text: 'hey', audience, createdAt: serverTimestamp(),
      });
      await assertSucceeds(addDoc(collection(as('bob'), 'wallPosts'), newPost('bob', 'alice')));
      await assertFails(addDoc(collection(as('eve'), 'wallPosts'), newPost('eve', 'alice')));
      await assertFails(addDoc(collection(as('bob'), 'wallPosts'), newPost('alice', 'alice')));
      await assertFails(addDoc(collection(as('bob'), 'wallPosts'), newPost('bob', 'carol')));
      await assertFails(addDoc(collection(as('alice'), 'wallPosts'), newPost('alice', 'alice', { base: 'everyone' })));
      await assertFails(addDoc(collection(as('alice'), 'wallPosts'), { ...newPost('alice', 'alice'), text: 'x'.repeat(2001) }));
      await assertSucceeds(addDoc(collection(as('alice'), 'wallPosts'), newPost('alice', 'alice', { base: 'list', listId: 'close' })));
    });

    it('splits edit rights between author and wall owner', async () => {
      await assertSucceeds(updateDoc(doc(as('alice'), 'wallPosts/conn'), { text: 'edited', editedAt: 2 }));
      await assertFails(updateDoc(doc(as('bob'), 'wallPosts/conn'), { text: 'hacked' }));
      await assertFails(updateDoc(doc(as('alice'), 'wallPosts/conn'), { authorId: 'bob' }));
      // bob (author) cannot widen the audience of his post on alice's wall; alice can pin it.
      await assertFails(updateDoc(doc(as('bob'), 'wallPosts/onAlice'), { audience: { base: 'public' } }));
      await assertSucceeds(updateDoc(doc(as('alice'), 'wallPosts/onAlice'), { pinned: true }));
      await assertSucceeds(deleteDoc(doc(as('alice'), 'wallPosts/onAlice')));
      await assertFails(deleteDoc(doc(as('bob'), 'wallPosts/conn')));
    });

    it('guards comments and reactions by the post’s visibility', async () => {
      const comment = (authorId: string, text = 'nice') => ({ authorId, text, createdAt: serverTimestamp() });
      await assertSucceeds(addDoc(collection(as('bob'), 'wallPosts/conn/comments'), comment('bob')));
      await assertFails(addDoc(collection(as('eve'), 'wallPosts/conn/comments'), comment('eve')));
      // alice lets only connections comment, even on public posts.
      await assertFails(addDoc(collection(as('eve'), 'wallPosts/pub/comments'), comment('eve')));
      await assertFails(addDoc(collection(as('bob'), 'wallPosts/closed/comments'), comment('bob')));
      await assertFails(addDoc(collection(as('bob'), 'wallPosts/conn/comments'), comment('alice')));
      await assertSucceeds(setDoc(doc(as('bob'), 'wallPosts/conn/reactions/bob'), { kind: 'love' }));
      await assertFails(setDoc(doc(as('bob'), 'wallPosts/conn/reactions/dave'), { kind: 'love' }));
      await assertFails(setDoc(doc(as('eve'), 'wallPosts/conn/reactions/eve'), { kind: 'like' }));
      await assertFails(setDoc(doc(as('bob'), 'wallPosts/conn/reactions/bob'), { kind: 'angry' }));
    });

    it('keeps lists, wall settings and the social graph private', async () => {
      await assertSucceeds(getDoc(doc(as('alice'), 'audienceLists/close')));
      await assertFails(getDoc(doc(as('bob'), 'audienceLists/close')));
      await assertFails(setDoc(doc(as('bob'), 'audienceLists/x'), { ownerId: 'alice', name: 'n', memberIds: [], createdAt: 1 }));
      await assertFails(getDoc(doc(as('bob'), 'wallSettings/alice')));
      await assertFails(setDoc(doc(as('alice'), 'wallSettings/alice'), { whoCanPost: { base: 'public' } }));
      await assertSucceeds(setDoc(doc(as('alice'), 'wallSettings/alice'), { whoCanPost: { base: 'only_me' } }));
      await assertFails(setDoc(doc(as('eve'), 'socialGraph/eve'), { connections: ['alice'] }));
      await assertFails(getDoc(doc(as('eve'), 'socialGraph/alice')));
    });

    it('accepts a fine-grained profile audience and rejects malformed ones', async () => {
      const alice = as('alice');
      await assertSucceeds(setDoc(doc(alice, 'profiles/alice'), profile('alice', {
        privacy: { profileVisibility: 'connections', profileAudience: { base: 'connections', excludeIds: ['bob'] } },
      })));
      await assertFails(setDoc(doc(alice, 'profiles/alice'), profile('alice', {
        privacy: { profileVisibility: 'connections', profileAudience: { base: 'everyone' } },
      })));
    });
  });

  it('denies every other path', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(getDoc(doc(alice, 'events/e1')));
    await assertFails(setDoc(doc(alice, 'anything/x'), { a: 1 }));
  });
});
