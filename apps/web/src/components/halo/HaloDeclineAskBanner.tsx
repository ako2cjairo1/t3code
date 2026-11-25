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
 * provider can't be made to ask, so the composer does; a quick reply is sent as the next message.
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
      <div data-halo-ask="" className="flex flex-wrap items-center gap-1.5">
        {QUICK_REPLIES.map((reply, index) => (
          <Button
            key={reply}
            data-halo-ask-chip={index === 0 ? "primary" : ""}
            size="xs"
            variant="outline"
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => input.onReply(resolve(reply))}
          >
            {resolve(reply)}
          </Button>
        ))}
        <span className="basis-full text-2xs text-muted-foreground">
          {resolve(msg("Or type your answer in the composer."))}
        </span>
      </div>
    ),
  };
}
