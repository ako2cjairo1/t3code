import { RuntimeRequestId } from "@t3tools/contracts";
import { expect, it, vi } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import { render } from "../../../test/render";

vi.mock("~/hooks/useHaloExperience", () => ({ useHaloExperience: () => true }));

import { ComposerPendingApprovalActions } from "./ComposerPendingApprovalActions";

const requestId = RuntimeRequestId.make("approval");
const warning = "Runs outside the sandbox";

it("a risky approval keeps the slide in the danger tone, shows its warning, and a tap never approves", async () => {
  const respond = vi.fn(async () => undefined);
  await using screen = await render(
    <div className="flex flex-wrap">
      <ComposerPendingApprovalActions
        presentation="inline"
        requestId={requestId}
        isResponding={false}
        canRespond
        options={[
          { decision: "decline", label: "Decline" },
          { decision: "accept", label: "Approve", warning },
        ]}
        onRespondToApproval={respond}
      />
    </div>,
  );

  const knob = screen.getByRole("button", { name: "Approve", exact: true });
  await expect.element(knob).toHaveAttribute("aria-description", warning);
  await expect.element(screen.getByText(warning)).toBeVisible();
  expect(document.querySelector("[data-halo-slide]")?.getAttribute("data-tone")).toBe("danger");

  await knob.click();
  expect(respond).not.toHaveBeenCalled();

  (knob.element() as HTMLElement).focus();
  await userEvent.keyboard("{Enter}");
  await vi.waitFor(() => expect(respond).toHaveBeenCalledWith(requestId, "accept"));
});
