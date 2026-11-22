import { beforeEach, describe, expect, it } from 'vitest';
import { mockAudienceLists, mockWallPosts, mockWallPrivacy } from '../data/mockWall';
import { mockUsers } from '../data/mockUsers';
import { DEFAULT_USER_SETTINGS, useStore } from './index';
import { useWallStore } from './wallStore';

const seedConnectionRequests = useStore.getState().connectionRequests;
const image = (n: number) => `data:image/png;base64,${n}`;

function resetWallRound7() {
  useStore.setState({
    users: mockUsers.map((user) => ({ ...user, connections: [...(user.connections ?? [])] })),
    blockedUserIds: [],
    suspendedUserIds: [],
    connectionRequests: seedConnectionRequests.map((request) => ({ ...request })),
    userSettings: { ...DEFAULT_USER_SETTINGS, privacy: { ...DEFAULT_USER_SETTINGS.privacy } },
  });
  useStore.getState().login('u1');
  useWallStore.setState({
    posts: mockWallPosts.map((post) => ({
      ...post,
      reactions: { ...post.reactions },
      comments: [...post.comments],
    })),
    lists: mockAudienceLists.map((list) => ({ ...list, memberIds: [...list.memberIds] })),
    privacyByUser: { ...mockWallPrivacy },
    hiddenPostIds: {},
    feedSeenAt: {},
    savedPostIds: {},
  });
}

describe('Wall round 7 post fields', () => {
  beforeEach(resetWallRound7);

  it('rejects more than four images and mirrors the first image for older readers', () => {
    const wall = useWallStore.getState();
    expect(wall.createPost({ text: 'Too many', imageUrls: [1, 2, 3, 4, 5].map(image) }).ok).toBe(false);

    const result = wall.createPost({ text: 'A small gallery', imageUrls: [image(1), image(2)] });
    expect(result.ok).toBe(true);
    const created = useWallStore.getState().posts[0];
    expect(created.imageUrls).toEqual([image(1), image(2)]);
    expect(created.imageUrl).toBe(image(1));
  });

  it('creates a poll, moves a single vote, and lets the voter remove it', () => {
    const result = useWallStore.getState().createPost({
      text: '',
      poll: {
        id: 'poll-1',
        question: 'Where next?',
        options: [
          { id: 'option-a', label: 'Sea', voterIds: [] },
          { id: 'option-b', label: 'Mountains', voterIds: [] },
        ],
      },
    });
    expect(result.ok).toBe(true);
    const postId = (result as { id: string }).id;

    expect(useWallStore.getState().votePoll(postId, 'option-a').ok).toBe(true);
    expect(useWallStore.getState().posts.find((post) => post.id === postId)?.poll?.options[0].voterIds).toEqual(['u1']);
    expect(useWallStore.getState().votePoll(postId, 'option-b').ok).toBe(true);
    const switched = useWallStore.getState().posts.find((post) => post.id === postId)?.poll?.options;
    expect(switched?.[0].voterIds).toEqual([]);
    expect(switched?.[1].voterIds).toEqual(['u1']);

    expect(useWallStore.getState().votePoll(postId, 'option-b').ok).toBe(true);
    const removed = useWallStore.getState().posts.find((post) => post.id === postId)?.poll?.options;
    expect(removed?.every((option) => option.voterIds.length === 0)).toBe(true);
  });

  it('uses post text for an empty poll question and stores a validated feeling and trimmed location', () => {
    const result = useWallStore.getState().createPost({
      text: 'A night out',
      feeling: 'excited',
      location: '  Θησείο  ',
      poll: {
        id: 'poll-2',
        question: '',
        options: [
          { id: 'a', label: 'Friday', voterIds: [] },
          { id: 'b', label: 'Saturday', voterIds: [] },
        ],
      },
    });
    expect(result.ok).toBe(true);
    const created = useWallStore.getState().posts[0];
    expect(created.feeling).toBe('excited');
    expect(created.location).toBe('Θησείο');
    expect(created.poll?.question).toBe('A night out');
  });

  it('drops text backgrounds when photos are attached or the text exceeds 140 characters', () => {
    const photoPost = useWallStore.getState().createPost({
      text: 'A photo',
      imageUrls: [image(1)],
      bg: 'bg1',
    });
    const longPost = useWallStore.getState().createPost({ text: 'x'.repeat(141), bg: 'bg2' });
    expect(photoPost.ok).toBe(true);
    expect(longPost.ok).toBe(true);
    expect(useWallStore.getState().posts.find((post) => post.id === (photoPost as { id: string }).id)?.bg).toBeUndefined();
    expect(useWallStore.getState().posts.find((post) => post.id === (longPost as { id: string }).id)?.bg).toBeUndefined();
  });

  it('accepts a GIF-only post and keeps a valid short-text background', () => {
    const gifPost = useWallStore.getState().createPost({ text: '', gifUrl: 'https://media.example.test/gif.gif' });
    const backgroundPost = useWallStore.getState().createPost({ text: 'A little note', bg: 'bg3' });
    expect(gifPost.ok).toBe(true);
    expect(backgroundPost.ok).toBe(true);
    expect(useWallStore.getState().posts.find((post) => post.id === (gifPost as { id: string }).id)?.gifUrl).toContain('gif.gif');
    expect(useWallStore.getState().posts.find((post) => post.id === (backgroundPost as { id: string }).id)?.bg).toBe('bg3');
  });

  it('toggles the viewer saved-post list', () => {
    const result = useWallStore.getState().createPost({ text: 'Save this' });
    const postId = (result as { id: string }).id;
    expect(useWallStore.getState().toggleSavedPost(postId)).toBe(true);
    expect(useWallStore.getState().savedPostIds.u1).toContain(postId);
    expect(useWallStore.getState().toggleSavedPost(postId)).toBe(false);
    expect(useWallStore.getState().savedPostIds.u1).not.toContain(postId);
  });
});
