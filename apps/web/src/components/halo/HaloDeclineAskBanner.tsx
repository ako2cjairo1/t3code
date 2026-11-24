import { msg } from "gt-react";
import { MessageCircleQuestionIcon } from "lucide-react";

import { m, type MessageResolver } from "../../i18n/messages";
import { Button } from "../ui/button";
import type { ComposerBannerStackItem } from "../chat/ComposerBannerStack";

const QUICK_REPLIES = [
  msg("Try a different approach"),
  msg("Explain the change first"),
  msg("Stop here"),
];

/**
 * Liquid Halo: after the user declines an approval, ask how the agent should proceed. The
 * provider can't be made to ask, so the composer does; a reply prefills the draft.
 */
export function haloDeclineAskBannerItem(
  input: { readonly onReply: (text: string) => void; readonly onDismiss: () => void },
  resolve: MessageResolver = m,
): ComposerBannerStackItem {
  return {
    id: "halo-decline-ask",
    variant: "info",
    icon: <MessageCircleQuestionIcon />,
    title: resolve(msg("You declined, so the agent stopped")),
    description: resolve(msg("How should it proceed?")),
    dismissLabel: resolve(msg("Dismiss")),
    onDismiss: input.onDismiss,
    children: (
      <div className="flex flex-wrap gap-1.5">
        {QUICK_REPLIES.map((reply) => (
          <Button
            key={reply}
            size="xs"
            variant="outline"
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => input.onReply(resolve(reply))}
          >
            {resolve(reply)}
          </Button>
        ))}
      </div>
    ),
  };
}
