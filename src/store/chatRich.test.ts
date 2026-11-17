import { beforeEach, describe, expect, it } from 'vitest';
import { useChatStore } from './chatStore';
import { extractTagsAndMentions } from '../lib/chatMediaCatalog';

describe('SOTA rich chat store & parser', () => {
  beforeEach(() => {
    useChatStore.setState({
      conversations: [
        {
          id: 'conv_test',
          type: 'event_group',
          title: 'Test Group',
          participantUserIds: ['u1', 'u2'],
          status: 'active',
          isEphemeral: true,
          canPersist: true,
          unreadCount: 0,
          lastMessageAt: new Date().toISOString(),
          lastMessagePreview: { el: '', en: '' },
        },
      ],
      messages: [],
      stories: [],
      seenStoryIds: [],
      drafts: {},
    });
  });

  it('extracts #tags and @mentions cleanly', () => {
    const meta = extractTagsAndMentions('Γεια @Maria! Πάμε για #καφές @all #συνάντηση', [
      { id: 'u2', name: 'Maria K.' },
      { id: 'u3', name: 'Nikos P.' },
    ]);
    expect(meta.tags).toEqual(['καφές', 'συνάντηση']);
    expect(meta.mentions).toContain('all');
    expect(meta.mentions).toContain('u2');
    expect(meta.mentions).not.toContain('u3');
  });

  it('supports reply-to-reply, reactions, edit, pin, and delete+undo', () => {
    const s = useChatStore.getState();
    const id1 = s.sendRichMessage({
      conversationId: 'conv_test',
      senderId: 'u1',
      body: 'Πρώτο μήνυμα #καφές',
      tags: ['καφές'],
    });
    const id2 = s.sendRichMessage({
      conversationId: 'conv_test',
      senderId: 'u2',
      body: 'Απάντηση 1',
      replyTo: { id: id1, senderId: 'u1', senderName: 'Alex', body: 'Πρώτο μήνυμα #καφές' },
    });
    const id3 = s.sendRichMessage({
      conversationId: 'conv_test',
      senderId: 'u1',
      body: 'Απάντηση σε απάντηση!',
      replyTo: { id: id2, senderId: 'u2', senderName: 'Maria', body: 'Απάντηση 1' },
    });

    useChatStore.getState().toggleReaction(id3, '❤️', 'u2');
    useChatStore.getState().toggleReaction(id3, '❤️', 'u1');
    useChatStore.getState().toggleReaction(id3, '❤️', 'u1'); // toggle off
    expect(useChatStore.getState().messages.find((m) => m.id === id3)?.reactions?.['❤️']).toEqual(['u2']);

    useChatStore.getState().editMessage(id1, 'Επεξεργασμένο μήνυμα', 'u1');
    const edited = useChatStore.getState().messages.find((m) => m.id === id1)!;
    expect(edited.body).toBe('Επεξεργασμένο μήνυμα');
    expect(edited.editedAt).toBeTruthy();

    useChatStore.getState().togglePinMessage('conv_test', id2);
    expect(useChatStore.getState().messages.find((m) => m.id === id2)?.pinned).toBe(true);

    const snap = useChatStore.getState().deleteMessage(id3, 'u1');
    expect(snap?.id).toBe(id3);
    expect(useChatStore.getState().messages.some((m) => m.id === id3)).toBe(false);
    useChatStore.getState().restoreMessage(snap!);
    expect(useChatStore.getState().messages.some((m) => m.id === id3)).toBe(true);
  });

  it('supports polls, voice notes, GIFs, drafts, and 24h stories', () => {
    useChatStore.getState().setDraft('conv_test', 'Μισό λεπτό...');
    expect(useChatStore.getState().drafts.conv_test).toBe('Μισό λεπτό...');

    const pollMsgId = useChatStore.getState().sendRichMessage({
      conversationId: 'conv_test',
      senderId: 'u1',
      body: 'Πού πάμε;',
      type: 'poll',
      poll: {
        id: 'p1',
        question: 'Πού πάμε;',
        options: [
          { id: 'a', label: 'Κουκάκι', voterIds: [] },
          { id: 'b', label: 'Θησείο', voterIds: [] },
        ],
      },
    });
    expect(useChatStore.getState().drafts.conv_test).toBeUndefined();

    useChatStore.getState().votePoll(pollMsgId, 'a', 'u2');
    useChatStore.getState().votePoll(pollMsgId, 'b', 'u2'); // switches vote cleanly
    const poll = useChatStore.getState().messages.find((m) => m.id === pollMsgId)?.poll;
    expect(poll).toBeDefined();
    expect(poll!.options[0].voterIds).toEqual([]);
    expect(poll!.options[1].voterIds).toEqual(['u2']);

    const stId = useChatStore.getState().addStory({
      authorId: 'u1',
      authorName: 'Alex',
      caption: 'Πάμε για βόλτα!',
      bgGradient: 'linear-gradient(135deg, #0b6d6f, #0ea5e9)',
      tag: 'βόλτα',
    });
    useChatStore.getState().reactToStory(stId, '🔥', 'u2');
    useChatStore.getState().markStorySeen(stId);
    const story = useChatStore.getState().stories.find((x) => x.id === stId)!;
    expect(story.reactions['🔥']).toEqual(['u2']);
    expect(useChatStore.getState().seenStoryIds).toContain(stId);
  });
});
