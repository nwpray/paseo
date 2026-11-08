// Paseo persistent chat — static mock renderer. No backend; every state is hard-coded.
(() => {
  // ---------- icons (lucide geometry, stroke 1.5) ----------
  const P = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    calendar:
      '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M16 15l-2 1.5V14"/>',
    server:
      '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
    settings:
      '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
    more: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
    panel: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>',
    brain:
      '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3 3 3 0 0 0 3-3V7a3 3 0 0 0-3-3ZM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3 3 3 0 0 1-3-3"/>',
    arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    square: '<rect x="7" y="7" width="10" height="10" rx="1.5"/>',
    paperclip:
      '<path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"/>',
    chevronR: '<path d="m9 6 6 6-6 6"/>',
    chevronD: '<path d="m6 9 6 6 6-6"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.8-4M4 4v4h4M4 13a8 8 0 0 0 14.8 4M20 20v-4h-4"/>',
    wifiOff:
      '<path d="M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 4.2-2.6M19 12.9a10 10 0 0 0-2-1.5M2 8.8a15 15 0 0 1 4.2-2.7M22 8.8A15 15 0 0 0 11 5M12 20h.01"/>',
    alert:
      '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
    users:
      '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
    code: '<path d="m8 8-5 4 5 4M16 8l5 4-5 4"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
  };
  const ic = (n, cls = "") =>
    `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;

  // ---------- data ----------
  const T = {
    alex: {
      name: "Alex",
      initial: "A",
      color: "sky",
      role: "Executive assistant",
      runs: "Claude Code · Opus",
    },
    rowan: {
      name: "Rowan",
      initial: "R",
      color: "orange",
      role: "Code reviewer",
      runs: "Codex · GPT-5.5",
    },
    juno: {
      name: "Juno",
      initial: "J",
      color: "violet",
      role: "Researcher",
      runs: "Claude Code · Sonnet",
    },
  };
  // Existing teammates can carry a picture set from About (Alex in this mock). It lives in tab
  // memory only and shows everywhere Alex's avatar does.
  const PIC = window.PaseoPicture;
  const pic = { alex: { photo: null, error: "" } };
  const av = (t, size = "", pres = "") =>
    PIC.avatar({
      photo: pic[t]?.photo,
      color: T[t].color,
      initial: T[t].initial,
      size,
      pres,
    });
  const btn = (label, variant = "secondary", size = "", icon = "") =>
    `<button class="btn ${variant} ${size}" type="button">${icon ? ic(icon) : ""}${label}</button>`;
  const iconBtn = (name, label, extra = "") =>
    `<button class="icon-btn ${extra}" type="button" aria-label="${label}" title="${label}">${ic(name)}</button>`;

  const CAPTIONS = {
    ready:
      "Ready. A durable chat spanning several days and two underlying agent sessions. Alex has delegated work into a project workspace.",
    empty:
      "Empty. First run: no teammates exist. Creating Alex is the one primary action. Group chat needs at least two teammates.",
    loading:
      "Loading. The host is connected and the chat history is loading. Rows reserve their final height so nothing jumps.",
    working:
      "Working. A teammate streams a reply while a delegated agent session runs. Stop interrupts the reply only, not the delegated session.",
    offline:
      "Offline. The host that owns Alex's chat and memory is disconnected. History stays readable from cache; sending waits.",
    error:
      "Error. The provider failed mid-turn. The chat and memory are intact; the failed turn offers Retry and Change provider.",
    unavailable:
      "Unavailable member. A teammate exists but can't run (provider missing on its host). The conversation stays; that teammate's replies wait.",
  };

  // ---------- sidebar ----------
  // Chats "+" opens a small menu: a teammate now, a group chat later.
  function plusMenu(open) {
    const trigger = `<button class="icon-btn sm" type="button" data-menu-toggle aria-label="New chat" title="New chat" aria-haspopup="menu" aria-expanded="${open}">${ic("plus")}</button>`;
    if (!open) return `<span class="menu-anchor">${trigger}</span>`;
    return `<span class="menu-anchor">${trigger}<span class="menu" role="menu" aria-label="New chat">
      <button type="button" role="menuitem" data-open-create="menu" data-k="menu-teammate">${ic("plus")}<span class="lines"><span>New teammate</span><span class="hint">A named agent with memory and its own chat</span></span></button>
      <button type="button" role="menuitem" aria-disabled="true">${ic("users")}<span class="lines"><span>New group chat</span><span class="hint">Later phase</span></span></button>
    </span></span>`;
  }
  // Draft row while the New teammate form is open; the real row once it's created.
  function newRow({ draft, created } = {}) {
    if (draft)
      return `<div class="chat-row selected" role="listitem" aria-current="page">
        ${PIC.avatar({ photo: draft.photo, color: draft.color, initial: draft.initial, cls: "draft", bind: "draft-av" })}
        <div class="lines"><span class="title" data-bind="draft-row">${draft.name || "New teammate"}</span><span class="sub">Draft</span></div></div>`;
    if (created)
      return `<div class="chat-row selected" role="listitem" aria-current="page">
        ${PIC.avatar({ photo: created.photo, color: created.color, initial: created.initial })}
        <div class="lines"><span class="title">${created.name}</span><span class="sub">${created.role}</span></div>
        <span class="trail">now</span></div>`;
    return "";
  }

  // Static review fixture combines the selectable visual states in one template.
  // eslint-disable-next-line complexity
  function sidebar(st, surface, compact = false, opts = {}) {
    const alexOut = st === "unavailable" && surface !== "group";
    const junoOut = st === "unavailable" && surface === "group";
    const nav = `
      <div class="nav-group" role="list">
        <div class="nav-row" role="listitem">${ic("plus")}New workspace${compact ? "" : '<span class="kbd">⌘N</span>'}</div>
        <div class="nav-row" role="listitem">${ic("history")}History</div>
        <div class="nav-row" role="listitem">${ic("search")}Search<span class="kbd">${compact ? "" : "⌘K"}</span></div>
        <div class="nav-row" role="listitem">${ic("calendar")}Schedules</div>
      </div>`;

    let chats;
    if (st === "empty") {
      chats = `
        <div class="sb-section-head"><span>Chats</span></div>
        <div class="sb-empty">
          <div class="t">No teammates yet</div>
          <div class="d">A teammate keeps its name, memory, and chat across sessions</div>
          <div class="actions"><button class="btn secondary xs" type="button" data-open-create="fresh">Create teammate</button></div>
        </div>`;
    } else if (st === "loading") {
      chats = `
        <div class="sb-section-head"><span>Chats</span><span class="spinner sm" role="status" aria-label="Loading chats"></span></div>
        ${[70, 52].map((w) => `<div class="skel-row"><span class="avatar"></span><span class="skel" style="width:${w}%"></span></div>`).join("")}`;
    } else {
      const alexPres = {
        working: "running",
        offline: "off",
        error: "danger",
        ready: "",
        unavailable: alexOut ? "warn" : "",
      }[st];
      const alexSub = {
        ready: "The relay PR is ready. CI passed on all...",
        working: "Responding...",
        offline: "studio-mac is offline",
        error: "Couldn't respond",
        unavailable: alexOut ? "Unavailable" : "Leave them for me. What's on my...",
      }[st];
      const groupSub = junoOut
        ? "Juno is unavailable"
        : ({ working: "Rowan is working", offline: "studio-mac is offline" }[st] ??
          "Juno: Two changes landed this week...");
      const groupPres = junoOut ? "warn" : "";
      const sel = (s) =>
        surface === s || (s === "direct" && surface === "memory") ? "selected" : "";
      const menuOpen = opts.menuOpen || (!compact && state.menu);
      chats = `
        <div class="sb-section-head"><span>Chats</span>${plusMenu(menuOpen)}</div>
        <div class="nav-group" role="list" aria-label="Chats">
          ${newRow(opts)}
          ${
            opts.fresh
              ? ""
              : `<div class="chat-row ${compact ? "" : sel("direct")} ${st === "offline" || alexOut ? "dim" : ""}" role="listitem" tabindex="0">
            ${av("alex", "", alexPres)}
            <div class="lines"><span class="title">Alex</span><span class="sub">${alexSub}</span></div>
            <span class="trail">${st === "ready" ? '<span class="dot success" title="Unread"></span>' : "8:14"}</span>
          </div>
          <div class="chat-row ${compact ? "" : sel("group")} ${st === "offline" ? "dim" : ""}" role="listitem" tabindex="0">
            <span class="stack">${av("rowan", "sm")}${av("juno", "sm")}</span>
            <div class="lines"><span class="title">Release crew</span><span class="sub">${groupSub}</span></div>
            <span class="trail">${groupPres ? '<span class="dot warn" title="A member is unavailable"></span>' : "Yesterday"}</span>
          </div>
          <div class="chat-row ${st === "offline" ? "dim" : ""}" role="listitem" tabindex="0">
            ${av("rowan")}
            <div class="lines"><span class="title">Rowan</span><span class="sub">Code reviewer</span></div>
          </div>
          <div class="chat-row ${junoOut || st === "offline" ? "dim" : ""}" role="listitem" tabindex="0">
            ${av("juno", "", junoOut ? "warn" : "")}
            <div class="lines"><span class="title">Juno</span><span class="sub">${junoOut ? "Unavailable" : "Researcher"}</span></div>
          </div>`
          }
        </div>`;
    }

    const projects = `
      <div>
        <div class="sb-section-head"><span>Projects</span></div>
        <div class="ws-project"><span class="pi c-emerald">P</span>paseo</div>
        <div class="ws-row"><span class="title">main</span></div>
        <div class="ws-row"><span class="title">fix-relay-reconnect</span>${st === "working" || st === "ready" ? `<span class="dot ${st === "working" ? "running" : "success"}"></span>` : ""}</div>
        <div class="ws-project"><span class="pi c-orange">C</span>catfin</div>
        <div class="ws-row"><span class="title">ledger-export</span></div>
        <div class="ws-project"><span class="pi c-violet">E</span>executive-assistant</div>
      </div>`;

    return `
      <aside class="sidebar" aria-label="Sidebar">
        ${compact ? "" : '<div class="sb-traffic"><i></i><i></i><i></i></div>'}
        <div class="sb-scroll">
          ${nav}
          <div>${chats}</div>
          ${projects}
        </div>
        <div class="sb-footer">
          <div class="nav-row">${ic("folder")}Add project</div>
          <div class="sb-icons">${iconBtn("server", "Hosts")}${iconBtn("help", "Help and support")}${iconBtn("settings", "Settings")}</div>
        </div>
      </aside>`;
  }

  // ---------- transcript pieces ----------
  const userMsg = (html) => `<div class="msg user"><div class="bubble">${html}</div></div>`;
  function agentMsg(t, html, { time = "", foot = "", extra = "", streaming = false } = {}) {
    return `
      <article class="msg agent">
        <div class="who">${av(t)}<span class="name">${T[t].name}</span>${time ? `<span class="time">${time}</span>` : ""}</div>
        ${streaming ? `<div class="responding"><span class="pulse3" aria-hidden="true"><i></i><i></i><i></i></span>Responding</div>` : ""}
        <div class="content">${html}</div>
        ${extra}
        ${foot ? `<div class="foot">${foot}</div>` : ""}
      </article>`;
  }
  const sessionCard = (title, sub, dot) =>
    `<div class="sessioncard"><span class="dot ${dot}"></span><div class="lines"><span class="t">${title}</span><span class="s">${sub}</span></div>${btn("Open", "ghost", "xs")}</div>`;
  const sessionBreak = (text, link = "View session") =>
    `<div class="session-break" role="note">${ic("layers")}<span>${text}</span><span class="link">${link}</span></div>`;
  const foot = (mem) =>
    `${iconBtn("copy", "Copy message")}${mem ? `<button class="memchip" type="button">${ic("brain")}Used ${mem} ${mem === 1 ? "memory" : "memories"}</button>` : ""}`;

  function directTranscript(st) {
    const older = `
      <div class="day">Yesterday</div>
      ${userMsg("Keep an eye on the relay fix and tell me when the PR is ready for review")}
      ${agentMsg(
        "alex",
        "<p>Will do. I started an agent session in <code>fix-relay-reconnect</code> to finish the reconnect test. I'll report back here when it's done.</p>",
        {
          time: "4:12 PM",
          extra: sessionCard(
            "Finish relay reconnect test",
            "paseo · fix-relay-reconnect · Codex · Done in 41m",
            "success",
          ),
          foot: foot(0),
        },
      )}
      ${sessionBreak("New session · Claude Code · Opus · 7 memories loaded", "Earlier session")}
      <div class="day">Today</div>
      ${agentMsg("alex", "<p>The relay PR is ready. CI passed on all three platforms. Rowan left two comments about the backoff constant. Want me to answer them, or leave them for you?</p>", { time: "8:02 AM", foot: foot(1) })}
      ${userMsg("Leave them for me. What's on my plate today?")}`;

    const answer =
      "<p>Three things, in the order I'd take them:</p><ol><li>Review relay PR #812. Two comments are open, and you like reviews done before 11.</li><li>Catfin ledger export is blocked on your call about the CSV columns.</li><li>4 PM design review. The persistent chat mock is in <code>designs/persistent-chat</code>.</li></ol>";

    if (st === "loading")
      return `<div class="center"><div class="spinner" role="status" aria-label="Loading chat"></div></div>`;
    if (st === "empty") return "";
    if (st === "working") {
      return (
        older +
        agentMsg(
          "alex",
          '<p>Three things, in the order I\'d take them:</p><ol><li>Review relay PR #812. Two comments are open, and you like reviews done before 11.</li><li>Catfin ledger export is blocked on your call about<span class="caret"></span></li></ol>',
          {
            time: "8:14 AM",
            streaming: true,
            extra: sessionCard(
              "Draft CSV column options for ledger export",
              "catfin · ledger-export · Claude Code · Working 3m",
              "running",
            ),
          },
        )
      );
    }
    if (st === "error") {
      return (
        older +
        `
        <article class="msg agent">
          <div class="who">${av("alex")}<span class="name">Alex</span><span class="time">8:14 AM</span></div>
          <div class="content">
            <div class="alert error" role="alert">${ic("alert")}<div>
              <div class="t">Alex couldn't respond</div>
              <div class="d">Claude Code exited with an authentication error. Your message and Alex's memory are saved.</div>
              <div class="acts">${btn("Retry", "outline", "xs", "refresh")}${btn("Change provider", "outline", "xs")}</div>
            </div></div>
          </div>
        </article>`
      );
    }
    if (st === "offline") {
      return (
        older +
        agentMsg("alex", answer, { time: "8:14 AM", foot: foot(2) }) +
        `<div class="alert warning" role="status">${ic("wifiOff")}<div>
          <div class="t">studio-mac is offline</div>
          <div class="d">Alex's chat and memory live on this host. You're reading a cached copy. Messages wait until the host reconnects.</div>
          <div class="acts">${btn("Switch host", "outline", "xs")}</div>
        </div></div>`
      );
    }
    if (st === "unavailable") {
      return (
        older +
        `<div class="alert warning" role="status">${ic("alert")}<div>
          <div class="t">Alex can't reply right now</div>
          <div class="d">Claude Code isn't installed on studio-mac. The chat and memory are kept. Change Alex's provider or install Claude Code to continue.</div>
          <div class="acts">${btn("Change provider", "outline", "xs")}${btn("Open providers", "outline", "xs")}</div>
        </div></div>`
      );
    }
    return older + agentMsg("alex", answer, { time: "8:14 AM", foot: foot(2) });
  }

  function groupTranscript(st) {
    if (st === "loading")
      return `<div class="center"><div class="spinner" role="status" aria-label="Loading chat"></div></div>`;
    if (st === "empty") return "";
    const base = `
      <div class="day">Yesterday</div>
      ${userMsg('<span class="mention">@Rowan</span> can you review #812 again after my fix? <span class="mention">@Juno</span> what changed in the Codex app-server protocol this week?')}
      ${agentMsg(
        "rowan",
        "<p>Reviewing now. I'll post findings on the PR and summarize here.</p>",
        {
          time: "5:40 PM",
          extra: sessionCard(
            "Review PR #812",
            "paseo · fix-relay-reconnect · Codex · Done in 12m",
            "success",
          ),
        },
      )}`;
    const juno = agentMsg(
      "juno",
      "<p>Two changes landed this week. <code>thread/list</code> gained a cursor, and turn events now carry a stable item id. Neither breaks our adapter, but the cursor lets us drop the full refetch.</p>",
      { time: "5:52 PM", foot: foot(0) },
    );
    const alex = agentMsg(
      "alex",
      "<p>I'll fold both into tomorrow's summary and add the cursor change to the Paseo backlog notes.</p>",
      { time: "5:55 PM", foot: foot(1) },
    );

    if (st === "unavailable") {
      return (
        base +
        `
        <div class="waiting">${av("juno", "sm")}<span>Waiting for Juno · Claude Code isn't installed on studio-mac</span></div>
        <div class="alert warning" role="status">${ic("alert")}<div>
          <div class="t">Juno is unavailable</div>
          <div class="d">Juno stays a member of Release crew. Messages addressed to Juno wait until its provider is back. Rowan and Alex reply as usual.</div>
          <div class="acts">${btn("Change Juno's provider", "outline", "xs")}${btn("Remove from chat", "outline", "xs")}</div>
        </div></div>`
      );
    }
    if (st === "working") {
      return (
        base +
        juno +
        agentMsg(
          "rowan",
          '<p>One more thing on #812. The retry loop resets its backoff after a successful<span class="caret"></span></p>',
          { time: "8:20 AM", streaming: true },
        )
      );
    }
    if (st === "error") {
      return (
        base +
        juno +
        `<article class="msg agent"><div class="who">${av("rowan")}<span class="name">Rowan</span><span class="time">8:20 AM</span></div>
        <div class="content"><div class="alert error" role="alert">${ic("alert")}<div><div class="t">Rowan couldn't respond</div><div class="d">Codex hit its usage limit. Resets at 1 PM. Other members can still reply.</div><div class="acts">${btn("Retry", "outline", "xs", "refresh")}</div></div></div></div></article>`
      );
    }
    if (st === "offline") {
      return (
        base +
        juno +
        alex +
        `<div class="alert warning" role="status">${ic("wifiOff")}<div><div class="t">studio-mac is offline</div><div class="d">Release crew lives on this host. You're reading a cached copy. Messages wait until the host reconnects.</div></div></div>`
      );
    }
    return base + juno + alex;
  }

  // ---------- composer ----------
  function composer(st, kind) {
    const target = kind === "group" ? "Release crew" : "Alex";
    const disabled =
      st === "offline" || (st === "unavailable" && kind === "direct") || st === "loading";
    const working = st === "working";
    const addressing =
      kind === "group" && st !== "empty"
        ? `<div class="addressing">Replying ${
            st === "unavailable"
              ? `<span class="addr-chip">${av("rowan", "sm")}Rowan</span><span class="addr-chip warn">${av("juno", "sm")}Juno · waiting</span>`
              : `<span class="addr-chip">${av("rowan", "sm")}Rowan</span>`
          }<span>· mention to add teammates</span></div>`
        : "";
    const runs = kind === "group" ? `${ic("users")}3 teammates` : `${ic("code")}Claude Code · Opus`;
    return `
      <div class="composer-wrap">
        <div class="composer ${disabled ? "disabled" : ""}" role="group" aria-label="Composer">
          ${addressing}
          <div class="input">${st === "offline" ? "Reconnecting..." : `Message ${target}`}</div>
          <div class="bar">
            <span class="pill">${ic("paperclip")}</span>
            <span class="pill">${runs}${ic("chevronD")}</span>
            <button class="send ${working ? "stop" : ""}" type="button" aria-label="${working ? "Stop" : "Send"}" ${disabled ? "disabled" : ""}>${ic(working ? "square" : "arrowUp")}</button>
          </div>
        </div>
      </div>`;
  }

  // ---------- empty / create ----------
  function createTeammate() {
    return `
      <div class="transcript-inner"><div class="create">
        <h3>Create your first teammate</h3>
        <p>A teammate keeps one name, one chat, and its own memory. It starts agent sessions in your projects when work needs doing, and reports back here.</p>
        <div class="field"><label>Name</label><div class="input-box">Alex</div></div>
        <div class="field"><label>Role</label><div class="input-box">Executive assistant</div></div>
        <div class="field"><label>Color</label><div class="swatches">
          <span class="c-sky on"></span><span class="c-orange"></span><span class="c-violet"></span><span class="c-emerald"></span></div></div>
        <div class="field"><label>Provider</label><div class="input-box">Claude Code · Opus${ic("chevronD", "chev")}</div></div>
        <div class="field"><label>Home workspace</label><div class="input-box">executive-assistant · main${ic("chevronD", "chev")}</div></div>
        <div><button class="btn default md" type="button" data-open-create="fresh-alex">Create Alex</button></div>
        <p class="cf-note">Opens the full setup with these values filled in</p>
      </div></div>`;
  }
  function groupEmpty() {
    return `<div class="center"><div style="text-align:center;display:flex;flex-direction:column;gap:12px;align-items:center">
      <span>No group chats yet</span>
      <span style="font-size:12px;max-width:300px;line-height:1.5">Group chats need at least two teammates</span>
      <button class="btn ghost" type="button" data-open-create="fresh">Create teammate</button></div></div>`;
  }

  // ---------- chat pane ----------
  function chatHeader(kind, st, compact, sideOpen) {
    const lead = compact ? iconBtn("back", "Back") : "";
    if (kind === "group") {
      const n =
        st === "empty"
          ? ""
          : `<span class="stack">${av("alex", "sm")}${av("rowan", "sm")}${av("juno", "sm", st === "unavailable" ? "warn" : "")}</span>`;
      return `<div class="header">${lead}${n}<div class="titles"><span class="screen-title">${st === "empty" ? "Group chat" : "Release crew"}</span>${st === "empty" || compact ? "" : '<span class="meta">Alex, Rowan, Juno</span>'}</div>
        <div class="tools">${compact ? "" : iconBtn("search", "Search in chat")}${iconBtn("users", "Members")}${iconBtn("more", "More")}</div></div>`;
    }
    const pres =
      { working: "running", offline: "off", error: "danger", unavailable: "warn" }[st] || "";
    const meta =
      st === "empty"
        ? ""
        : {
            working: "Responding",
            offline: "Offline",
            error: "Couldn't respond",
            unavailable: "Unavailable",
          }[st] || T.alex.role;
    return `<div class="header">${lead}${st === "empty" ? "" : av("alex", "", pres)}
      <div class="titles"><span class="screen-title">${st === "empty" ? "New teammate" : "Alex"}</span>${meta ? `<span class="meta">${meta}</span>` : ""}</div>
      <div class="tools">${compact ? "" : iconBtn("search", "Search in chat")}${st === "empty" ? "" : `<button class="icon-btn" type="button" aria-label="About Alex" title="About Alex" aria-pressed="${sideOpen}">${ic("panel")}</button>`}${iconBtn("more", "More")}</div></div>`;
  }

  function chatPane(kind, st, compact, sideOpen) {
    let body;
    if (st === "empty") body = kind === "group" ? groupEmpty() : createTeammate();
    else {
      const tx = kind === "group" ? groupTranscript(st) : directTranscript(st);
      body =
        st === "loading" ? tx : `<div class="transcript-inner"><div class="col">${tx}</div></div>`;
    }
    return `
      <section class="pane" aria-label="${kind === "group" ? "Release crew" : "Alex"} chat">
        ${chatHeader(kind, st, compact, sideOpen)}
        <div class="body"><div class="transcript">${body}${st === "empty" ? "" : composer(st, kind)}</div></div>
      </section>`;
  }

  // ---------- About Alex (side pane / compact screen) ----------
  function alexPictureRow(compact, readOnly) {
    const c = PIC.control({
      id: compact ? "m-alex" : "d-alex",
      owner: "alex",
      photo: pic.alex.photo,
      error: pic.alex.error,
      disabled: readOnly,
      subject: "Alex",
    });
    return `<div class="row top pic-row" data-pic-scope>${c.input}
      <div class="lines"><span>Picture</span>${c.hint}${c.err}</div>
      <span class="val">${c.buttons}</span></div>`;
  }
  function about(st, compact, surface = "direct") {
    if (st === "unavailable" && surface === "group") st = "ready";
    const head = `<div class="header">${compact ? iconBtn("back", "Back") : ""}<div class="titles"><span class="screen-title">About Alex</span></div><div class="tools">${compact ? "" : iconBtn("panel", "Close side pane")}</div></div>`;
    if (st === "empty") {
      return `<aside class="${compact ? "pane" : "sidepane"}" aria-label="About teammate">${head}<div class="sp-scroll"><div class="section"><div class="section-head">Memory</div><div class="card"><div class="mem-empty">Nothing remembered yet. Alex saves what you ask it to keep, and you can add memories here.</div></div></div></div></aside>`;
    }
    if (st === "loading") {
      return `<aside class="${compact ? "pane" : "sidepane"}" aria-label="About Alex">${head}<div class="sp-scroll">
        <div class="hero">${av("alex", "xl")}<div><div class="n">Alex</div><div class="r">Executive assistant</div></div></div>
        <div class="section"><div class="section-head">Memory</div><div class="card"><div class="row"><span class="spinner sm"></span><span class="hint">Loading memory...</span></div></div></div></div></aside>`;
    }
    const pres =
      { working: "running", offline: "off", error: "danger", unavailable: "warn" }[st] || "";
    const memories = [
      ["Prefers PR reviews before 11 AM", "From chat · Oct 21"],
      ["Catfin product code lives in catfin-founder-landing", "Added by you · Oct 7"],
      ["“This goes to next” means target the next branch", "From chat · Oct 14"],
      ["Never restart the daemon on port 6767 without asking", "Added by you · Sep 30"],
      ["Release crew: Rowan reviews code, Juno researches", "From chat · Oct 26"],
    ];
    const ro = st === "offline";
    const providerRow =
      st === "unavailable"
        ? `<div class="row"><div class="lines"><span>Provider</span><span class="err">Claude Code isn't installed on studio-mac</span></div><span class="val">${btn("Change", "outline", "xs")}</span></div>`
        : `<div class="row"><div class="lines"><span>Provider</span></div><span class="val">Claude Code · Opus${ic("chevronD")}</span></div>`;
    return `
      <aside class="${compact ? "pane" : "sidepane"}" aria-label="About Alex">
        ${head}
        <div class="sp-scroll">
          <div class="hero">${av("alex", "xl", pres)}<div><div class="n">Alex</div><div class="r">Executive assistant · since Oct 2</div></div></div>
          ${ro ? `<div class="alert warning" role="status">${ic("wifiOff")}<div><div class="t">Read only while offline</div><div class="d">Edits need studio-mac to be connected.</div></div></div>` : ""}

          <div class="section">
            <div class="section-head">Identity</div>
            <div class="card">
              ${alexPictureRow(compact, ro)}
              <div class="row"><div class="lines"><span>Name</span></div><span class="val">Alex</span></div>
              <div class="row"><div class="lines"><span>Role</span></div><span class="val">Executive assistant</span></div>
              ${providerRow}
              <div class="row"><div class="lines"><span>Home workspace</span><span class="hint">Where Alex keeps its notes and files</span></div><span class="val">executive-assistant${ic("chevronR")}</span></div>
              <div class="row top"><div class="lines"><span>Instructions</span><span class="hint prose">You're Nick's executive assistant. Track open work across projects, start agent sessions for anything that needs code, and report back here. Ask before anything destructive.</span></div>${iconBtn("more", "Edit instructions", "sm kebab")}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-head">Memory<span class="right">${btn("Add memory", "ghost", "xs", "plus")}</span></div>
            <div class="card">
              <div class="row"><div class="lines"><span>Remember from chats</span><span class="hint">Alex saves facts you confirm in chat</span></div><button class="switch" role="switch" aria-checked="true" aria-label="Remember from chats" ${ro ? "disabled" : ""}></button></div>
              ${memories.map(([t, s]) => `<div class="row"><div class="lines"><span>${t}</span><span class="hint">${s}</span></div>${iconBtn("more", "Memory actions", "sm kebab")}</div>`).join("")}
            </div>
          </div>

          <div class="section">
            <div class="section-head">Check-ins ${ic("info")}</div>
            <div class="card">
              <div class="row"><div class="lines"><span>Message me first</span><span class="hint">Whether Alex may start a conversation, such as a morning summary or a finished-work report</span></div><span class="badge warn">Undecided</span></div>
            </div>
          </div>

          <div class="section">
            <div class="section-head">Sessions</div>
            <div class="card">
              <div class="row"><div class="lines"><span>Current session</span><span class="hint">Started today 8:02 AM · 38% of context used</span></div><span class="val">${{ working: '<span class="dot running"></span>Working', error: '<span class="dot danger"></span>Error' }[st] ?? "Idle"}</span></div>
              <div class="row"><div class="lines"><span>Earlier sessions</span><span class="hint">14 sessions since Oct 2. The chat continues across them.</span></div><span class="val">History${ic("chevronR")}</span></div>
              <div class="row"><div class="lines"><span>Start a fresh session</span><span class="hint">Keeps the chat and memory, drops the working context</span></div>${btn("Start", "outline", "xs")}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-head">Chats</div>
            <div class="card">
              <div class="row"><span class="stack">${av("rowan", "sm")}${av("juno", "sm")}</span><div class="lines"><span>Release crew</span></div>${ic("chevronR")}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-head">Danger zone</div>
            <div class="card">
              <div class="row"><div class="lines"><span>Retire Alex</span><span class="hint">Removes Alex from chats. The chat history stays in History.</span></div>${btn("Retire", "outline", "xs")}</div>
            </div>
          </div>
        </div>
      </aside>`;
  }

  // ---------- assemble ----------
  function desktop(surface, st) {
    if (surface === "create") return flow.renderDesktop();
    const kind = surface === "group" ? "group" : "direct";
    const sideOpen = surface === "memory";
    return `<div class="desktop" aria-label="Desktop mock">${sidebar(st, surface)}${chatPane(kind, st, false, sideOpen)}${sideOpen ? about(st, false) : ""}</div>`;
  }
  const phone = (cap, inner) =>
    `<div class="phone-wrap"><p class="phone-cap">${cap}</p><div class="phone"><div class="statusbar"><span>9:41</span><span>●●●</span></div>${inner}</div></div>`;
  function mobile(surface, st) {
    if (surface === "create") return flow.renderMobile();
    const kind = surface === "group" ? "group" : "direct";
    return [
      phone("Sidebar overlay", sidebar(st, surface, true)),
      phone(kind === "group" ? "Group chat" : "Direct chat", chatPane(kind, st, true, false)),
      phone("About Alex (pushed)", about(st, true, surface)),
    ].join("");
  }

  // ---------- switcher ----------
  const flow = window.PaseoCreateFlow;
  const state = { surface: "direct", st: "ready", menu: false };
  function readHash() {
    const m = new URLSearchParams(location.hash.slice(1));
    if (m.get("surface")) state.surface = m.get("surface");
    if (m.get("state")) state.st = m.get("state");
    if (m.get("scenario")) flow.setScenario(m.get("scenario"));
  }
  function render() {
    const creating = state.surface === "create";
    document.getElementById("state-group").hidden = creating;
    document.getElementById("scenario-group").hidden = !creating;
    document
      .querySelectorAll("[data-scenario]")
      .forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.scenario === flow.scenario)));
    document
      .querySelectorAll("[data-surface]")
      .forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.surface === state.surface)));
    if (creating) return renderCreate();
    renderChat();
  }
  function renderCreate() {
    document.getElementById("desktop").innerHTML = flow.renderDesktop();
    document.getElementById("mobile").innerHTML = flow.renderMobile();
    document.getElementById("caption").textContent = flow.caption();
    document.getElementById("future").hidden = true;
    history.replaceState(null, "", `#surface=create&scenario=${flow.scenario}`);
  }
  function renderChat() {
    document.getElementById("desktop").innerHTML = desktop(state.surface, state.st);
    document.getElementById("mobile").innerHTML = mobile(state.surface, state.st);
    document.querySelectorAll(".transcript-inner").forEach((el) => {
      el.scrollTop = el.scrollHeight;
    });
    document.getElementById("caption").textContent = CAPTIONS[state.st];
    document
      .querySelectorAll("[data-state]")
      .forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.state === state.st)));
    document.getElementById("future").hidden = state.surface !== "group";
    history.replaceState(null, "", `#surface=${state.surface}&state=${state.st}`);
  }
  function openCreate(kind) {
    const from = state.surface === "create" ? "direct" : state.surface;
    const fresh = kind.startsWith("fresh") || state.st === "empty";
    const preset = kind === "fresh-alex" ? { name: "Alex", role: "Executive assistant" } : {};
    flow.open({ fresh, from, ...preset });
    state.menu = false;
    state.surface = "create";
    render();
    document.querySelector('.cf-root[data-frame="d"] [data-k="name"]')?.focus();
  }
  function onSwitcherClick(e) {
    const oc = e.target.closest("[data-open-create]");
    if (oc) return openCreate(oc.dataset.openCreate);
    if (e.target.closest("[data-menu-toggle]")) {
      state.menu = !state.menu;
      render();
      if (state.menu) document.querySelector('[data-k="menu-teammate"]')?.focus();
      return;
    }
    const b = e.target.closest("[data-surface],[data-state],[data-scenario]");
    if (!b) return;
    state.menu = false;
    if (b.dataset.surface === "create")
      flow.open({ from: state.surface === "create" ? "direct" : state.surface });
    if (b.dataset.surface) state.surface = b.dataset.surface;
    if (b.dataset.state) state.st = b.dataset.state;
    if (b.dataset.scenario) flow.setScenario(b.dataset.scenario);
    render();
  }
  document.addEventListener("click", onSwitcherClick);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !state.menu) return;
    state.menu = false;
    render();
    document.querySelector("[data-menu-toggle]")?.focus();
  });
  flow.init({
    ic,
    iconBtn,
    sessionBreak,
    sidebar,
    phone,
    rerender: render,
    leave(surface) {
      state.surface = surface || "direct";
      render();
    },
  });
  PIC.register("alex", {
    picked({ photo, error }, frame) {
      if (error) {
        pic.alex.error = error;
        render();
        PIC.announce(error);
        return PIC.refocus(frame, ["alex-pic-change", "alex-pic-add"]);
      }
      PIC.release(pic.alex.photo);
      pic.alex.photo = photo;
      pic.alex.error = "";
      render();
      PIC.announce(`Picture changed for Alex: ${photo.name}`);
      PIC.refocus(frame, ["alex-pic-change"]);
    },
    remove(frame) {
      PIC.release(pic.alex.photo);
      pic.alex.photo = null;
      pic.alex.error = "";
      render();
      PIC.announce("Picture removed. Alex shows the initial A");
      PIC.refocus(frame, ["alex-pic-add"]);
    },
  });
  readHash();
  render();
})();
