import fs from 'node:fs';

const p = 'src/components/groups/GroupChatPageContent.tsx';
let c = fs.readFileSync(p, 'utf8');
const marker = '{showSosConfirm && (';
const start = c.indexOf(marker);
if (start < 0) throw new Error('SOS block not found');

let depth = 0;
let i = start + marker.length - 1;
for (; i < c.length; i++) {
  if (c[i] === '(') depth++;
  if (c[i] === ')') {
    depth--;
    if (depth === 0) {
      i++;
      break;
    }
  }
}

const replacement = `{currentUser && (
          <GroupChatSosModal
            open={showSosConfirm}
            group={group}
            currentUserId={currentUser.id}
            onClose={() => setShowSosConfirm(false)}
            onConfirm={() => {
              const isSos = group?.membersLocations?.[currentUser.id]?.sos;
              useStore.getState().triggerSos(group.id, currentUser.id, !isSos);
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString(),
                  senderId: "system",
                  senderName: "System",
                  text: !isSos
                    ? \`\${currentUser.name} \${t("ενεργοποίησε το SOS Flare! Βρίσκεται σε ανάγκη.", "triggered the SOS flare! They need help.")}\`
                    : \`\${currentUser.name} \${t("απενεργοποίησε το SOS.", "deactivated the SOS.")}\`,
                  timestamp: new Date().toISOString(),
                },
              ]);
              setShowSosConfirm(false);
              if (!isSos) {
                toast.error(t('SOS Flare ενεργοποιήθηκε!', 'SOS Flare activated!'));
              } else {
                toast.info(t('SOS απενεργοποίηκε.', 'SOS deactivated.'));
              }
            }}
          />
        )}`;

c = c.slice(0, start) + replacement + c.slice(i);
fs.writeFileSync(p, c, 'utf8');
console.log('SOS modal extracted');
