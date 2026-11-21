import { CHAT_HAT_FAB, type ChatHatStyle } from '../../lib/chatHatStyles';
import { cn } from '../../lib/utils';
import { StrawHatMark } from '../illustrations/StrawHatMark';

export function ChatHatThumb({
  hat,
  className = CHAT_HAT_FAB,
}: {
  hat: ChatHatStyle;
  className?: string;
}) {
  if (hat.src) {
    return (
      <img
        src={hat.src}
        alt=""
        draggable={false}
        className={cn('object-contain drop-shadow-[0_8px_14px_rgba(63,42,27,0.4)]', className)}
      />
    );
  }
  return (
    <StrawHatMark
      variant="plan"
      className={cn('drop-shadow-[0_8px_14px_rgba(63,42,27,0.4)]', className)}
    />
  );
}
