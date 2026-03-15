(function(){
  const STORAGE_KEY = "ZERO_QR_INTAKE_INBOX_V1";
  const REFRESH_KEY = "ZERO_EXEC_REFRESH_REQUEST";
  const TARGET_PATH = "agents/qr_intake/runtime/inbox.json";

  function byId(id){ return document.getElementById(id); }
  function safeJson(v){ try{ return JSON.stringify(v, null, 2); }catch(e){ return String(v); } }
  function nowIso(){ return new Date().toISOString(); }

  function getInbox(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return { channel:"qr_scan", version:"v1", items:[] };
      const parsed = JSON.parse(raw);
      if(!parsed || !Array.isArray(parsed.items)) return { channel:"qr_scan", version:"v1", items:[] };
      return parsed;
    }catch(e){
      console.warn("QR inbox read failed:", e);
      return { channel:"qr_scan", version:"v1", items:[] };
    }
  }

  function setInbox(data){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function setStatus(text){
    const el = byId("qrIntakeStatus");
    if(el) el.textContent = text;
  }

  function setPreview(payload){
    const el = byId("qrNormalizedPreview");
    if(el) el.textContent = safeJson(payload);
  }

  function collectForm(){
    return {
      code_value: (byId("qrCodeValue")?.value || "").trim(),
      scan_type: (byId("qrScanType")?.value || "").trim(),
      facility: (byId("qrFacility")?.value || "").trim(),
      sender: (byId("qrSender")?.value || "").trim(),
      priority: (byId("qrPriority")?.value || "normal").trim(),
      note: (byId("qrNote")?.value || "").trim()
    };
  }

  function normalizeQr(raw){
    const code = raw.code_value || "";
    const note = raw.note || "";
    const merged = (code + " " + note).toLowerCase();

    let category = "scan_event";
    let priority = raw.priority || "normal";

    if(merged.includes("quality") || merged.includes("hold")){
      category = "quality_issue";
      if(priority === "normal") priority = "high";
    }else if(merged.includes("delay") || merged.includes("late")){
      category = "delivery_delay";
      if(priority === "normal") priority = "high";
    }else if(merged.includes("machine")){
      category = "machine_event";
    }else if(merged.includes("station")){
      category = "station_event";
    }

    return {
      intake_id: "qr_" + Date.now(),
      channel: "qr_scan",
      facility: raw.facility || "Ekoten",
      target_path: TARGET_PATH,
      created_at: nowIso(),
      source: {
        sender: raw.sender,
        scan_type: raw.scan_type,
        code_value: raw.code_value,
        note: raw.note
      },
      normalized: {
        category: category,
        priority: priority,
        summary: raw.code_value || raw.note.slice(0, 100) || "QR scan captured"
      },
      flow: {
        stage: "normalized",
        preflight_ok: false,
        commit_ok: false,
        refresh_requested: false
      }
    };
  }

  function runPreflight(item){
    const issues = [];
    if(!item?.source?.code_value) issues.push("Scan value is required.");
    if(!item?.source?.sender) issues.push("Scanned By is required.");
    if(!item?.facility) issues.push("Facility is required.");
    return { ok: issues.length === 0, issues: issues };
  }

  function commitItem(item){
    const inbox = getInbox();
    inbox.items.push(item);
    inbox.last_commit_at = nowIso();
    inbox.last_commit_channel = "qr_scan";
    setInbox(inbox);
    return inbox;
  }

  function requestExecutiveRefresh(item){
    const payload = {
      requested_at: nowIso(),
      channel: "qr scan",
      reason: "qr_intake_commit",
      intake_id: item.intake_id,
      facility: item.facility,
      category: item.normalized.category
    };
    localStorage.setItem(REFRESH_KEY, JSON.stringify(payload));
  }

  function loadSample(){
    const raw = collectForm();
    const normalized = normalizeQr(raw);
    setPreview(normalized);
    setStatus("Sample loaded. Ready for preflight.");
  }

  function bind(){
    byId("btnQrLoadSample")?.addEventListener("click", function(){
      loadSample();
    });

    byId("btnQrNormalize")?.addEventListener("click", function(){
      const normalized = normalizeQr(collectForm());
      setPreview(normalized);
      setStatus("Normalized preview updated.");
    });

    byId("btnQrCommit")?.addEventListener("click", function(){
      const normalized = normalizeQr(collectForm());
      const preflight = runPreflight(normalized);

      normalized.flow.preflight_ok = preflight.ok;
      normalized.flow.stage = preflight.ok ? "preflight_ok" : "preflight_failed";
      setPreview(normalized);

      if(!preflight.ok){
        setStatus("Preflight failed:\n- " + preflight.issues.join("\n- "));
        return;
      }

      commitItem(normalized);
      normalized.flow.commit_ok = true;
      normalized.flow.stage = "committed";

      requestExecutiveRefresh(normalized);

      normalized.flow.refresh_requested = true;
      normalized.flow.stage = "refresh_requested";
      setPreview(normalized);

      setStatus(
        "Commit OK (mock local inbox)\n" +
        "Intake ID: " + normalized.intake_id + "\n" +
        "Category: " + normalized.normalized.category + "\n" +
        "Facility: " + normalized.facility
      );
    });
  }

  bind();
  loadSample();
})();