// Paseo persistent chat — teammate picture helpers. Local mock only: a chosen file becomes an
// object URL in this tab's memory. Nothing is uploaded or saved; reloading the page drops it.
(() => {
  const TYPES = {
    "image/png": "PNG",
    "image/jpeg": "JPEG",
    "image/webp": "WebP",
    "image/gif": "GIF",
  };
  const MAX_BYTES = 5 * 1024 * 1024;
  const RULE = "PNG, JPEG, WebP, or GIF, up to 5 MB";
  const ACCEPT = Object.keys(TYPES).join(",");

  const esc = (s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  function size(n) {
    if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(n / 1024))} KB`;
  }
  function shortName(name) {
    if (name.length <= 28) return name;
    const dot = name.lastIndexOf(".");
    const ext = dot > 0 ? name.slice(dot) : "";
    return `${name.slice(0, 24 - ext.length)}...${ext}`;
  }

  // Resolves { photo } on success, { error } on a rejected file, or {} when nothing was picked.
  function load(file) {
    if (!file) return Promise.resolve({});
    const n = shortName(file.name);
    if (!TYPES[file.type])
      return Promise.resolve({ error: `${n} isn't a supported image. Use a ${RULE}` });
    if (file.size > MAX_BYTES)
      return Promise.resolve({ error: `${n} is ${size(file.size)}. Use an image up to 5 MB` });
    const url = URL.createObjectURL(file);
    return new Promise((resolve) => {
      const img = new Image();
      img.addEventListener("load", () =>
        resolve({
          photo: {
            url,
            name: n,
            type: TYPES[file.type],
            size: size(file.size),
            w: img.naturalWidth,
            h: img.naturalHeight,
          },
        }),
      );
      img.addEventListener("error", () => {
        URL.revokeObjectURL(url);
        resolve({ error: `${n} couldn't be read as an image. Try another file` });
      });
      img.src = url;
    });
  }
  const release = (photo) => photo && URL.revokeObjectURL(photo.url);

  // One avatar for every occurrence. With a picture, the image covers the circle; the identity
  // color stays underneath for transparent images. Without one, the initial on the color.
  function avatar({ photo, color, initial, size: sz = "", pres = "", cls = "", bind = "" }) {
    const inner = photo ? `<img src="${photo.url}" alt="" draggable="false" />` : esc(initial);
    return `<span class="avatar ${sz} c-${color} ${photo ? "has-photo" : ""} ${cls}" ${bind ? `data-bind="${bind}"` : ""} aria-hidden="true">${inner}${pres ? `<i class="pres ${pres}"></i>` : ""}</span>`;
  }

  // The add/change/remove control. Returns parts so a form field and a settings row can lay them
  // out differently. `id` must be unique per frame; `owner` routes events.
  function control({ id, owner, photo, error = "", disabled = false, subject = "teammate" }) {
    const dis = disabled ? "disabled" : "";
    const described = `${id}-pic-hint${error ? ` ${id}-pic-err` : ""}`;
    const input = `<input type="file" class="sr-only" id="${id}-pic-file" accept="${ACCEPT}" data-pic-file="${owner}" tabindex="-1" aria-hidden="true" ${dis} />`;
    const buttons = photo
      ? `<button type="button" class="btn outline pic-btn" data-pic-act="choose" data-pic-owner="${owner}" data-k="${owner}-pic-change" aria-describedby="${described}" ${dis}>Change picture</button>
         <button type="button" class="btn ghost pic-btn" data-pic-act="remove" data-pic-owner="${owner}" data-k="${owner}-pic-remove" aria-label="Remove ${esc(subject)}'s picture" ${dis}>Remove</button>`
      : `<button type="button" class="btn outline pic-btn" data-pic-act="choose" data-pic-owner="${owner}" data-k="${owner}-pic-add" aria-describedby="${described}" ${dis}>Add picture</button>`;
    const hint = `<span class="hint pic-hint" id="${id}-pic-hint">${
      photo ? `${esc(photo.name)} · ${esc(photo.size)}` : `Optional. ${RULE}`
    }</span>`;
    const err = `<span class="field-err pic-err" id="${id}-pic-err" ${error ? "" : "hidden"}>${esc(error)}</span>`;
    return { input, buttons: `<span class="pic-acts">${buttons}</span>`, hint, err };
  }

  // ---------- events ----------
  const owners = {};
  const frameOf = (el) =>
    el.closest("[data-frame]")?.dataset.frame ?? el.closest("#desktop,#mobile")?.id ?? "";
  function scopeOf(el) {
    return el.closest("[data-pic-scope]") ?? el.parentElement;
  }
  function announce(msg) {
    const live = document.getElementById("pic-live");
    if (!live) return;
    live.textContent = "";
    setTimeout(() => {
      live.textContent = msg;
    }, 30);
  }
  // Focus the control in the same frame after a rerender replaced the DOM.
  function refocus(frame, keys) {
    const roots = [
      document.querySelector(`[data-frame="${frame}"]`),
      document.getElementById(frame),
      document,
    ].filter(Boolean);
    for (const root of roots)
      for (const k of keys) {
        const el = root.querySelector(`[data-k="${k}"]`);
        if (el && !el.disabled) return el.focus();
      }
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-pic-act]");
    if (!b || b.disabled) return;
    const owner = owners[b.dataset.picOwner];
    if (!owner) return;
    if (b.dataset.picAct === "choose") {
      const input = scopeOf(b).querySelector(`[data-pic-file="${b.dataset.picOwner}"]`);
      input.value = "";
      input.click();
      return;
    }
    owner.remove(frameOf(b));
  });
  document.addEventListener("change", async (e) => {
    const input = e.target.closest?.("[data-pic-file]");
    if (!input) return;
    const owner = owners[input.dataset.picFile];
    const frame = frameOf(input);
    const result = await load(input.files?.[0]);
    if (result.photo || result.error) owner?.picked(result, frame);
  });

  window.PaseoPicture = {
    RULE,
    load,
    release,
    avatar,
    control,
    announce,
    refocus,
    register(name, handlers) {
      owners[name] = handlers;
    },
  };
})();
