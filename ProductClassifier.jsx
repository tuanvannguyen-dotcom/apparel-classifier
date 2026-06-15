import React, { useState, useMemo, useEffect } from "react";

/* ------------------------------------------------------------------ *
 * Apparel Product Classifier — prototype view
 * Hierarchy: Product Line -> Sub Product Line (single) -> Category (multi)
 * Selection is via dropdown fields; choices assemble a tech-pack code.
 * ------------------------------------------------------------------ */

const TAXONOMY = {
  pant: {
    name: "Pant",
    code: "PNT",
    color: "#3F6FD1",
    subLines: ["Active Pant", "Dress Pant", "Cargo Pant", "Casual Pant", "Jeans", "Shorts"],
    categories: {
      "Waist Band": ["Elastic Waist Band", "Flat Waist Band", "1/2 Elastic Waist Band"],
      "Hem": ["Jogger", "Straight", "Flared"],
      "Sex": ["Male", "Female", "Unisex"],
      "Open": ["With Zipper", "No Zipper", "Drawcord"],
    },
  },
  bra: {
    name: "Bra",
    code: "BRA",
    color: "#C14F88",
    subLines: ["Comfort", "Support", "Speciality"],
    categories: {
      "Technique": ["Cut and sew", "Bonding dot glue", "Bonding jelly stripe", "Seamless", "Hybrid (cut-sew + bonded)"],
      "Cup type & construction": ["Moulded foam cup (single layer)", "Cut and sew cup", "Insert / cookie pocket cup", "Set in cup", "Wrap moulded cup"],
      "Band construction": ["Plush elastic band", "Bonding free cut band", "Jelly / silicone band", "Encased elastic binding band", "Exposed elastic band", "Bondable elastic band"],
      "Strap construction / function": ["Adjustable - Front", "Adjustable - Back", "Adjustable - Velcro", "Adjustable - Built in loops", "Adjustable - Ready made loops", "Non adjustable - Fabric binding", "Non adjustable - Raw edge fabric", "Non adjustable - Cushion / padded", "Non adjustable - Built in elastic", "Non adjustable - Laminated strap", "Strapless"],
      "Front design / opening": ["Additional sling cover", "Additional adjustable sling", "Snap opening", "Hidden snap opening", "Zipper opening", "Wrapping opening", "Hook and bar opening", "Velcro opening"],
      "Back / closure": ["Back closure", "No back closure", "Racerback / convertible", "Added cross back panel"],
    },
  },
  panties: {
    name: "Panties",
    code: "PTY",
    color: "#7E5BD0",
    subLines: ["Everyday", "Adaptive"],
    categories: {
      "Technique": ["Cut and sew", "Bonding", "Seamless", "Hybrid (cut-sew + bonded)"],
      "Waist construction": ["Full elastic waist", "Full bonding waist", "Half elastic, half bonding", "Seamless"],
      "Waist level": ["Low waist", "Medium waist", "High waist"],
      "Compression level": ["Low", "Medium", "High"],
    },
  },
  accessories: {
    name: "Accessories",
    code: "ACC",
    color: "#3E9C5C",
    subLines: ["Bag", "Bookmark", "Key Case", "Pantyhose", "Socks", "Tools"],
    categories: {},
  },
};

/* abbreviation helpers for the classification code */
function abbr(str) {
  const clean = str.replace(/[()/,+\-]/g, " ").replace(/\s+/g, " ").trim();
  const words = clean.split(" ").filter((w) => w && !/^\d+$/.test(w));
  if (words.length === 0) return "X";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 4).toUpperCase();
}
function dimAbbr(str) {
  const clean = str.replace(/[()/,+\-&]/g, " ").replace(/\s+/g, " ").trim();
  const words = clean.split(" ").filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 4).toUpperCase();
}

const CSS = `
.pc-root{
  --ink:#1B1B1A; --muted:#6E6B66; --hair:#E6E3DD; --paper:#F5F4F1; --card:#FFFFFF;
  font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  color:var(--ink); background:var(--paper); min-height:100vh;
  -webkit-font-smoothing:antialiased; padding:28px 24px 60px;
}
.pc-head{ max-width:1180px; margin:0 auto 22px; }
.pc-eyebrow{ font-family:'JetBrains Mono',ui-monospace,Menlo,monospace; font-size:11px;
  letter-spacing:.22em; text-transform:uppercase; color:var(--muted); margin:0 0 8px; }
.pc-title{ font-size:30px; font-weight:700; letter-spacing:-.02em; margin:0 0 6px; }
.pc-sub{ font-size:14px; color:var(--muted); margin:0; max-width:60ch; line-height:1.5; }
.pc-grid{ max-width:1180px; margin:0 auto; display:grid;
  grid-template-columns:212px minmax(0,1fr) 340px; gap:18px; align-items:start; }
.pc-card{ background:var(--card); border:1px solid var(--hair); border-radius:10px; }
.pc-rail{ position:sticky; top:18px; padding:8px; }
.pc-railhd{ font-family:'JetBrains Mono',ui-monospace,Menlo,monospace; font-size:10px;
  letter-spacing:.18em; text-transform:uppercase; color:var(--muted); padding:8px 10px 6px; }
.pc-line{ display:flex; align-items:center; gap:10px; width:100%; text-align:left;
  background:transparent; border:0; border-radius:8px; padding:10px 10px; cursor:pointer;
  font-size:14px; color:var(--ink); font-weight:500; transition:background .12s; }
.pc-line:hover{ background:#F3F1EC; }
.pc-line[data-on="1"]{ background:#F0EEE9; font-weight:600; }
.pc-dot{ width:11px; height:11px; border-radius:3px; flex:0 0 auto; }
.pc-linecount{ margin-left:auto; font-size:11px; color:var(--muted); }
.pc-builder{ padding:20px 22px; min-height:200px; }
.pc-resetbar{ display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;
  padding-bottom:14px; border-bottom:1px solid var(--hair); }
.pc-resetbar h2{ font-size:17px; font-weight:700; margin:0; }
.pc-reset{ border:1px solid var(--hair); background:var(--card); border-radius:8px; font-size:12px;
  padding:7px 12px; cursor:pointer; color:var(--muted); }
.pc-reset:hover{ color:var(--ink); border-color:var(--muted); }

/* field labels */
.pc-grouphd{ display:flex; align-items:baseline; gap:10px; margin:0 0 8px; }
.pc-grouptitle{ font-family:'JetBrains Mono',ui-monospace,Menlo,monospace; font-size:11px;
  letter-spacing:.1em; text-transform:uppercase; font-weight:600; }
.pc-pick{ font-size:10px; letter-spacing:.06em; text-transform:uppercase; color:var(--muted);
  border:1px solid var(--hair); border-radius:20px; padding:2px 8px; }

/* dropdown field */
.pc-subwrap{ max-width:380px; margin-bottom:26px; }
.pc-fields{ display:grid; grid-template-columns:1fr 1fr; gap:18px 18px; }
.pc-field-wrap{ position:relative; }
.pc-field{ border:1px solid var(--hair); background:var(--card); border-radius:9px;
  min-height:44px; padding:7px 36px 7px 12px; cursor:pointer; position:relative;
  display:flex; flex-wrap:wrap; gap:6px; align-items:center; font-size:13px; transition:border-color .12s; }
.pc-field:hover{ border-color:var(--accent); }
.pc-field[data-open="1"]{ border-color:var(--accent); }
.pc-field:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
.pc-ph{ color:var(--muted); }
.pc-single{ font-weight:600; }
.pc-token{ display:inline-flex; align-items:center; gap:7px; background:#F1EFEA;
  border-radius:6px; padding:3px 5px 3px 8px; font-size:12px; }
.pc-tokendot{ width:7px; height:7px; border-radius:2px; background:var(--accent); flex:0 0 auto; }
.pc-tokenx{ border:0; background:transparent; cursor:pointer; font-size:15px; line-height:1;
  color:var(--muted); padding:0 1px; border-radius:4px; }
.pc-tokenx:hover{ color:var(--ink); }
.pc-chev{ position:absolute; right:12px; top:50%; transform:translateY(-50%);
  transition:transform .15s; color:var(--muted); pointer-events:none; font-size:11px; }
.pc-field[data-open="1"] .pc-chev{ transform:translateY(-50%) rotate(180deg); }
.pc-panel{ position:absolute; z-index:40; top:calc(100% + 6px); left:0; right:0; background:var(--card);
  border:1px solid var(--hair); border-radius:10px; box-shadow:0 12px 30px rgba(0,0,0,.13);
  padding:6px; max-height:264px; overflow:auto; }
.pc-opt{ display:flex; align-items:center; gap:11px; padding:9px 10px; border-radius:7px;
  cursor:pointer; font-size:13px; }
.pc-opt:hover{ background:#F3F1EC; }
.pc-mark{ width:17px; height:17px; border:1.5px solid #C7C3BB; flex:0 0 auto;
  display:flex; align-items:center; justify-content:center; color:#fff; font-size:11px; line-height:1; }
.pc-mark.sq{ border-radius:5px; }
.pc-mark.rd{ border-radius:50%; }
.pc-mark[data-on="1"]{ background:var(--accent); border-color:var(--accent); }
.pc-optclear{ color:var(--muted); border-top:1px solid var(--hair); border-radius:0; margin-top:4px;
  justify-content:center; font-size:12px; }

.pc-empty{ border:1px dashed var(--hair); border-radius:10px; padding:22px;
  color:var(--muted); font-size:13px; line-height:1.5; background:#FAF9F7; }

/* spec + library */
.pc-aside{ position:sticky; top:18px; display:flex; flex-direction:column; gap:14px; }
.pc-spec{ background:#1E1E1C; color:#EDEAE3; border-radius:10px; padding:18px; }
.pc-speclabel{ font-family:'JetBrains Mono',ui-monospace,Menlo,monospace; font-size:10px;
  letter-spacing:.2em; text-transform:uppercase; color:#9B968C; margin:0 0 10px; }
.pc-code{ font-family:'JetBrains Mono',ui-monospace,Menlo,monospace; font-size:13px;
  line-height:1.55; word-break:break-word; color:#F3F0E8; }
.pc-codedim{ color:#8FB4FF; }
.pc-specrow{ display:flex; gap:8px; font-size:12px; padding:6px 0; border-top:1px solid #34332F; }
.pc-specrow:first-of-type{ border-top:0; }
.pc-speck{ color:#9B968C; flex:0 0 86px; font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;
  font-size:10px; letter-spacing:.08em; text-transform:uppercase; padding-top:2px; }
.pc-specv{ color:#EDEAE3; }
.pc-meter{ height:5px; border-radius:3px; background:#34332F; overflow:hidden; margin:14px 0 4px; }
.pc-meterfill{ height:100%; border-radius:3px; transition:width .2s ease; }
.pc-metertx{ font-size:11px; color:#9B968C; }
.pc-actions{ display:flex; gap:8px; margin-top:14px; }
.pc-btn{ flex:1; border:0; border-radius:8px; padding:10px; font-size:13px; font-weight:600;
  cursor:pointer; transition:opacity .12s; }
.pc-btn:disabled{ opacity:.4; cursor:not-allowed; }
.pc-btn-primary{ color:#fff; }
.pc-btn-ghost{ background:#34332F; color:#EDEAE3; }
.pc-btn-ghost:hover:not(:disabled){ background:#3F3E39; }
.pc-libcard{ padding:14px 16px; }
.pc-libhd{ display:flex; align-items:center; justify-content:space-between; margin:0 0 10px; }
.pc-libtitle{ font-family:'JetBrains Mono',ui-monospace,Menlo,monospace; font-size:10px;
  letter-spacing:.18em; text-transform:uppercase; color:var(--muted); }
.pc-libempty{ font-size:12px; color:var(--muted); padding:6px 0; }
.pc-libitem{ display:flex; align-items:center; gap:9px; padding:9px 8px; border-radius:8px; cursor:pointer; }
.pc-libitem:hover{ background:#F3F1EC; }
.pc-libmeta{ min-width:0; }
.pc-libname{ font-size:13px; font-weight:600; }
.pc-libcode{ font-family:'JetBrains Mono',ui-monospace,Menlo,monospace; font-size:10px;
  color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:170px; }
.pc-x{ margin-left:auto; border:0; background:transparent; color:var(--muted); cursor:pointer;
  font-size:16px; line-height:1; padding:4px 6px; border-radius:6px; }
.pc-x:hover{ background:#E9E6E0; color:var(--ink); }
.pc-json{ margin-top:12px; }
.pc-jsontog{ font-family:'JetBrains Mono',ui-monospace,Menlo,monospace; font-size:10px;
  letter-spacing:.1em; text-transform:uppercase; color:#9B968C; background:transparent; border:0;
  cursor:pointer; padding:0; }
.pc-pre{ margin:8px 0 0; background:#161614; border-radius:8px; padding:12px; overflow:auto;
  font-family:'JetBrains Mono',ui-monospace,Menlo,monospace; font-size:11px; line-height:1.5;
  color:#CFCABE; max-height:240px; }
.pc-toast{ position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
  background:#1E1E1C; color:#fff; font-size:13px; padding:10px 18px; border-radius:24px;
  box-shadow:0 8px 24px rgba(0,0,0,.18); z-index:60; }
@media (max-width:920px){
  .pc-grid{ grid-template-columns:1fr; }
  .pc-rail,.pc-aside{ position:static; }
  .pc-rail{ display:flex; flex-wrap:wrap; }
  .pc-railhd{ width:100%; }
  .pc-line{ width:auto; }
  .pc-fields{ grid-template-columns:1fr; }
}
@media (prefers-reduced-motion:reduce){ *{ transition:none !important; } }
`;

function Dropdown({ label, pick, placeholder, options, selected, multi, open, onToggle, onPick, onRemove }) {
  return (
    <div className="pc-field-wrap" style={{ zIndex: open ? 30 : 1 }}>
      <div className="pc-grouphd">
        <span className="pc-grouptitle">{label}</span>
        <span className="pc-pick">{pick}</span>
      </div>
      <div
        className="pc-field"
        data-open={open ? "1" : "0"}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
      >
        {selected.length === 0 && <span className="pc-ph">{placeholder}</span>}
        {multi
          ? selected.map((v) => (
              <span className="pc-token" key={v}>
                <span className="pc-tokendot" />
                {v}
                <button className="pc-tokenx" aria-label={"Remove " + v} onClick={(e) => { e.stopPropagation(); onRemove(v); }}>×</button>
              </span>
            ))
          : selected.length > 0 && <span className="pc-single">{selected[0]}</span>}
        <span className="pc-chev">▾</span>
      </div>
      {open && (
        <div className="pc-panel" onMouseDown={(e) => e.stopPropagation()}>
          {options.map((opt) => {
            const on = selected.includes(opt);
            return (
              <div className="pc-opt" key={opt} onClick={() => onPick(opt)}>
                <span className={"pc-mark " + (multi ? "sq" : "rd")} data-on={on ? "1" : "0"}>{on ? (multi ? "✓" : "●") : ""}</span>
                <span>{opt}</span>
              </div>
            );
          })}
          {multi && selected.length > 0 && (
            <div className="pc-opt pc-optclear" onClick={() => selected.slice().forEach(onRemove)}>Clear all</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProductClassifier() {
  const [lineKey, setLineKey] = useState("pant");
  const [sub, setSub] = useState(null);
  const [cats, setCats] = useState({});
  const [library, setLibrary] = useState([]);
  const [toast, setToast] = useState("");
  const [showJson, setShowJson] = useState(false);
  const [openField, setOpenField] = useState(null);

  const line = TAXONOMY[lineKey];
  const dims = Object.keys(line.categories);

  useEffect(() => {
    if (!openField) return;
    const h = (e) => { if (!e.target.closest || !e.target.closest(".pc-field-wrap")) setOpenField(null); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [openField]);

  const flash = (m) => { setToast(m); window.clearTimeout(flash._t); flash._t = window.setTimeout(() => setToast(""), 2200); };

  const selectLine = (k) => { setLineKey(k); setSub(null); setCats({}); setShowJson(false); setOpenField(null); };
  const toggleCat = (dim, val) => {
    setCats((prev) => {
      const cur = prev[dim] ? [...prev[dim]] : [];
      const i = cur.indexOf(val);
      if (i >= 0) cur.splice(i, 1); else cur.push(val);
      const next = { ...prev };
      if (cur.length) next[dim] = cur; else delete next[dim];
      return next;
    });
  };
  const resetSelection = () => { setSub(null); setCats({}); setShowJson(false); setOpenField(null); };

  const code = useMemo(() => {
    let head = line.code;
    if (sub) head += "-" + abbr(sub);
    const parts = dims.filter((d) => cats[d] && cats[d].length).map((d) => `${dimAbbr(d)}:${cats[d].map(abbr).join("+")}`);
    return { head, parts };
  }, [line, sub, cats, dims]);

  const record = () => ({
    productLine: line.name,
    subProductLine: sub || null,
    categories: cats,
    code: code.head + (code.parts.length ? " / " + code.parts.join(" · ") : ""),
  });

  const tagged = dims.filter((d) => cats[d] && cats[d].length).length;
  const pct = dims.length ? Math.round((tagged / dims.length) * 100) : (sub ? 100 : 0);

  const copyJSON = () => {
    const text = JSON.stringify(record(), null, 2);
    const done = () => flash("Classification copied as JSON");
    try { navigator.clipboard.writeText(text).then(done).catch(() => fallback(text, done)); }
    catch (e) { fallback(text, done); }
  };
  const fallback = (text, done) => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); document.execCommand("copy");
      document.body.removeChild(ta); done();
    } catch (e) { setShowJson(true); flash("Copy blocked — JSON shown below"); }
  };

  const addToLibrary = () => {
    if (!sub) { flash("Pick a sub product line first"); return; }
    setLibrary((prev) => [{ ...record(), id: Date.now(), lineKey }, ...prev]);
    flash("Added to library");
  };
  const loadRecord = (rec) => { setLineKey(rec.lineKey); setSub(rec.subProductLine); setCats(rec.categories || {}); setShowJson(false); setOpenField(null); };
  const removeRecord = (id) => setLibrary((prev) => prev.filter((r) => r.id !== id));

  return (
    <div className="pc-root" style={{ ["--accent"]: line.color }}>
      <style>{CSS}</style>

      <header className="pc-head">
        <p className="pc-eyebrow">Crossian · Product taxonomy</p>
        <h1 className="pc-title">Classify a product</h1>
        <p className="pc-sub">
          Every product is filed under one <strong>Product Line</strong> and one <strong>Sub Product Line</strong>,
          then tagged across its <strong>Category</strong> dimensions. Selections assemble a factory-readable
          classification code on the right.
        </p>
      </header>

      <div className="pc-grid">
        {/* LEFT — product lines */}
        <nav className="pc-card pc-rail" aria-label="Product line">
          <div className="pc-railhd">Product line</div>
          {Object.entries(TAXONOMY).map(([k, l]) => (
            <button key={k} className="pc-line" data-on={k === lineKey ? "1" : "0"} onClick={() => selectLine(k)}>
              <span className="pc-dot" style={{ background: l.color }} />
              {l.name}
              <span className="pc-linecount">{l.subLines.length}</span>
            </button>
          ))}
        </nav>

        {/* CENTER — builder */}
        <section className="pc-card pc-builder">
          <div className="pc-resetbar">
            <h2 style={{ color: line.color }}>{line.name}</h2>
            <button className="pc-reset" onClick={resetSelection}>Clear selection</button>
          </div>

          <div className="pc-subwrap">
            <Dropdown
              label="Sub Product Line"
              pick="single choice"
              placeholder="Select a sub product line"
              options={line.subLines}
              selected={sub ? [sub] : []}
              multi={false}
              open={openField === "sub"}
              onToggle={() => setOpenField((p) => (p === "sub" ? null : "sub"))}
              onPick={(v) => { setSub(v); setOpenField(null); }}
            />
          </div>

          {dims.length === 0 ? (
            <div className="pc-empty">
              No category dimensions are defined for <strong>{line.name}</strong> yet. In the master taxonomy this line
              carries sub product lines only — add dimensions here when the spec is ready.
            </div>
          ) : (
            <div className="pc-fields">
              {dims.map((dim) => (
                <Dropdown
                  key={dim}
                  label={dim}
                  pick="multiple choice"
                  placeholder="Select options"
                  options={line.categories[dim]}
                  selected={cats[dim] || []}
                  multi
                  open={openField === "d:" + dim}
                  onToggle={() => setOpenField((p) => (p === "d:" + dim ? null : "d:" + dim))}
                  onPick={(v) => toggleCat(dim, v)}
                  onRemove={(v) => toggleCat(dim, v)}
                />
              ))}
            </div>
          )}
        </section>

        {/* RIGHT — spec record + library */}
        <aside className="pc-aside">
          <div className="pc-spec">
            <p className="pc-speclabel">Classification code</p>
            <div className="pc-code">
              {code.head}
              {code.parts.length > 0 && " / "}
              {code.parts.map((p, i) => {
                const [d, v] = p.split(":");
                return (<span key={i}>{i > 0 && " · "}<span className="pc-codedim">{d}</span>:{v}</span>);
              })}
            </div>

            <div className="pc-meter">
              <div className="pc-meterfill" style={{ width: pct + "%", background: line.color }} />
            </div>
            <div className="pc-metertx">
              {dims.length === 0 ? (sub ? "Sub line set" : "No sub line selected") : `${tagged} / ${dims.length} dimensions tagged`}
            </div>

            <div style={{ marginTop: 14 }}>
              <div className="pc-specrow">
                <span className="pc-speck">Line</span>
                <span className="pc-specv">{line.name}</span>
              </div>
              <div className="pc-specrow">
                <span className="pc-speck">Sub line</span>
                <span className="pc-specv" style={!sub ? { color: "#9B968C" } : undefined}>{sub || "— not set —"}</span>
              </div>
              {dims.filter((d) => cats[d] && cats[d].length).map((d) => (
                <div className="pc-specrow" key={d}>
                  <span className="pc-speck">{dimAbbr(d)}</span>
                  <span className="pc-specv">{cats[d].join(", ")}</span>
                </div>
              ))}
            </div>

            <div className="pc-actions">
              <button className="pc-btn pc-btn-primary" style={{ background: line.color }} onClick={addToLibrary} disabled={!sub}>Add to library</button>
              <button className="pc-btn pc-btn-ghost" onClick={copyJSON}>Copy JSON</button>
            </div>

            <div className="pc-json">
              <button className="pc-jsontog" onClick={() => setShowJson((v) => !v)}>{showJson ? "▾ hide json" : "▸ view json"}</button>
              {showJson && <pre className="pc-pre">{JSON.stringify(record(), null, 2)}</pre>}
            </div>
          </div>

          <div className="pc-card pc-libcard">
            <div className="pc-libhd">
              <span className="pc-libtitle">Library</span>
              <span className="pc-libtitle">{library.length}</span>
            </div>
            {library.length === 0 ? (
              <div className="pc-libempty">Classified products land here. Add one to start a set.</div>
            ) : (
              library.map((rec) => (
                <div className="pc-libitem" key={rec.id} onClick={() => loadRecord(rec)} title="Load back into editor">
                  <span className="pc-dot" style={{ background: TAXONOMY[rec.lineKey].color }} />
                  <span className="pc-libmeta">
                    <div className="pc-libname">{rec.subProductLine}</div>
                    <div className="pc-libcode">{rec.code}</div>
                  </span>
                  <button className="pc-x" onClick={(e) => { e.stopPropagation(); removeRecord(rec.id); }} aria-label="Remove">×</button>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      {toast && <div className="pc-toast">{toast}</div>}
    </div>
  );
}
