// Paseo persistent chat — interactive "New teammate" flow. Local mock only: no backend,
// nothing is created. Every host, provider, skill, MCP server, and default below is a
// design assumption for review, not a claim about what Paseo ships today.
(() => {
  // ---------- fixtures (assumptions) ----------
  const EXISTING = ["Alex", "Rowan", "Juno"];
  const COLORS = ["sky", "orange", "violet", "emerald", "pink", "indigo", "teal", "amber"];
  const ROLES = {
    "Executive assistant":
      "You're Nick's executive assistant. Track open work across projects, start agent sessions for anything that needs code, and report back here. Ask before anything destructive.",
    "Code reviewer":
      "Review pull requests in Nick's projects. Lead with correctness problems, then risky changes. Keep findings short and link the exact lines.",
    Researcher:
      "Research questions Nick sends you. Compare sources, say how confident you are, and keep a running notes file in your home workspace.",
  };
  const PROVIDERS = {
    claude: { label: "Claude Code", models: ["Opus", "Sonnet", "Haiku"] },
    codex: { label: "Codex", models: ["GPT-5.5", "GPT-5.5 mini"] },
    opencode: { label: "OpenCode", models: ["Default"] },
  };
  const SKILLS = [
    ["paseo", "Paseo", "Manage agents, workspaces, and schedules"],
    ["transcript", "Transcript", "Save YouTube transcripts as notes"],
    ["meal-plan", "Meal plan", "Build the family meal plan"],
  ];
  const MCP = [
    ["calendar", "Google Calendar", "Read and create events"],
    ["gmail", "Gmail", "Search mail and write drafts"],
    ["todoist", "Todoist", "Read and update tasks"],
  ];
  const PERMS = {
    ask: ["Ask first", "Asks before editing files or running commands"],
    edits: [
      "Edits allowed",
      "Edits files in its home workspace without asking. Asks before commands",
    ],
    full: [
      "Full access",
      "Edits and runs commands without asking. Use only on a host you trust it with",
    ],
  };
  const MEMORY_REPLY = {
    confirm:
      " When you tell me something worth keeping, I'll ask before I remember it. What should I know first?",
    silent:
      " I'll remember useful things as we go, and each reply shows what I used. What should I know first?",
    off: " Memory is off, so each session starts fresh apart from this chat. What should I know first?",
  };
  const STEPS = (n, host) => [`Saving ${n} on ${host}`, "Preparing home workspace", "Opening chat"];

  const SCENARIOS = {
    ready: "Options loaded. Defaults are filled in, so a name is the only thing you must enter.",
    loading:
      "Loading options. Hosts and providers are still loading; you can type a name meanwhile. Create waits.",
    "host-offline":
      "Host offline. The default host, studio-mac, is offline. Pick nick-mbp under Host to continue.",
    "provider-missing":
      "Provider unavailable. Claude Code isn't installed on studio-mac. Pick Codex or another host.",
    "no-providers":
      "No providers. studio-mac has no providers set up. Switch host or open provider settings.",
    "create-fails":
      "Create fails once. The first Create attempt fails while saving; Retry succeeds.",
  };

  function hostsFor(sc) {
    const studioProviders = {
      claude: sc !== "provider-missing",
      codex: true,
      opencode: false,
    };
    return {
      "studio-mac": {
        online: sc !== "host-offline",
        providers: sc === "no-providers" ? {} : studioProviders,
        workspaces: ["executive-assistant · main", "paseo · main", "catfin · ledger-export"],
      },
      "nick-mbp": {
        online: true,
        providers: { claude: true, codex: true },
        workspaces: ["executive-assistant · main", "paseo · main"],
      },
      "build-box": { online: false, providers: {}, workspaces: [] },
    };
  }

  // ---------- state ----------
  const S = {};
  const PIC = window.PaseoPicture;
  function reset(opts = {}) {
    // The picture belongs to the draft: discard, Cancel, and opening a new draft drop it.
    // Switching the review scenario keeps it, like name and role.
    const photo = opts.keepPhoto ? S.photo : null;
    if (!opts.keepPhoto) PIC.release(S.photo);
    Object.assign(S, {
      scenario: S.scenario ?? "ready",
      phase: "edit",
      fresh: Boolean(opts.fresh),
      from: opts.from ?? "direct",
      name: opts.name ?? "",
      role: opts.role ?? "",
      color: opts.fresh ? "sky" : "pink",
      photo,
      photoErr: "",
      host: "studio-mac",
      provider: "claude",
      model: "Opus",
      workspace: "new",
      instructions: ROLES[opts.role] ?? "",
      instructionsTouched: false,
      open: {},
      picker: null,
      pickerFrame: null,
      paseoTools: true,
      skills: { paseo: true },
      mcp: { calendar: true },
      permission: "ask",
      remember: true,
      memoryPolicy: "confirm",
      seed: "",
      checkins: false,
      checkMorning: true,
      checkReports: true,
      submitted: false,
      step: 0,
      attempts: 0,
      discard: false,
      chat: [],
      replying: false,
      sideOpen: false,
      mAbout: false,
      announce: "",
    });
  }
  reset();

  // ---------- derived ----------
  const hosts = () => hostsFor(S.scenario);
  const loading = () => S.scenario === "loading";
  const dn = () => S.name.trim() || "your teammate";
  const cap = () => S.name.trim() || "Your teammate";
  const initial = () => (S.name.trim()[0] || "?").toUpperCase();
  const hostRec = () => hosts()[S.host];
  const providerOk = () => Boolean(hostRec().providers[S.provider]);
  const noProviders = () => Object.keys(hostRec().providers).length === 0;
  const wsLabel = () =>
    S.workspace === "new" ? `New workspace for ${S.name.trim() || "teammate"}` : S.workspace;

  function nameError() {
    const n = S.name.trim();
    if (!n) return "Enter a name";
    if (n.length > 24) return "Use 24 characters or fewer";
    if (!S.fresh && EXISTING.some((e) => e.toLowerCase() === n.toLowerCase()))
      return `${n} is already a teammate. Pick another name`;
    return "";
  }
  function runsError() {
    if (loading()) return "Wait for hosts and providers to load";
    if (!hostRec().online) return `${S.host} is offline. Pick another host or wait for it`;
    if (noProviders()) return `${S.host} has no providers set up`;
    if (!providerOk()) return `${PROVIDERS[S.provider].label} isn't installed on ${S.host}`;
    return "";
  }

  // ---------- render helpers ----------
  let A; // shared helpers from mock.js
  const esc = (s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  const nmSpan = () => `<span data-bind="nm">${esc(dn())}</span>`;
  const capSpan = () => `<span data-bind="cap">${esc(cap())}</span>`;
  const bigAvatar = (size = "xl") =>
    PIC.avatar({ photo: S.photo, color: S.color, initial: initial(), size, bind: "avatar" });
  function pictureField(f) {
    const c = PIC.control({
      id: f,
      owner: "draft",
      photo: S.photo,
      error: S.photoErr,
      subject: S.name.trim() || "teammate",
    });
    return `<div class="field" data-pic-scope>
        <span class="label" id="${f}-pic-l">Picture <span class="opt">Optional</span></span>
        <div class="pic-field" role="group" aria-labelledby="${f}-pic-l">${c.input}${c.buttons}</div>
        ${c.hint}${c.err}
      </div>`;
  }
  const act = (a, label, cls, extra = "") =>
    `<button type="button" class="${cls}" data-cf="${a}" ${extra}>${label}</button>`;
  const sw = (key, on, label, extra = "") =>
    `<button class="switch" type="button" role="switch" aria-checked="${on}" aria-label="${label}" data-cf="toggle" data-key="${key}" ${extra}></button>`;
  const errLine = (id, msg) =>
    `<div class="field-err" id="${id}" data-err="${id}" ${msg ? "" : "hidden"}>${esc(msg)}</div>`;

  // ---------- identity ----------
  function identityBlock(f) {
    const err = S.submitted ? nameError() : "";
    const chips = Object.keys(ROLES)
      .map(
        (r) =>
          `<button type="button" class="chip" data-cf="role" data-role="${r}" aria-pressed="${S.role === r}">${r}</button>`,
      )
      .join("");
    const swatches = COLORS.map(
      (c) =>
        `<button type="button" class="swatch c-${c}" role="radio" aria-checked="${S.color === c}" aria-label="${c}" data-cf="color" data-color="${c}"></button>`,
    ).join("");
    return `
      <div class="cf-identity">
        ${bigAvatar()}
        <div class="cf-identity-fields">
          <div class="field">
            <label for="${f}-name">Name</label>
            <input class="text-input ${err ? "invalid" : ""}" id="${f}-name" data-field="name" data-k="name" autocomplete="off" maxlength="40" placeholder="Name your teammate" value="${esc(S.name)}" aria-invalid="${Boolean(err)}" aria-describedby="${f}-name-err" />
            ${errLine(`${f}-name-err`, err)}
          </div>
          <div class="field">
            <label for="${f}-role">Role <span class="opt">Optional</span></label>
            <input class="text-input" id="${f}-role" data-field="role" data-k="role" autocomplete="off" placeholder="What ${esc(dn())} is for" value="${esc(S.role)}" />
            <div class="chips" role="group" aria-label="Suggested roles">${chips}</div>
          </div>
        </div>
      </div>
      ${pictureField(f)}
      <div class="field">
        <span class="label" id="${f}-color-l">Color</span>
        <div class="swatches" role="radiogroup" aria-labelledby="${f}-color-l">${swatches}</div>
        ${S.photo ? `<span class="hint">Shows behind the initial if there's no picture</span>` : ""}
      </div>`;
  }

  // ---------- runs on ----------
  function pickerRow(kind, title, value, hint, compact) {
    const open = S.picker === kind && S.pickerFrame === (compact ? "m" : "d");
    return `
      <button type="button" class="row pick" data-cf="picker" data-kind="${kind}" data-k="pick-${kind}" aria-expanded="${open}">
        <div class="lines"><span>${title}</span><span class="hint">${hint}</span></div>
        <span class="val"><span class="v">${value}</span>${A.ic("chevronD")}</span>
      </button>`;
  }
  function loadingRows() {
    return ["Host", "Provider", "Model", "Home workspace"]
      .map(
        (t) =>
          `<div class="row"><div class="lines"><span>${t}</span><span class="hint">&nbsp;</span></div><span class="val"><span class="spinner sm" aria-hidden="true"></span>Loading...</span></div>`,
      )
      .join("");
  }
  function hostDot(h) {
    return `<span class="dot ${hosts()[h].online ? "success" : "off"}" aria-hidden="true"></span>`;
  }
  function runsCard(f, compact) {
    if (loading())
      return `<div class="card" role="status" aria-label="Loading hosts and providers">${loadingRows()}</div>`;
    const h = hostRec();
    const hostHint = h.online
      ? `${capSpan()}'s chat, memory, and notes live here. Offline means read-only`
      : `<span class="err">${esc(S.host)} is offline</span>`;
    const inline = (k) =>
      !compact && S.picker === k && S.pickerFrame === "d" ? pickerList(k, f) : "";
    let providerRows;
    if (noProviders()) {
      providerRows = `<div class="row cf-empty"><div class="lines"><span>No providers on ${esc(S.host)}</span><span class="hint">Set up Claude Code, Codex, or another provider on this host, or pick a host that has one</span></div>${act("open-providers", "Open providers", "btn outline xs")}</div>`;
    } else {
      const pHint = providerOk()
        ? `Used for ${nmSpan()}'s own replies. Changing it later keeps the chat and memory`
        : `<span class="err">${esc(PROVIDERS[S.provider].label)} isn't installed on ${esc(S.host)}</span>`;
      providerRows =
        pickerRow("provider", "Provider", esc(PROVIDERS[S.provider].label), pHint, compact) +
        inline("provider") +
        pickerRow(
          "model",
          "Model",
          esc(S.model),
          "Bigger models are slower and use more of your plan",
          compact,
        ) +
        inline("model");
    }
    return `
      <div class="card ${runsError() && S.submitted ? "invalid" : ""}">
        ${pickerRow("host", "Host", esc(S.host), hostHint, compact).replace('<span class="v">', `${hostDot(S.host)}<span class="v">`)}
        ${inline("host")}
        ${providerRows}
        ${pickerRow("workspace", "Home workspace", esc(wsLabel()), `Where ${nmSpan()} keeps notes and files. Code work still runs in each project`, compact)}
        ${inline("workspace")}
      </div>
      ${errLine(`${f}-runs-err`, S.submitted ? runsError() : "")}`;
  }

  function options(kind) {
    const H = hosts();
    if (kind === "host")
      return Object.keys(H).map((h) => ({
        v: h,
        label: h,
        lead: hostDot(h),
        sub: H[h].online ? `${Object.keys(H[h].providers).length} providers` : "Offline",
        disabled: false,
      }));
    if (kind === "provider")
      return Object.keys(PROVIDERS).map((p) => ({
        v: p,
        label: PROVIDERS[p].label,
        sub: hostRec().providers[p] ? "Installed" : `Not installed on ${S.host}`,
        disabled: !hostRec().providers[p],
      }));
    if (kind === "model")
      return PROVIDERS[S.provider].models.map((m) => ({ v: m, label: m, sub: "" }));
    return [
      {
        v: "new",
        label: `New workspace for ${S.name.trim() || "teammate"}`,
        sub: "Recommended. Keeps notes separate from your projects",
      },
      ...hostRec().workspaces.map((w) => ({ v: w, label: w, sub: "Existing workspace" })),
    ];
  }
  const current = (kind) =>
    ({ host: S.host, provider: S.provider, model: S.model, workspace: S.workspace })[kind];
  function pickerList(kind, f) {
    const items = options(kind)
      .map((o) => {
        const sel = current(kind) === o.v;
        return `<button type="button" class="opt-row" role="option" aria-selected="${sel}" data-cf="pick" data-kind="${kind}" data-v="${esc(o.v)}" ${o.disabled ? 'aria-disabled="true"' : ""}>
          ${o.lead ?? ""}<span class="lines"><span>${esc(o.label)}</span>${o.sub ? `<span class="hint">${esc(o.sub)}</span>` : ""}</span>${sel ? '<span class="tick" aria-hidden="true">✓</span>' : ""}</button>`;
      })
      .join("");
    return `<div class="opt-list" role="listbox" aria-label="${kind}" id="${f}-list-${kind}">${items}</div>`;
  }
  function sheet() {
    if (!S.picker || S.pickerFrame !== "m") return "";
    const title = {
      host: "Host",
      provider: "Provider",
      model: "Model",
      workspace: "Home workspace",
    }[S.picker];
    return `<div class="cf-scrim" data-cf="close-picker"></div>
      <div class="cf-sheet" role="dialog" aria-modal="true" aria-label="Choose ${title.toLowerCase()}">
        <div class="grabber" aria-hidden="true"></div>
        <div class="sheet-head"><span class="sheet-title">${title}</span>${act("close-picker", "Done", "btn ghost xs")}</div>
        ${pickerList(S.picker, "m")}
      </div>`;
  }

  // ---------- customize (collapsible rows) ----------
  function instructionsSummary() {
    if (!S.instructions.trim()) return "None. Uses the provider's defaults";
    if (S.instructionsTouched) return `Custom · ${S.instructions.trim().length} characters`;
    return `Suggested for ${S.role || "this role"}`;
  }
  function memorySummary() {
    if (!S.remember) return "Off";
    return S.memoryPolicy === "confirm" ? "Asks before saving" : "Saves and shows you";
  }
  function summary(key) {
    const sk = SKILLS.filter(([k]) => S.skills[k]).length;
    const mc = MCP.filter(([k]) => S.mcp[k]).length;
    return {
      instructions: instructionsSummary(),
      tools: `${S.paseoTools ? "Paseo tools" : "No Paseo tools"} · ${sk} ${sk === 1 ? "skill" : "skills"} · ${mc} MCP`,
      permissions: PERMS[S.permission][0],
      memory: memorySummary(),
      checkins: S.checkins ? "On · proposal" : "Off",
    }[key];
  }
  function collapsible(key, title, body) {
    const open = Boolean(S.open[key]);
    return `
      <button type="button" class="row pick collapsible" data-cf="expand" data-key="${key}" data-k="exp-${key}" aria-expanded="${open}">
        <div class="lines"><span>${title}</span><span class="hint" data-sum="${key}">${esc(summary(key))}</span></div>
        <span class="chev ${open ? "open" : ""}">${A.ic("chevronR")}</span>
      </button>
      ${open ? `<div class="nested">${body}</div>` : ""}`;
  }
  function instructionsBody(f) {
    return `<div class="nested-pad">
      <label class="sr-only" for="${f}-instr">Instructions</label>
      <textarea class="text-input area" id="${f}-instr" data-field="instructions" data-k="instr" rows="5" placeholder="How ${esc(dn())} should work, what to own, what to ask about">${esc(S.instructions)}</textarea>
      <div class="hint">Sent at the start of every session. Edit any time in About ${capSpan()}</div>
    </div>`;
  }
  const checkRow = (group, k, label, sub) =>
    `<div class="nrow"><div class="lines"><span>${label}</span><span class="hint">${sub}</span></div>${sw(`${group}.${k}`, Boolean(S[group][k]), label)}</div>`;
  function toolsBody() {
    return `
      <div class="nrow"><div class="lines"><span>Paseo tools</span><span class="hint">Lets ${nmSpan()} start agent sessions in your projects and report back. Off means chat only</span></div>${sw("paseoTools", S.paseoTools, "Paseo tools")}</div>
      <div class="nhead">Skills on ${esc(S.host)}</div>
      ${SKILLS.map(([k, l, s]) => checkRow("skills", k, l, s)).join("")}
      <div class="nhead">MCP servers <span class="opt">Each one can see the data it connects to</span></div>
      ${MCP.map(([k, l, s]) => checkRow("mcp", k, l, s)).join("")}`;
  }
  function permissionsBody() {
    const segs = Object.entries(PERMS)
      .map(
        ([k, [l]]) =>
          `<button type="button" role="radio" aria-checked="${S.permission === k}" data-cf="perm" data-v="${k}">${l}</button>`,
      )
      .join("");
    return `<div class="nested-pad">
      <div class="seg" role="radiogroup" aria-label="Permissions">${segs}</div>
      <div class="hint" data-sum="perm-hint">${esc(PERMS[S.permission][1])}</div>
      ${S.permission === "full" ? `<div class="field-err">Full access applies to ${capSpan()}'s home workspace and anything its tools reach</div>` : ""}
      <div class="hint">Agent sessions ${nmSpan()} starts in projects keep their own permission mode</div>
    </div>`;
  }
  function memoryBody(f) {
    const policy = [
      ["confirm", "Ask before saving", `${cap()} proposes each memory and you confirm it`],
      ["silent", "Save and show me", "Saves quietly. Replies show which memories they used"],
    ]
      .map(
        ([k, l, s]) =>
          `<button type="button" class="opt-row" role="radio" aria-checked="${S.memoryPolicy === k}" data-cf="mem-policy" data-v="${k}" ${S.remember ? "" : "disabled"}><span class="radio" aria-hidden="true"></span><span class="lines"><span>${l}</span><span class="hint">${esc(s)}</span></span></button>`,
      )
      .join("");
    return `
      <div class="nrow"><div class="lines"><span>Remember from chats</span><span class="hint">Memory stays on ${esc(S.host)}. You can see, edit, and forget every item</span></div>${sw("remember", S.remember, "Remember from chats")}</div>
      <div role="radiogroup" aria-label="When to save" class="nested-pad tight ${S.remember ? "" : "dim"}">${policy}</div>
      <div class="nested-pad">
        <label class="label" for="${f}-seed">Starting memories <span class="opt">Optional, one per line</span></label>
        <textarea class="text-input area" id="${f}-seed" data-field="seed" data-k="seed" rows="3" placeholder="Prefers PR reviews before 11 AM">${esc(S.seed)}</textarea>
      </div>`;
  }
  function checkinsBody() {
    return `
      <div class="nrow"><div class="lines"><span><span>Let ${nmSpan()} message first</span><span class="badge warn">Proposal</span></span><span class="hint">Undecided. Off means ${nmSpan()} only replies</span></div>${sw("checkins", S.checkins, "Let teammate message first")}</div>
      ${
        S.checkins
          ? `<div class="nrow"><div class="lines"><span>Morning summary</span><span class="hint">Weekdays at 8:00 on ${esc(S.host)}</span></div>${sw("checkMorning", S.checkMorning, "Morning summary")}</div>
             <div class="nrow"><div class="lines"><span>Finished-work reports</span><span class="hint">When an agent session it started finishes</span></div>${sw("checkReports", S.checkReports, "Finished-work reports")}</div>`
          : ""
      }`;
  }
  function customizeCard(f) {
    return `<div class="card">
      ${collapsible("instructions", "Instructions", instructionsBody(f))}
      ${collapsible("tools", "Skills and tools", toolsBody())}
      ${collapsible("permissions", "Permissions", permissionsBody())}
      ${collapsible("memory", "Memory", memoryBody(f))}
      ${collapsible("checkins", "Check-ins", checkinsBody())}
    </div>`;
  }

  // ---------- footer / progress ----------
  function progress() {
    const steps = STEPS(cap(), S.host);
    const rows = steps
      .map((t, i) => {
        let dot = "off";
        if (i < S.step) dot = "success";
        else if (i === S.step) dot = S.phase === "failed" ? "danger" : "running";
        return `<div class="step"><span class="dot ${dot}" aria-hidden="true"></span><span class="${i <= S.step ? "" : "muted"}">${esc(t)}</span></div>`;
      })
      .join("");
    return `<div class="card steps" role="status" aria-live="polite">${rows}</div>`;
  }
  function footer() {
    if (S.phase === "creating")
      return `${progress()}<div class="cf-actions">${act("noop", "Creating...", "btn default md", "disabled")}</div>`;
    if (S.phase === "failed")
      return `${progress()}
        <div class="alert error" role="alert">${A.ic("alert")}<div>
          <div class="t">Unable to create ${esc(cap())}</div>
          <div class="d">${esc(S.host)} stopped responding while saving. Nothing was saved. Your setup is still here.</div>
          <div class="acts">${act("retry", `${A.ic("refresh")}Retry`, "btn outline xs", 'data-k="retry"')}${act("edit", "Edit setup", "btn outline xs")}</div>
        </div></div>`;
    const blocked = loading() || noProviders();
    return `<div class="cf-actions">
        ${act("create", `<span>Create <span data-bind="cap-btn">${esc(S.name.trim() || "teammate")}</span></span>`, "btn default md", `data-k="create" ${blocked ? 'aria-disabled="true"' : ""}`)}
        ${act("cancel", "Cancel", "btn ghost md", 'data-k="cancel"')}
      </div>
      <p class="cf-note">Everything except the host can be changed later in About ${capSpan()}</p>`;
  }

  function form(f, compact) {
    const locked = S.phase === "creating" || S.phase === "failed";
    return `<div class="transcript-inner"><div class="cf-col">
      <fieldset class="cf-form" ${locked ? "disabled" : ""}>
        <legend class="sr-only">New teammate</legend>
        ${identityBlock(f)}
        <div class="section"><div class="section-head">Runs on</div>${runsCard(f, compact)}</div>
        <div class="section"><div class="section-head">Customize<span class="right muted">Optional</span></div>${customizeCard(f)}</div>
      </fieldset>
      ${footer()}
    </div></div>`;
  }

  function discardDialog() {
    if (!S.discard) return "";
    return `<div class="cf-scrim" data-cf="keep"></div>
      <div class="cf-dialog" role="alertdialog" aria-modal="true" aria-labelledby="discard-t">
        <div class="t" id="discard-t">Discard ${esc(S.name.trim() || "this teammate")}?</div>
        <div class="d">Nothing has been created yet. Your setup will be lost.</div>
        <div class="acts">${act("keep", "Keep editing", "btn secondary", 'data-k="keep"')}${act("discard", "Discard", "btn destructive")}</div>
      </div>`;
  }

  // ---------- after create: direct chat ----------
  function chatBody() {
    const intro = `
      <div class="session-break" role="note">${A.ic("layers")}<span>${esc(`Created today · ${PROVIDERS[S.provider].label} · ${S.model} · ${S.chat.length ? "1 session" : "no session yet"}`)}</span><button type="button" class="link" data-cf="about" data-k="about-link">About ${esc(cap())}</button></div>
      ${
        S.chat.length
          ? ""
          : `<div class="cf-ready">${bigAvatar()}<div class="t">${esc(cap())} is ready</div>
              <div class="d">${esc(S.role || "Teammate")} on ${esc(S.host)}. ${esc(cap())} doesn't message first, so say hello or tell it how you like to work.</div>
              <div class="chips">${["What's on my plate today?", "Here's how I like to work", "Learn my projects"].map((s) => `<button type="button" class="chip" data-cf="suggest" data-v="${esc(s)}">${esc(s)}</button>`).join("")}</div></div>`
      }`;
    const msgs = S.chat
      .map((m) =>
        m.who === "user"
          ? `<div class="msg user"><div class="bubble">${esc(m.text)}</div></div>`
          : agentMsg(m),
      )
      .join("");
    return intro + msgs;
  }
  function agentMsg(m) {
    return `<article class="msg agent"><div class="who">${bigAvatar("")}<span class="name">${esc(cap())}</span><span class="time">now</span></div>
      ${m.streaming ? '<div class="responding"><span class="pulse3" aria-hidden="true"><i></i><i></i><i></i></span>Responding</div>' : ""}
      <div class="content"><p>${esc(m.text)}${m.streaming ? '<span class="caret"></span>' : ""}</p></div></article>`;
  }
  function chatComposer(f) {
    return `<div class="composer-wrap"><form class="composer" data-cf-form="send" aria-label="Composer">
      <label class="sr-only" for="${f}-msg">Message ${esc(cap())}</label>
      <textarea class="composer-input" id="${f}-msg" data-field="draft" data-k="msg" rows="1" placeholder="Message ${esc(cap())}">${esc(S.draft ?? "")}</textarea>
      <div class="bar"><span class="pill">${A.ic("paperclip")}</span><span class="pill">${A.ic("code")}${esc(PROVIDERS[S.provider].label)} · ${esc(S.model)}${A.ic("chevronD")}</span>
      <button class="send" type="submit" aria-label="Send" ${S.replying ? "disabled" : ""}>${A.ic("arrowUp")}</button></div>
    </form></div>`;
  }
  function aboutPictureRow(f) {
    const c = PIC.control({
      id: `${f}-about`,
      owner: "draft",
      photo: S.photo,
      error: S.photoErr,
      subject: cap(),
    });
    return `<div class="row top pic-row" data-pic-scope>${c.input}
        <div class="lines"><span>Picture</span>${c.hint}${c.err}</div>
        <span class="val">${c.buttons}</span></div>`;
  }
  function aboutPane(compact) {
    const f = compact ? "m" : "d";
    const rows = [
      ["Name", esc(cap())],
      ["Role", esc(S.role || "None")],
      ["Host", esc(S.host)],
      ["Provider", `${esc(PROVIDERS[S.provider].label)} · ${esc(S.model)}`],
      ["Home workspace", esc(wsLabel())],
      ["Permissions", esc(PERMS[S.permission][0])],
      ["Memory", esc(summary("memory"))],
      ["Check-ins", esc(summary("checkins"))],
    ]
      .map(
        ([k, v]) =>
          `<div class="row"><div class="lines"><span>${k}</span></div><span class="val">${v}</span></div>`,
      )
      .join("");
    const seeds = S.seed
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const mem = seeds.length
      ? seeds
          .map(
            (s) =>
              `<div class="row"><div class="lines"><span>${esc(s)}</span><span class="hint">Added by you · today</span></div></div>`,
          )
          .join("")
      : `<div class="mem-empty">Nothing remembered yet.</div>`;
    const head = compact
      ? `<div class="header">${act("about-back", A.ic("back"), "icon-btn", 'aria-label="Back to chat" data-k="about-back"')}<div class="titles"><span class="screen-title">About ${esc(cap())}</span></div></div>`
      : `<div class="header"><div class="titles"><span class="screen-title">About ${esc(cap())}</span></div><div class="tools">${act("side", A.ic("panel"), "icon-btn", 'aria-label="Close side pane"')}</div></div>`;
    return `<aside class="${compact ? "pane" : "sidepane"}" aria-label="About ${esc(cap())}">
      ${head}
      <div class="sp-scroll"><div class="hero">${bigAvatar()}<div><div class="n">${esc(cap())}</div><div class="r">${esc(S.role || "Teammate")} · since today</div></div></div>
      <div class="section"><div class="section-head">Identity</div><div class="card">${aboutPictureRow(f)}</div></div>
      <div class="section"><div class="section-head">Setup</div><div class="card">${rows}</div></div>
      <div class="section"><div class="section-head">Memory</div><div class="card">${mem}</div></div></div></aside>`;
  }

  // ---------- panes ----------
  function header(f, compact) {
    if (S.phase === "done") {
      const side = compact
        ? ""
        : `<button class="icon-btn" type="button" data-cf="side" aria-label="About ${esc(cap())}" aria-pressed="${S.sideOpen}">${A.ic("panel")}</button>`;
      return `<div class="header">${compact ? act("back-chats", A.ic("back"), "icon-btn", 'aria-label="Back"') : ""}${bigAvatar("")}
        <div class="titles"><span class="screen-title">${esc(cap())}</span><span class="meta">${esc(S.role || "Teammate")}</span></div>
        <div class="tools">${side}${A.iconBtn("more", "More")}</div></div>`;
    }
    const lead = compact ? act("cancel", A.ic("back"), "icon-btn", 'aria-label="Back"') : "";
    const close = compact
      ? ""
      : act("cancel", A.ic("x"), "icon-btn", 'aria-label="Cancel and close"');
    return `<div class="header">${lead}<div class="titles"><span class="screen-title">New teammate</span><span class="meta">Draft · not created yet</span></div><div class="tools">${close}</div></div>`;
  }
  function pane(f, compact) {
    if (compact && S.phase === "done" && S.mAbout) return aboutPane(true);
    const body =
      S.phase === "done"
        ? `<div class="transcript-inner"><div class="col">${chatBody()}</div></div>${chatComposer(f)}`
        : form(f, compact);
    return `<section class="pane cf-pane" aria-label="${S.phase === "done" ? esc(cap()) : "New teammate"}">
      ${header(f, compact)}<div class="body"><div class="transcript">${body}</div></div></section>`;
  }

  function sidebarOpts(compact) {
    const draft =
      S.phase === "done"
        ? null
        : { name: S.name.trim(), color: S.color, initial: initial(), photo: S.photo };
    const created =
      S.phase === "done"
        ? {
            name: cap(),
            color: S.color,
            initial: initial(),
            photo: S.photo,
            role: S.role || "Teammate",
          }
        : null;
    return { draft, created, fresh: S.fresh, menuOpen: compact && S.phase !== "done" };
  }

  function renderDesktop() {
    return `<div class="desktop cf-root" data-frame="d" aria-label="Desktop mock">${A.sidebar("ready", "create", false, sidebarOpts(false))}${pane("d", false)}${S.phase === "done" && S.sideOpen ? aboutPane(false) : ""}${discardDialog()}</div>`;
  }
  function mobileCaption() {
    if (S.phase !== "done") return "New teammate (pushed)";
    return S.mAbout ? `About ${esc(cap())} (pushed)` : `${esc(cap())} (first direct chat)`;
  }
  function renderMobile() {
    return [
      A.phone("Entry: Chats + menu", A.sidebar("ready", "create", true, sidebarOpts(true))),
      `<div class="phone-wrap"><p class="phone-cap">${mobileCaption()}</p><div class="phone cf-root" data-frame="m"><div class="statusbar"><span>9:41</span><span>●●●</span></div>${pane("m", true)}${sheet()}${discardDialog()}</div></div>`,
    ].join("");
  }

  // ---------- events ----------
  const H = {};
  function rerender(focusKey, frame) {
    A.rerender();
    restoreFocus(focusKey, frame);
  }
  function restoreFocus(key, frame) {
    if (!key) return;
    const root = document.querySelector(`.cf-root[data-frame="${frame}"]`) ?? document;
    const el =
      root.querySelector(`[data-k="${key}"]`) ?? document.querySelector(`[data-k="${key}"]`);
    el?.focus();
  }
  H.picker = (b, fr) => {
    const k = b.dataset.kind;
    S.picker = S.picker === k && S.pickerFrame === fr ? null : k;
    S.pickerFrame = fr;
    A.rerender();
    const root = document.querySelector(`.cf-root[data-frame="${fr}"]`);
    (
      root?.querySelector('.opt-row[aria-selected="true"]') ??
      root?.querySelector(`[data-k="pick-${k}"]`)
    )?.focus();
  };
  H.pick = (b, fr) => {
    if (b.getAttribute("aria-disabled") === "true") return;
    const k = b.dataset.kind;
    const v = b.dataset.v;
    if (k === "host") pickHost(v);
    if (k === "provider") {
      S.provider = v;
      S.model = PROVIDERS[v].models[0];
    }
    if (k === "model") S.model = v;
    if (k === "workspace") S.workspace = v;
    S.picker = null;
    rerender(`pick-${k}`, fr);
  };
  function pickHost(v) {
    S.host = v;
    const h = hosts()[v];
    if (!h.providers[S.provider]) {
      const first = Object.keys(h.providers).find((p) => h.providers[p]);
      if (first) {
        S.provider = first;
        S.model = PROVIDERS[first].models[0];
      }
    }
    if (S.workspace !== "new" && !h.workspaces.includes(S.workspace)) S.workspace = "new";
  }
  H["close-picker"] = (b, fr) => {
    const k = S.picker;
    S.picker = null;
    rerender(`pick-${k}`, fr);
  };
  H.role = (b, fr) => {
    S.role = b.dataset.role;
    if (!S.instructionsTouched) S.instructions = ROLES[S.role];
    rerender(null, fr);
  };
  H.color = (b, fr) => {
    S.color = b.dataset.color;
    A.rerender();
    document.querySelector(`.cf-root[data-frame="${fr}"] [data-color="${S.color}"]`)?.focus();
  };
  H.expand = (b, fr) => {
    const k = b.dataset.key;
    S.open[k] = !S.open[k];
    rerender(`exp-${k}`, fr);
  };
  H.toggle = (b, fr) => {
    const [a, c] = b.dataset.key.split(".");
    if (c) S[a][c] = !S[a][c];
    else S[a] = !S[a];
    A.rerender();
    document.querySelector(`.cf-root[data-frame="${fr}"] [data-key="${b.dataset.key}"]`)?.focus();
  };
  H.perm = (b) => {
    S.permission = b.dataset.v;
    A.rerender();
  };
  H["mem-policy"] = (b) => {
    S.memoryPolicy = b.dataset.v;
    A.rerender();
  };
  H.create = (b, fr) => {
    S.submitted = true;
    if (nameError()) return rerender("name", fr);
    if (runsError()) {
      let bad = "pick-provider";
      if (loading()) bad = "create";
      else if (!hostRec().online || noProviders()) bad = "pick-host";
      return rerender(bad, fr);
    }
    startCreate(fr);
  };
  function startCreate(fr) {
    S.phase = "creating";
    S.step = 0;
    S.picker = null;
    S.attempts += 1;
    A.rerender();
    const failNow = S.scenario === "create-fails" && S.attempts === 1;
    const tick = () => {
      if (failNow && S.step === 0) {
        S.phase = "failed";
        A.rerender();
        return restoreFocus("retry", fr);
      }
      S.step += 1;
      if (S.step >= 3) return finish(fr);
      A.rerender();
      setTimeout(tick, 700);
    };
    setTimeout(tick, 800);
  }
  function finish(fr) {
    S.phase = "done";
    S.sideOpen = false;
    S.announce = `${cap()} created`;
    A.rerender();
    restoreFocus("msg", fr);
  }
  H.retry = (b, fr) => startCreate(fr);
  H.edit = (b, fr) => {
    S.phase = "edit";
    rerender("create", fr);
  };
  H.cancel = (b, fr) => {
    const dirty = S.name.trim() || S.role || S.seed || S.instructionsTouched || S.photo;
    if (!dirty) return A.leave(S.from);
    S.discard = true;
    rerender("keep", fr);
  };
  H.keep = (b, fr) => {
    S.discard = false;
    rerender("cancel", fr);
  };
  H.discard = () => {
    PIC.release(S.photo);
    S.photo = null;
    S.photoErr = "";
    A.leave(S.from);
  };
  H["back-chats"] = () => A.leave(S.from);
  H["open-providers"] = () => {
    S.announce = "Opens Settings → Providers for this host (not part of this mock)";
    A.rerender();
  };
  H.side = () => {
    S.sideOpen = !S.sideOpen;
    A.rerender();
  };
  // "About {name}" in the session row: side pane on desktop, pushed screen on compact.
  H.about = (b, fr) => {
    if (fr === "m") {
      S.mAbout = true;
      return rerender("about-back", "m");
    }
    S.sideOpen = true;
    A.rerender();
    PIC.refocus("d", ["draft-pic-change", "draft-pic-add"]);
  };
  H["about-back"] = () => {
    S.mAbout = false;
    rerender("about-link", "m");
  };
  H.suggest = (b, fr) => {
    S.draft = b.dataset.v;
    rerender("msg", fr);
  };
  H.noop = () => {};

  function send(fr) {
    const text = (S.draft ?? "").trim();
    if (!text || S.replying) return;
    S.chat.push({ who: "user", text });
    S.draft = "";
    S.replying = true;
    const reply = {
      who: "agent",
      streaming: true,
      text: `Hi, I'm ${cap()}. I'm set up as ${S.role ? S.role.toLowerCase() : "your teammate"} on ${S.host}, and I start with an empty memory.`,
    };
    S.chat.push(reply);
    rerender("msg", fr);
    setTimeout(() => {
      reply.streaming = false;
      reply.text += MEMORY_REPLY[S.remember ? S.memoryPolicy : "off"];
      S.replying = false;
      rerender("msg", fr);
    }, 1400);
  }

  function onInput(e) {
    const el = e.target.closest("[data-field]");
    if (!el || !e.target.closest(".cf-root")) return;
    const f = el.dataset.field;
    S[f] = el.value;
    if (f === "instructions") S.instructionsTouched = true;
    syncBindings(el);
  }
  function syncBindings(src) {
    document.querySelectorAll(`.cf-root [data-field="${src.dataset.field}"]`).forEach((o) => {
      if (o !== src) o.value = src.value;
    });
    if (src.dataset.field === "draft") return;
    document.querySelectorAll('.cf-root [data-bind="nm"]').forEach((n) => (n.textContent = dn()));
    document.querySelectorAll('.cf-root [data-bind="cap"]').forEach((n) => (n.textContent = cap()));
    document
      .querySelectorAll('.cf-root [data-bind="cap-btn"]')
      .forEach((n) => (n.textContent = S.name.trim() || "teammate"));
    // Typing a name changes initials only; a picture, when set, stays put.
    if (!S.photo)
      document
        .querySelectorAll('.cf-root [data-bind="avatar"]')
        .forEach((n) => (n.textContent = initial()));
    document
      .querySelectorAll("[data-bind=draft-row]")
      .forEach((n) => (n.textContent = S.name.trim() || "New teammate"));
    if (!S.photo)
      document.querySelectorAll("[data-bind=draft-av]").forEach((n) => (n.textContent = initial()));
    document
      .querySelectorAll('[data-sum="instructions"]')
      .forEach((n) => (n.textContent = summary("instructions")));
    if (S.submitted) syncNameError();
  }
  function syncNameError() {
    const err = nameError();
    document.querySelectorAll('.cf-root [data-field="name"]').forEach((i) => {
      i.classList.toggle("invalid", Boolean(err));
      i.setAttribute("aria-invalid", String(Boolean(err)));
    });
    document.querySelectorAll('.cf-root [data-err$="-name-err"]').forEach((n) => {
      n.textContent = err;
      n.hidden = !err;
    });
  }
  function onClick(e) {
    const b = e.target.closest("[data-cf]");
    if (!b || b.disabled) return;
    const fr = b.closest(".cf-root")?.dataset.frame ?? "m";
    H[b.dataset.cf]?.(b, fr);
  }
  function onKey(e) {
    if (e.key === "Escape" && (S.picker || S.discard)) {
      const fr = S.pickerFrame ?? "d";
      if (S.discard) return H.keep(null, fr);
      return H["close-picker"](null, fr);
    }
    const ta = e.target.closest('[data-field="draft"]');
    if (ta && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(ta.closest(".cf-root")?.dataset.frame ?? "d");
    }
  }
  function onSubmit(e) {
    const f = e.target.closest("[data-cf-form]");
    if (!f) return;
    e.preventDefault();
    send(f.closest(".cf-root")?.dataset.frame ?? "d");
  }

  window.PaseoCreateFlow = {
    scenarios: SCENARIOS,
    init(api) {
      A = api;
      document.addEventListener("click", onClick);
      document.addEventListener("input", onInput);
      document.addEventListener("keydown", onKey);
      document.addEventListener("submit", onSubmit);
      PIC.register("draft", {
        picked({ photo, error }, fr) {
          if (error) {
            S.photoErr = error;
            A.rerender();
            PIC.announce(error);
            return PIC.refocus(fr, ["draft-pic-change", "draft-pic-add"]);
          }
          PIC.release(S.photo);
          S.photo = photo;
          S.photoErr = "";
          A.rerender();
          PIC.announce(`Picture added for ${cap()}: ${photo.name}`);
          PIC.refocus(fr, ["draft-pic-change"]);
        },
        remove(fr) {
          PIC.release(S.photo);
          S.photo = null;
          S.photoErr = "";
          A.rerender();
          PIC.announce(`Picture removed. ${cap()} shows the initial ${initial()}`);
          PIC.refocus(fr, ["draft-pic-add"]);
        },
      });
    },
    open(opts) {
      reset(opts);
    },
    setScenario(sc) {
      if (!SCENARIOS[sc]) return;
      const keep = {
        fresh: S.fresh,
        from: S.from,
        name: S.name,
        role: S.role,
        keepPhoto: true,
      };
      S.scenario = sc;
      reset(keep);
      S.name = keep.name;
    },
    get scenario() {
      return S.scenario;
    },
    caption() {
      return S.announce || SCENARIOS[S.scenario];
    },
    renderDesktop,
    renderMobile,
  };
})();
