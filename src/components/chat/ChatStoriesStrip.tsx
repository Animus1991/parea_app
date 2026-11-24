import { useEffect, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Send, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useChatStore } from '../../store/chatStore';
import { useFittedOpenConversation } from '../../hooks/useFittedOpenConversation';
import { useStore } from '../../store';
import type { ChatStory } from '../../types/chat';
import { STORY_BG_GRADIENTS } from '../../lib/chatMediaCatalog';
import { fileToResizedDataUrl, imageErrorText } from '../../lib/imageResize';
import { Modal } from '../common/Modal';
import { cn } from '../../lib/utils';

const STORY_REACTIONS = ['🔥', '❤️', '😂', '👏', '🎉'] as const;

export function ChatStoriesStrip({
  conversationId,
  compact = false,
}: {
  conversationId?: string;
  compact?: boolean;
}) {
  const { t } = useLanguage();
  const viewer = useStore((s) => s.currentUser);
  const stories = useChatStore((s) => s.stories);
  const seenStoryIds = useChatStore((s) => s.seenStoryIds);
  const markStorySeen = useChatStore((s) => s.markStorySeen);
  const reactToStory = useChatStore((s) => s.reactToStory);
  const addStory = useChatStore((s) => s.addStory);
  const sendRichMessage = useChatStore((s) => s.sendRichMessage);
  const openConversation = useFittedOpenConversation();
  const ensureDirectConversation = useChatStore((s) => s.ensureDirectConversation);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newBg, setNewBg] = useState<string>(STORY_BG_GRADIENTS[0]);
  const [newTag, setNewTag] = useState('');
  const [newPhoto, setNewPhoto] = useState<string | undefined>(undefined);

  const nowMs = Date.now();
  const activeStories = stories.filter((st) => new Date(st.expiresAt).getTime() > nowMs);
  const viewingStory: ChatStory | null =
    activeIndex !== null && activeStories[activeIndex] ? activeStories[activeIndex] : null;

  useEffect(() => {
    if (viewingStory) {
      markStorySeen(viewingStory.id);
    }
  }, [viewingStory, markStorySeen]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await fileToResizedDataUrl(file, { maxSize: 720, quality: 0.85 });
      setNewPhoto(dataUrl);
    } catch (err) {
      toast.error(imageErrorText(err, t));
    }
  };

  const handlePublishStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewer || (!newCaption.trim() && !newPhoto)) return;
    addStory({
      authorId: viewer.id,
      authorName: viewer.name.split(' ')[0] || viewer.name,
      authorAvatar: viewer.photoUrl,
      caption: newCaption.trim() || t('Νέα στιγμή', 'New moment'),
      imageUrl: newPhoto,
      bgGradient: newBg,
      tag: newTag.replace(/^#/, '').trim() || undefined,
    });
    setNewCaption('');
    setNewTag('');
    setNewPhoto(undefined);
    setCreateOpen(false);
    toast.success(t('Η ιστορία δημοσιεύτηκε για 24 ώρες', 'Story published (24h)'));
  };

  const handleStoryReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingStory || !viewer || !replyText.trim()) return;
    let targetConvId = conversationId;
    if (!targetConvId) {
      targetConvId =
        ensureDirectConversation({
          selfUserId: viewer.id,
          peerUserId: viewingStory.authorId,
          peerName: viewingStory.authorName,
          openWindow: true,
        }) ?? undefined;
    }
    if (targetConvId) {
      sendRichMessage({
        conversationId: targetConvId,
        senderId: viewer.id,
        body: replyText.trim(),
        type: 'story_reply',
        storyRef: {
          storyId: viewingStory.id,
          authorId: viewingStory.authorId,
          authorName: viewingStory.authorName,
          caption: viewingStory.caption,
          bg: viewingStory.bgGradient,
        },
      });
      openConversation(targetConvId);
    }
    setReplyText('');
    setActiveIndex(null);
    toast.success(t('Η απάντηση στάλθηκε στη συνομιλία', 'Reply sent to chat'));
  };

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-2.5 overflow-x-auto noscrollbar border-b border-border shrink-0',
          compact ? 'px-3 py-2' : 'px-4 py-2.5',
        )}
        aria-label={t('Ιστορίες Nakamas', 'Nakamas Stories')}
      >
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex flex-col items-center gap-1 shrink-0 group focus-visible:outline-none"
        >
          <span className="w-10 h-10 rounded-full border border-dashed border-brand/60 bg-brand-soft text-brand flex items-center justify-center group-hover:scale-105 transition-transform">
            <Plus className="w-4 h-4" aria-hidden />
          </span>
          <span className="text-2xs font-bold text-ink-muted max-w-[52px] truncate">
            {t('Ιστορία', 'Story')}
          </span>
        </button>

        {activeStories.map((st, idx) => {
          const seen = seenStoryIds.includes(st.id);
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className="flex flex-col items-center gap-1 shrink-0 group focus-visible:outline-none"
            >
              <span
                className={cn(
                  'p-[1.56px] rounded-full transition-transform group-hover:scale-105',
                  seen
                    ? 'bg-border-strong'
                    : 'bg-gradient-to-tr from-cyan-500 via-teal-400 to-amber-400',
                )}
              >
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-extrabold border-2 border-surface overflow-hidden"
                  style={{ background: st.bgGradient }}
                >
                  {st.imageUrl ? (
                    <img src={st.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    st.authorName.slice(0, 1).toUpperCase()
                  )}
                </span>
              </span>
              <span className="text-2xs font-semibold text-ink max-w-[54px] truncate">
                {st.authorName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Story Viewer */}
      {viewingStory && (
        <div
          className="fixed inset-0 z-fullscreen bg-black/85 backdrop-blur-sm flex items-center justify-center p-3"
          role="dialog"
          aria-modal="true"
          aria-label={t(`Story · ${viewingStory.authorName}`, `Story · ${viewingStory.authorName}`)}
        >
          <div
            className="relative w-full max-w-sm h-[520px] max-h-[88vh] rounded-3xl overflow-hidden shadow-soft-lg flex flex-col text-white"
            style={{ background: viewingStory.bgGradient }}
          >
            {viewingStory.imageUrl && (
              <img
                src={viewingStory.imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-55"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/75" />

            {/* Progress bars */}
            <div className="relative z-10 flex gap-1 px-3 pt-3">
              {activeStories.map((st, idx) => (
                <div key={st.id} className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden">
                  <div
                    className={cn(
                      'h-full bg-white rounded-full transition-all duration-300',
                      idx <= (activeIndex ?? 0) ? 'w-full' : 'w-0',
                    )}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xs font-extrabold">
                  {viewingStory.authorName.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <p className="text-xs font-bold leading-none">{viewingStory.authorName}</p>
                  {viewingStory.tag && (
                    <span className="text-2xs text-white/80">#{viewingStory.tag}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveIndex(null)}
                aria-label={t('Κλείσιμο', 'Close')}
                className="p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Center caption + tap nav */}
            <div className="relative z-10 flex-1 flex items-center justify-between px-3">
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))
                }
                disabled={activeIndex === 0}
                aria-label={t('Προηγούμενο', 'Previous')}
                className="p-2 rounded-full bg-black/25 hover:bg-black/45 disabled:opacity-20"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <p className="px-4 text-center text-sm font-bold leading-relaxed drop-shadow">
                {viewingStory.caption}
              </p>
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((prev) =>
                    prev !== null && prev < activeStories.length - 1 ? prev + 1 : null,
                  )
                }
                aria-label={t('Επόμενο', 'Next')}
                className="p-2 rounded-full bg-black/25 hover:bg-black/45"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Reactions + direct reply to chat */}
            <div className="relative z-10 p-3 space-y-2.5">
              <div className="flex items-center justify-center gap-2">
                {STORY_REACTIONS.map((em) => {
                  const count = viewingStory.reactions[em]?.length ?? 0;
                  const mine = viewer && viewingStory.reactions[em]?.includes(viewer.id);
                  return (
                    <button
                      key={em}
                      type="button"
                      onClick={() => viewer && reactToStory(viewingStory.id, em, viewer.id)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm transition-transform active:scale-95',
                        mine ? 'bg-white text-gray-900' : 'bg-black/40 text-white hover:bg-black/60',
                      )}
                    >
                      {em} {count > 0 ? count : ''}
                    </button>
                  );
                })}
              </div>
              <form onSubmit={handleStoryReply} className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t('Απάντησε στην ιστορία…', 'Reply to story...')}
                  className="flex-1 min-h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-3.5 text-xs text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  aria-label={t('Αποστολή', 'Send')}
                  className="min-h-9 px-3 rounded-full bg-white text-gray-900 font-bold text-xs flex items-center gap-1 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Story Modal */}
      <Modal
        open={createOpen}
        aboveChat
        onClose={() => setCreateOpen(false)}
        title={t('Νέα ιστορία για 24 ώρες', 'Create Story (24h)')}
        size="sm"
      >
        <form onSubmit={handlePublishStory} className="space-y-3">
          <div
            className="h-36 rounded-2xl p-4 flex items-center justify-center text-center text-white relative overflow-hidden"
            style={{ background: newBg }}
          >
            {newPhoto && (
              <img src={newPhoto} alt="" className="absolute inset-0 w-full h-full object-cover opacity-55" />
            )}
            <p className="relative z-10 text-sm font-bold drop-shadow">
              {newCaption.trim() || t('Γράψε τι κάνεις ή πού είσαι…', 'Share what you are up to…')}
            </p>
          </div>
          <textarea
            value={newCaption}
            onChange={(e) => setNewCaption(e.target.value)}
            rows={2}
            maxLength={160}
            placeholder={t('Κείμενο ιστορίας…', 'Story caption…')}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 p-1.5">
              {STORY_BG_GRADIENTS.map((g, i) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setNewBg(g)}
                  aria-label={`${t('Χρώμα', 'Color')} ${i + 1}`}
                  aria-pressed={newBg === g}
                  className="tap-area flex w-8 h-8 items-center justify-center rounded-full"
                >
                  <span
                    className={cn('w-6 h-6 rounded-full border-2', newBg === g ? 'border-ink scale-110' : 'border-transparent')}
                    style={{ background: g }}
                  />
                </button>
              ))}
            </div>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-bold text-ink cursor-pointer hover:bg-surface">
              <ImageIcon className="w-3.5 h-3.5" aria-hidden />
              {t('Φωτό', 'Photo')}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder={t('#tag (προαιρετικό, π.χ. καφές)', '#tag (optional, e.g. coffee)')}
            className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-ink focus:outline-none"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-1.5 min-h-8 rounded-full border border-border text-xs font-bold text-ink-muted"
            >
              {t('Ακύρωση', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={!newCaption.trim() && !newPhoto}
              className="px-4 py-1.5 min-h-8 rounded-full bg-brand text-brand-fg text-xs font-bold disabled:opacity-50"
            >
              {t('Δημοσίευση', 'Publish')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
