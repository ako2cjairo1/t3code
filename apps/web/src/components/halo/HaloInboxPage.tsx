import { observeVisibleAnimation } from "~/lib/visibleAnimation";
import { thrownErrorMessage } from "@t3tools/client-runtime/errors";
import { scopeThreadRef, scopedThreadKey } from "@t3tools/client-runtime/environment";
import type { EnvironmentThreadShell } from "@t3tools/client-runtime/state/models";
import {
  isAtomCommandInterrupted,
  squashAtomCommandFailure,
} from "@t3tools/client-runtime/state/runtime";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { Link } from "@tanstack/react-router";
import { useGT, useMessages } from "gt-react";
import { CheckIcon } from "lucide-react";
import {
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { useNowMinute } from "~/hooks/useNowMinute";
import { useStableCallback } from "~/hooks/useStableCallback";
import { useThreadActions } from "~/hooks/useThreadActions";
import { cn } from "~/lib/utils";
import { useProjects, useServerConfigs, useVisibleThreadShells } from "~/state/entities";
import { useUiStateStore } from "~/uiStateStore";
import { resolveThreadLastVisitedAt } from "../Sidebar.logic";
import { RelativeTimeLabel } from "../sidebar/SidebarThreadRow";
import { useAtomValue } from "@effect/atom-react";
import { AuthOrchestrationOperateScope } from "@t3tools/contracts";
import { useEnvironmentScope } from "~/state/session";
import { environmentThreadDetails, threadEnvironment } from "~/state/threads";
import { useAtomCommand } from "~/state/use-atom-command";
import { ComposerPendingApprovalActions } from "../chat/ComposerPendingApprovalActions";
import { Button } from "../ui/button";
import { SidebarInset } from "../ui/sidebar";
import { stackedThreadToast, toastManager } from "../ui/toast";
import { resolveHaloOrbState } from "./halo.logic";
import {
  buildHaloInboxBoard,
  resolveHaloInboxDrop,
  type HaloInboxCard,
  type HaloInboxColumn,
} from "./haloInbox.logic";
import { HaloOrb } from "./HaloOrb";
import { HaloPageHeader } from "./HaloPageHeader";
import { haloDepthTransition, lastHaloThread, rememberHaloThread } from "./HaloViewSwitcher";

type Card = HaloInboxCard<EnvironmentThreadShell>;

const DONE_LIMIT = 40;
const COLUMNS: readonly HaloInboxColumn[] = ["needs", "running", "done"];
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Arrow keys jump the dragged card a whole column; dnd-kit's default nudges it 25px.
const jumpColumns: KeyboardCoordinateGetter = (event, { currentCoordinates }) => {
  const step = event.code === "ArrowRight" ? 1 : event.code === "ArrowLeft" ? -1 : 0;
  if (step === 0) return undefined;
  event.preventDefault();
  const rects = [...document.querySelectorAll("[data-halo-column]")].map((node) =>
    node.getBoundingClientRect(),
  );
  const index = rects.findIndex(
    (rect) => currentCoordinates.x >= rect.left - 1 && currentCoordinates.x < rect.right,
  );
  const next = rects[Math.max(0, Math.min(rects.length - 1, Math.max(index, 0) + step))];
  return next ? { x: next.left + 8, y: currentCoordinates.y } : undefined;
};

export function HaloInboxPage() {
  const gt = useGT();
  const m = useMessages();
  const threads = useVisibleThreadShells();
  const projects = useProjects();
  const serverConfigs = useServerConfigs();
  const lastVisitedById = useUiStateStore((state) => state.threadLastVisitedAtById);
  const nowMinute = useNowMinute();
  const { settleThread, unsettleThread, unsnoozeThread } = useThreadActions();
  const [pending, setPending] = useState<{ key: string; column: HaloInboxColumn } | null>(null);
  const [dragging, setDragging] = useState<Card | null>(null);
  const [dropCount, setDropCount] = useState(0);
  const tiltRef = useRef({ velocity: 0, lastX: 0, reset: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const dropOriginRef = useRef<{ key: string; rect: DOMRect; tilt: number } | null>(null);
  const dragEndedAtRef = useRef(0);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // Enter stays the link's: it opens the thread. Space picks the card up.
    useSensor(KeyboardSensor, {
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] },
      coordinateGetter: jumpColumns,
    }),
  );

  const projectTitles = new Map(
    projects.map((project) => [`${project.environmentId}:${project.id}`, project.title]),
  );
  const board = buildHaloInboxBoard(threads, {
    now: `${nowMinute}:00.000Z`,
    doneLimit: DONE_LIMIT,
    configLoaded: (thread) => serverConfigs.has(thread.environmentId),
    lastVisitedAt: (thread) =>
      resolveThreadLastVisitedAt(
        thread.lastVisitedAt,
        lastVisitedById[scopedThreadKey(scopeThreadRef(thread.environmentId, thread.id))],
      ),
    pending,
  });
  const columnTitle: Record<HaloInboxColumn, string> = {
    needs: gt("Needs you", { $context: "agent inbox column" }),
    running: gt("Running", { $context: "agent inbox column" }),
    done: gt("Done", { $context: "agent inbox column" }),
  };

  const runDrop = async (card: Card, target: HaloInboxColumn) => {
    const drop = resolveHaloInboxDrop(card, target);
    if (drop === null) return;
    const ref = scopeThreadRef(card.thread.environmentId, card.thread.id);
    // Settling lands where it was dropped; bringing a card back moves it wherever its status says.
    if (drop === "settle") setPending({ key: card.key, column: "done" });
    const result =
      drop === "settle"
        ? await settleThread(ref)
        : drop === "unsettle"
          ? await unsettleThread(ref)
          : await unsnoozeThread(ref);
    setPending(null);
    if (result._tag === "Failure" && !isAtomCommandInterrupted(result)) {
      toastManager.add(
        stackedThreadToast({
          type: "error",
          title:
            drop === "settle"
              ? gt("Failed to settle thread")
              : drop === "unsettle"
                ? gt("Failed to un-settle thread")
                : gt("Failed to wake thread"),
          description:
            thrownErrorMessage(squashAtomCommandFailure(result), m) ?? gt("An error occurred."),
        }),
      );
    }
  };

  const takeDropOrigin = useStableCallback(() => {
    const origin = dropOriginRef.current;
    dropOriginRef.current = null;
    return origin;
  });
  const setTilt = (degrees: number) => {
    overlayRef.current?.style.setProperty("--halo-tilt", `${degrees}deg`);
  };
  const onDragMove = (event: DragMoveEvent) => {
    if (reducedMotion()) return;
    const tilt = tiltRef.current;
    tilt.velocity = 0.75 * tilt.velocity + 0.25 * (event.delta.x - tilt.lastX);
    tilt.lastX = event.delta.x;
    setTilt(Math.max(-7, Math.min(7, tilt.velocity * 0.6)));
    window.clearTimeout(tilt.reset);
    tilt.reset = window.setTimeout(() => setTilt(0), 90);
  };
  const onDragEnd = (event: Pick<DragEndEvent, "over">) => {
    const card = dragging;
    const tilt = tiltRef.current;
    window.clearTimeout(tilt.reset);
    const rect = overlayRef.current?.getBoundingClientRect();
    const tiltDegrees = Math.max(-7, Math.min(7, tilt.velocity * 0.6));
    tiltRef.current = { velocity: 0, lastX: 0, reset: 0 };
    dragEndedAtRef.current = performance.now();
    setDragging(null);
    if (card === null) return;
    if (rect) dropOriginRef.current = { key: card.key, rect, tilt: tiltDegrees };
    // Re-runs the FLIP even when the drop leaves the board as it was, so the card settles back.
    setDropCount((count) => count + 1);
    const target = event.over?.id;
    if (target === "needs" || target === "running" || target === "done") void runDrop(card, target);
  };

  return (
    <SidebarInset data-halo-page="" className="h-dvh min-h-0 overflow-hidden overscroll-y-none">
      <HaloPageHeader title={gt("Agent inbox")} threadRef={lastHaloThread()} />
      <div className="topbar-scroll-fade min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pt-2 pb-16 sm:px-6.5">
        <div className="mt-1.5 mb-5 flex flex-wrap items-end gap-3">
          <h1 className="text-3xl leading-tight font-semibold">{gt("Agent inbox")}</h1>
          <p className="flex gap-3 pb-1 text-xs text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground">
            <span>
              <b>{board.needs.length}</b>{" "}
              {gt("{count, plural, one {needs you} other {need you}}", {
                count: board.needs.length,
              })}
            </span>
            <span>
              <b>{board.running.length}</b> {gt("running", { $context: "agent inbox count" })}
            </span>
            <span>
              <b>{board.done.length + board.doneHidden}</b>{" "}
              {gt("done", { $context: "agent inbox count" })}
            </span>
          </p>
        </div>
        <DndContext
          sensors={sensors}
          onDragStart={(event) => setDragging((event.active.data.current?.card as Card) ?? null)}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          // Escape settles the card back from where it was let go, like a drop outside a column.
          onDragCancel={() => onDragEnd({ over: null })}
        >
          <HaloInboxBoard
            columns={COLUMNS.map((column) => ({
              column,
              title: columnTitle[column],
              cards: board[column],
              hidden: column === "done" ? board.doneHidden : 0,
            }))}
            projectTitles={projectTitles}
            dragging={dragging}
            takeDropOrigin={takeDropOrigin}
            dropCount={dropCount}
            dragEndedAtRef={dragEndedAtRef}
            onSettle={(card) => void runDrop(card, "done")}
          />
          <DragOverlay dropAnimation={null}>
            {dragging ? (
              <div
                ref={overlayRef}
                data-halo-card-lifted=""
                className="rotate-(--halo-tilt,0deg) scale-104 cursor-grabbing transition-[rotate] duration-300 ease-out"
              >
                <HaloInboxCardBody
                  card={dragging}
                  projectTitle={projectTitles.get(
                    `${dragging.thread.environmentId}:${dragging.thread.projectId}`,
                  )}
                  lifted
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </SidebarInset>
  );
}

function HaloInboxBoard(props: {
  columns: ReadonlyArray<{
    column: HaloInboxColumn;
    title: string;
    cards: readonly Card[];
    hidden: number;
  }>;
  projectTitles: ReadonlyMap<string, string>;
  dragging: Card | null;
  takeDropOrigin: () => { key: string; rect: DOMRect; tilt: number } | null;
  dropCount: number;
  dragEndedAtRef: RefObject<number>;
  onSettle: (card: Card) => void;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const rectsRef = useRef<Map<string, { x: number; y: number }> | null>(null);
  const layout = props.columns
    .map((entry) => `${entry.column}:${entry.cards.map((card) => card.key).join(",")}`)
    .join("|")
    .concat(`#${props.dropCount}`);

  const { takeDropOrigin } = props;
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- FLIP: measures the board's DOM after a reflow and animates cards from their previous positions
  useLayoutEffect(() => {
    const board = boardRef.current;
    if (board === null) return;
    const origin = board.getBoundingClientRect();
    const previous = rectsRef.current;
    const dropped = takeDropOrigin();
    const next = new Map<string, { x: number; y: number }>();
    const animate = previous !== null && !reducedMotion();
    for (const node of board.querySelectorAll<HTMLElement>("[data-halo-card]")) {
      const key = node.dataset.haloCard!;
      // An interrupted move restarts from where the card is drawn now, not from its old slot.
      const running = node
        .getAnimations()
        .filter(
          (animation) => !(animation instanceof CSSAnimation || animation instanceof CSSTransition),
        );
      const drawn = running.length > 0 ? node.getBoundingClientRect() : null;
      for (const animation of running) animation.cancel();
      const rect = node.getBoundingClientRect();
      const position = { x: rect.left - origin.left, y: rect.top - origin.top };
      next.set(key, position);
      if (!animate) continue;
      const first =
        dropped?.key === key
          ? { x: dropped.rect.left - origin.left, y: dropped.rect.top - origin.top }
          : drawn !== null
            ? { x: drawn.left - origin.left, y: drawn.top - origin.top }
            : previous.get(key);
      if (first === undefined) {
        node.animate(
          [
            { opacity: 0, transform: "scale(.97)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 260, easing: "cubic-bezier(.22,1,.36,1)" },
        );
        continue;
      }
      const dx = first.x - position.x;
      const dy = first.y - position.y;
      if (dropped?.key === key) {
        node.animate(
          [
            { transform: `translate(${dx}px,${dy}px) rotate(${dropped.tilt}deg) scale(1.04)` },
            { transform: "none" },
          ],
          { duration: 560, easing: "cubic-bezier(.34,1.4,.64,1)" },
        );
        continue;
      }
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      const far = Math.abs(dx) > 60;
      node.animate(
        far
          ? [
              { transform: `translate(${dx}px,${dy}px)` },
              {
                transform: `translate(${dx * 0.45}px,${dy * 0.45 - 10}px) scale(1.03) rotate(-1.2deg)`,
                offset: 0.45,
              },
              { transform: "none" },
            ]
          : [{ transform: `translate(${dx}px,${dy}px)` }, { transform: "none" }],
        {
          duration: far ? 560 : 380,
          easing: far ? "cubic-bezier(.65,0,.35,1)" : "cubic-bezier(.2,1.2,.4,1)",
        },
      );
    }
    rectsRef.current = next;
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- A layout change is what the FLIP animates, so it re-measures on each one.
  }, [layout, takeDropOrigin]);

  return (
    <div ref={boardRef} className="grid grid-cols-1 items-start gap-3 md:grid-cols-3">
      {props.columns.map((entry) => (
        <HaloInboxColumnView key={entry.column} {...entry} dragging={props.dragging}>
          {entry.cards.map((card) => (
            <HaloInboxDraggableCard
              key={card.key}
              card={card}
              projectTitle={props.projectTitles.get(
                `${card.thread.environmentId}:${card.thread.projectId}`,
              )}
              dragEndedAtRef={props.dragEndedAtRef}
              onSettle={props.onSettle}
            />
          ))}
        </HaloInboxColumnView>
      ))}
    </div>
  );
}

function HaloInboxColumnView(props: {
  column: HaloInboxColumn;
  title: string;
  cards: readonly Card[];
  hidden: number;
  dragging: Card | null;
  children: ReactNode;
}) {
  const gt = useGT();
  const accepts =
    props.dragging !== null && resolveHaloInboxDrop(props.dragging, props.column) !== null;
  const { setNodeRef, isOver } = useDroppable({
    id: props.column,
    disabled: props.column === "needs",
  });
  return (
    <section
      ref={setNodeRef}
      data-halo-column={props.column}
      aria-label={props.title}
      className={cn(
        "flex min-h-30 min-w-0 flex-col gap-2 rounded-3xl border border-border/60 bg-foreground/[0.025] p-2 transition-[background-color,box-shadow] duration-300",
        accepts && isOver && "bg-primary/14 ring-2 ring-primary/34 ring-inset",
      )}
    >
      <h2 className="flex h-7 items-center gap-1.75 px-1.5 text-xs font-semibold">
        <span
          aria-hidden
          data-halo-dot={props.column}
          ref={
            props.column === "done" || props.cards.length === 0
              ? undefined
              : observeVisibleAnimation
          }
          className={cn(
            "relative size-1.75 shrink-0 rounded-full",
            props.column === "needs"
              ? "bg-primary"
              : props.column === "running"
                ? "bg-(--primary-light,var(--primary))"
                : "bg-muted-foreground",
          )}
        />
        {props.title}
        <span className="font-mono text-2xs font-medium text-muted-foreground">
          {props.cards.length + props.hidden}
        </span>
      </h2>
      {props.cards.length === 0 ? (
        <p data-halo-empty="" className="py-4 text-center text-xs text-muted-foreground">
          {gt("Nothing here")}
        </p>
      ) : (
        props.children
      )}
      {props.hidden > 0 ? (
        <p className="py-1 text-center text-xs text-muted-foreground">
          {gt("+{count} older", { count: props.hidden })}
        </p>
      ) : null}
    </section>
  );
}

function HaloInboxDraggableCard(props: {
  card: Card;
  projectTitle: string | undefined;
  dragEndedAtRef: RefObject<number>;
  onSettle: (card: Card) => void;
}) {
  const { card } = props;
  const disabled =
    resolveHaloInboxDrop(card, "done") === null && resolveHaloInboxDrop(card, "running") === null;
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: card.key,
    data: { card },
    disabled,
  });
  return (
    <HaloInboxCardBody
      card={card}
      projectTitle={props.projectTitle}
      setNode={setNodeRef}
      placeholder={isDragging}
      onSettle={props.onSettle}
      linkProps={{
        ref: setActivatorNodeRef,
        ...(disabled ? {} : listeners),
        "aria-roledescription": attributes["aria-roledescription"],
        "aria-describedby": attributes["aria-describedby"],
        onClick: (event: MouseEvent) => {
          // A drop ends with a click on the card it started from.
          if (performance.now() - props.dragEndedAtRef.current < 350) {
            event.preventDefault();
            return;
          }
          rememberHaloThread(scopeThreadRef(card.thread.environmentId, card.thread.id));
        },
      }}
    />
  );
}

function HaloInboxCardBody({
  card,
  projectTitle,
  lifted = false,
  placeholder = false,
  setNode,
  onSettle,
  linkProps,
}: {
  card: Card;
  projectTitle: string | undefined;
  lifted?: boolean;
  placeholder?: boolean;
  setNode?: (node: HTMLElement | null) => void;
  onSettle?: (card: Card) => void;
  linkProps?: Record<string, unknown>;
}) {
  const gt = useGT();
  const m = useMessages();
  const label = card.pill
    ? m(card.pill.label)
    : card.parked === "settled"
      ? gt("Settled", { $context: "thread status" })
      : card.parked === "snoozed"
        ? gt("Snoozed", { $context: "thread status" })
        : gt("Done", { $context: "thread status" });
  const orb = card.pill ? resolveHaloOrbState(card.pill) : card.column === "done" ? "done" : "idle";
  const meta = [projectTitle, card.thread.branch].filter(Boolean).join(" · ");
  const canSettle =
    onSettle !== undefined && card.column === "done" && card.parked === null && card.settleable;
  return (
    <article
      ref={setNode}
      data-halo-card={lifted ? undefined : card.key}
      data-halo-placeholder={placeholder ? "" : undefined}
      className={cn(
        "relative flex touch-none flex-col gap-1.75 rounded-2xl border bg-card/72 px-3 py-2.75 transition-[border-color,background-color] duration-200 select-none hover:border-border hover:bg-card/80",
        card.column === "needs" ? "border-primary/34" : "border-border/60",
        lifted && "border-primary/40 shadow-xl",
        placeholder && "border-primary/34 bg-primary/14 shadow-none *:invisible",
      )}
    >
      <div className="flex items-center gap-1.5 text-xs">
        <span
          data-halo-chip={card.pill?.kind === "approval" ? "solid" : ""}
          className="inline-flex h-5 items-center gap-1 rounded-full border border-foreground/12 ps-1 pe-2 text-2xs font-medium data-[halo-chip=solid]:border-transparent data-[halo-chip=solid]:bg-primary data-[halo-chip=solid]:text-primary-foreground"
        >
          <HaloOrb state={orb} className="size-3" />
          <span className={cn(card.pill?.kind !== "approval" && card.pill?.colorClass)}>
            {label}
          </span>
        </span>
        <span className="ml-auto font-mono text-2xs font-medium whitespace-nowrap text-muted-foreground">
          <RelativeTimeLabel timestamp={card.activityAt} />
        </span>
      </div>
      <Link
        to="/$environmentId/$threadId"
        params={{ environmentId: card.thread.environmentId, threadId: card.thread.id }}
        viewTransition={haloDepthTransition()}
        draggable={false}
        className="text-sm leading-snug font-semibold outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
        {...linkProps}
      >
        {card.thread.title}
      </Link>
      {meta ? (
        <div className="truncate font-mono text-2xs text-muted-foreground">{meta}</div>
      ) : null}
      {!lifted && !placeholder && card.pill?.kind === "approval" ? (
        <HaloInboxApproval card={card} />
      ) : null}
      {!lifted && !placeholder && card.pill?.kind === "input" ? (
        <HaloInboxQuestion card={card} />
      ) : null}
      {canSettle ? (
        <div className="relative flex gap-1.25">
          <Button
            size="xs"
            variant="outline"
            render={
              <Link
                to="/$environmentId/$threadId"
                params={{ environmentId: card.thread.environmentId, threadId: card.thread.id }}
                viewTransition={haloDepthTransition()}
                draggable={false}
              />
            }
          >
            {gt("Review", { $context: "open a finished thread to review its work" })}
          </Button>
          <Button size="xs" variant="outline" onClick={() => onSettle?.(card)}>
            <CheckIcon />
            {gt("Settle", { $context: "settle a thread" })}
          </Button>
        </div>
      ) : null}
    </article>
  );
}

/** Answers a thread's oldest approval from its card, as the thread's own approval row does. */
function HaloInboxApproval({ card }: { card: Card }) {
  const gt = useGT();
  const m = useMessages();
  const threadRef = scopeThreadRef(card.thread.environmentId, card.thread.id);
  const approval = useAtomValue(environmentThreadDetails.pendingRequestsAtom(threadRef))
    ?.approvals[0];
  const canOperate = useEnvironmentScope(threadRef.environmentId, AuthOrchestrationOperateScope);
  const respond = useAtomCommand(threadEnvironment.respondToApproval, { reportFailure: false });
  const [responding, setResponding] = useState(false);
  if (approval === undefined) return null;
  return (
    <>
      {approval.detail ? (
        <pre data-halo-inbox-cmd="">
          {approval.requestKind === "command" ? `$ ${approval.detail}` : approval.detail}
        </pre>
      ) : null}
      <div
        data-halo-inbox-actions=""
        className="relative flex flex-wrap items-center gap-1.25 text-xs"
      >
        <ComposerPendingApprovalActions
          presentation="inline"
          requestId={approval.requestId}
          isResponding={responding}
          canRespond={approval.responseCapability === "live"}
          disabled={!canOperate}
          options={approval.options}
          onRespondToApproval={async (requestId, decision) => {
            setResponding(true);
            const result = await respond({
              environmentId: threadRef.environmentId,
              input: { threadId: threadRef.threadId, requestId, decision },
            });
            if (result._tag === "Failure" && !isAtomCommandInterrupted(result)) {
              toastManager.add({
                type: "error",
                title: gt("Failed to submit approval decision."),
                description: thrownErrorMessage(squashAtomCommandFailure(result), m) ?? undefined,
              });
            }
            setResponding(false);
            return result;
          }}
        />
      </div>
    </>
  );
}

/** The agent's question and a Reply that opens the thread, whose composer takes focus on entry. */
function HaloInboxQuestion({ card }: { card: Card }) {
  const gt = useGT();
  const threadRef = scopeThreadRef(card.thread.environmentId, card.thread.id);
  const question = useAtomValue(environmentThreadDetails.pendingRequestsAtom(threadRef))
    ?.userInputs[0]?.questions[0]?.question;
  return (
    <>
      {question ? <p className="text-xs leading-snug text-muted-foreground">{question}</p> : null}
      <div className="relative flex gap-1.25">
        <Button
          size="xs"
          variant="outline"
          render={
            <Link
              to="/$environmentId/$threadId"
              params={{ environmentId: card.thread.environmentId, threadId: card.thread.id }}
              viewTransition={haloDepthTransition()}
              draggable={false}
            />
          }
        >
          {gt("Reply", { $context: "open a thread to answer the agent's question" })}
        </Button>
      </div>
    </>
  );
}
