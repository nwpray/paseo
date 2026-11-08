# Teammates: persistent named agents and group chat (review notes)

Exploratory design, not an approved implementation. Open `index.html` in a browser and use the
Surface and State switchers. The URL hash keeps the selection (for example
`#surface=group&state=unavailable`), so you can link a specific state. The creation flow opens at
`#surface=create&scenario=ready`.

Files: `index.html` (page shell and switcher), `styles.css` (Paseo dark tokens copied from
`packages/app/src/styles/theme.ts` and `identity-colors.ts`), `mock.js` (renderer for the chat
surfaces, no backend), `create-flow.js` (the interactive New teammate flow, local state only),
`picture.js` (teammate picture validation, avatar markup, and the add/change/remove control).

## The model shown

- **Teammate.** A durable identity: name, role, color, provider, home workspace, instructions, and
  memory. Alex is the provisional name for the first one.
- **Chat.** Each teammate has exactly one direct chat, and it never ends. Group chats hold two or
  more teammates. A teammate belongs to a group chat; it doesn't exist because of one.
- **Agent session.** Disposable compute under a chat. The transcript marks each session boundary
  ("New session · Claude Code · Opus · 7 memories loaded"). When a teammate delegates code work, the
  work appears as an ordinary agent session in a project workspace, linked from the message.

The model has three layers. Retiring a teammate keeps its history. Removing a teammate from a group
chat doesn't retire it. Starting a fresh session keeps the chat and memory.

## Decisions

1. **Chats are a sidebar section.** The section sits between the header items and Projects. It
   doesn't add a new screen shape: the chat pane reuses the workspace pane, and About reuses the
   side pane on desktop and a pushed screen on compact (design.md §9). It should register as a
   sidebar item so the user can hide or reorder it. The glossary already anticipates a plugin item
   that renders one row per bot.
2. **One direct chat per teammate.** The teammate row is the chat row, with no separate "contacts"
   list. History stays the place for past agent sessions.
3. **Transparency is inline and quiet.** Session boundaries, delegated session cards with a status
   dot and Open, and a "Used N memories" chip on replies show what happened without adding a new
   panel.
4. **Identity is the one bold element.** A circle monogram is filled from the existing identity
   color table, the same treatment as PR participant avatars. A teammate can also have a picture,
   which replaces the monogram everywhere the avatar appears. The presence dot uses the status-dot
   family: running, warning, danger, off.
5. **About, not "profile".** The glossary forbids bare "profile" in UI copy, and "Agent profile"
   already means a launch bundle. The surface is "About Alex", with Identity, Memory, Check-ins,
   Sessions, Chats, and Danger zone sections, built from the card and row primitives.
6. **Memory is a visible, editable list.** Every memory names its source ("From chat · Oct 21" or
   "Added by you"). "Remember from chats" is a switch, and each memory has a kebab with Edit and
   Forget.
7. **Group addressing is explicit.** The composer shows who will reply ("Replying: Rowan"), and
   @mentions add teammates. Without that, every member answers every message.
8. **State is shown at the smallest scope it affects** (design.md §11):
   - Offline: one warning alert, the transcript stays readable from cache, and the composer is
     dimmed with "Reconnecting...".
   - Error: an error alert inside the failed turn, with Retry and Change provider.
   - Unavailable member: a warning in the chat, and the member's composer chip reads "waiting". The
     rest of the group keeps working.
   - Loading: the page-level spinner, with skeleton rows at their final height.
   - Empty: a sidebar empty card plus a create form, with "Create Alex" as the only primary action.

## Creating a teammate

Interactive. Nothing is created and nothing leaves the page. Every host, provider, model, skill, MCP
server, and default in the flow is a design assumption for review, not a claim that Paseo has it.

### Entry points

- **Chats +** in the sidebar opens a small menu: **New teammate**, and **New group chat** disabled as
  a later phase.
- The **Create teammate** surface button in the switcher.
- Empty state: the sidebar card's **Create teammate**, the group pane's **Create teammate**, and the
  first-run form's **Create Alex**, which opens the full flow with Alex and Executive assistant
  filled in. Entering from the empty state treats it as the first teammate, so the duplicate-name
  check doesn't apply.

### Shape

One page in the chat pane, not a wizard. On compact it is a pushed screen with a Back header. While
it's open the sidebar shows a selected draft row whose name and monogram follow what you type. On
create, the same pane turns into the new teammate's direct chat, so the place you set it up is the
place you talk to it.

1. **Identity.** Name is the only required field. Role is optional, and the suggestion chips fill
   in suggested instructions until you edit them yourself. Picture is optional (see below). The
   avatar previews the picture, or the monogram on the chosen color.
2. **Runs on** card, always visible because each choice has a consequence: Host (where chat,
   memory, and notes live; offline means read-only), Provider and Model (only the teammate's own
   replies), and Home workspace (defaults to a new workspace so notes stay out of your projects).
   Every row is prefilled. Desktop opens an inline option list; compact opens a sheet.
3. **Customize**, optional, as collapsed rows that show their current value: Instructions, Skills
   and tools (Paseo tools switch, host skills, MCP servers), Permissions (Ask first / Edits allowed
   / Full access, each with its consequence), Memory (Remember from chats, ask-before-saving vs
   save-and-show, optional starting memories), and Check-ins.
4. **Create {name}.** The button carries the typed name. Creating shows three steps (save on host,
   prepare home workspace, open chat) with status dots, then lands in the first direct chat.

### Picture

The avatar is the preview; the control sits under Role as a Picture field with **Add picture**, then
**Change picture** and **Remove** once one is set. Add and Change open the system file picker. The
hint under the buttons shows the accepted formats, then the chosen file's name and size.

- **Accepted:** PNG, JPEG, WebP, or GIF up to 5 MB. SVG is excluded because it can carry script.
  Each rule has its own inline error under the field: unsupported type, over 5 MB, or a file that
  claims to be an image but won't decode. A rejected file leaves the current picture in place.
- **Fit:** every occurrence crops the image to a circle with `object-fit: cover`, centered. There is
  no crop editor. The identity color stays underneath, so transparent images sit on the teammate's
  color, and Color stays selectable with a hint that it shows when there's no picture.
- **Fallback:** Remove returns to the initial on the color.
- **Where it shows:** the form avatar, the sidebar draft row, the created chat row, the chat header,
  the "{name} is ready" card, every reply avatar, and the About hero. For Alex it also shows in
  group chat stacks, the group transcript, and the composer addressing chips.
- **Draft lifetime:** the picture survives other edits, picker sheets, expanding rows, compact Back
  followed by **Keep editing**, a failed create with **Edit setup**, and scenario switches (like name
  and role). **Discard** and opening a new draft clear it. A draft with only a picture still asks
  **Discard {name}?** before leaving.
- **After create:** About {name} has a Picture row in an Identity card with the same Change and
  Remove buttons. About Alex has the same row, which shows configuring an existing teammate; it is
  disabled while the host is offline, matching the read-only alert.
- **Accessibility:** every action is a real button reachable by Tab, and Enter or Space opens the
  file picker. Errors are linked to the button with `aria-describedby`. After a pick, focus moves to
  Change picture; after Remove, to Add picture. A polite live region announces "Picture added",
  "Picture removed", or the error. Avatars stay `aria-hidden` because the name is always next to
  them. Compact buttons are 44 px tall.

### First chat

The first chat shows a session-boundary row, a "{name} is ready" empty state with three suggested
first messages, and a working composer. The teammate doesn't speak first. Sending gets a canned reply
that reflects the memory setting. On desktop the About side pane lists the setup you chose and any
starting memories.

Check-ins stay off by default and are labelled **Proposal** and "Undecided". Turning the switch on
reveals morning summary and finished-work reports so the shape can be judged, without deciding it.

### Interactive coverage

| Scenario (switcher)  | What to try                                                                    |
| -------------------- | ------------------------------------------------------------------------------ |
| Options loaded       | Full happy path: edit, expand, pick, create, send a first message              |
| Loading options      | Runs on rows show inline spinners at final height; Create waits                |
| Host offline         | Create shows an inline error and focuses Host; pick nick-mbp to continue       |
| Provider unavailable | Claude Code row shows not installed; pick Codex (model resets) or another host |
| No providers         | Card shows "No providers on studio-mac" with Open providers; switch host       |
| Create fails once    | First attempt fails with Retry and Edit setup; Retry succeeds                  |

Picture checks, any scenario: add an image, try a text file or an image over 5 MB, Remove, add
again, then create and open About {name} from the session row. On the About and memory surface, add
a picture for Alex and switch to Direct chat or Group chat to see it carried through.

Also wired: validation (empty, over 24 characters, duplicate name) with focus moved to the field;
Escape closes a picker, the + menu, and the discard dialog; Cancel on an untouched draft leaves
directly, and on an edited draft asks **Discard {name}?** first; desktop and compact frames share one
state, so typing in either updates both. Switching scenario resets the form but keeps name and role.

The session row's **About {name}** link opens the side pane on desktop and a pushed About screen on
compact, with Back returning to the chat.

Not wired: Open providers (shows a caption only), the More menus, and attachments.

## Open questions

- **Proactivity.** This is undecided, and the mock shows it as an "Undecided" Check-ins row. The
  options are:
  - (a) Never. Alex only replies.
  - (b) Scheduled check-ins only, such as a morning summary. These would reuse the Heartbeat or
    Schedule machinery.
  - (c) Event-driven, such as "the delegated session finished" or "CI went red".
  - My recommendation is (b) plus finished-work reports from (c). Both are opt-in, and each one
    shows a quiet origin line in the transcript so a message Alex started can't pass for a reply.
- **Naming.** "Teammate" is provisional. "Assistant" fits Alex but not Rowan, and "Agent" is
  heading toward meaning "agent session". Settle this in the glossary before any implementation.
- **Where a teammate lives.** The mock assumes one home host and one home workspace. Questions for
  lead-developer: which host owns memory when you have several, and does a teammate follow you
  across hosts?
- **Who answers in a group with no mention.** The options are a designated lead (Alex), the last
  speaker, or nobody until mentioned. The mock shows the last speaker, with the default left open.
- **Memory write policy.** Decide whether a teammate saves silently (shown afterward on the chip)
  or proposes each memory for confirmation. The hint text assumes confirmation.
- **Create surface: pane or sheet.** design.md §6 points multi-field forms at
  `AdaptiveModalSheet`. The mock uses the chat pane, like New workspace, because the form becomes
  the chat in place and the customize rows need room. Confirm this counts as an existing shape.
- **Host is fixed after create.** The note says everything but the host can change later, because
  memory and chat live on it. Moving a teammate between hosts needs a lead-developer answer.
- **Permissions vocabulary.** Paseo modes are provider-specific (plan, default, full-access). The
  three-level control assumes a mapping per provider; it also assumes sessions the teammate starts
  keep their own mode.
- **Skills and MCP scope.** The mock lists host skills and MCP servers as per-teammate opt-ins.
  Whether a provider can restrict them per session, and how that relates to the host's "Inject Paseo
  tools" setting, is open.
- **Agent profiles.** An Agent profile is a provider/model/mode bundle. "Start from agent profile"
  could prefill Runs on and Permissions; it isn't in the mock.
- **Starting memories and role chips.** Both are proposals. Starting memories may be unnecessary if
  the first chat can teach the same facts.
- **Picture storage and sync.** The mock keeps the picture as an object URL in the tab. A real
  version needs a decision on where it lives (with the teammate on its home host is the obvious
  answer), whether the client downscales before upload (for example to 512 px), and how other
  clients fetch it. The 5 MB limit and format list are proposals.
- **Group chat timing.** It's later scope. The mock includes it only to check that the direct-chat
  model extends to it without a rewrite.

## Not covered

Picture persistence (reloading the page drops every picture), cropping or repositioning, drag and
drop, camera capture on native, light theme, the edit dialogs on About (instructions, memory edit, retire confirm), the members
sheet, group chat creation, search in chat, and voice. The chat surfaces (Direct chat, About and
memory, Group chat) are static apart from their entry points into the creation flow.
