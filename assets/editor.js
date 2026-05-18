/* =========================================================================
 * editor.js
 * Firebase Auth + Realtime Database + Google Analytics + Inline Editor
 *
 * - 누구나 읽기 가능
 * - banns0104@gmail.com 로그인 시 편집 모드 진입
 * - 인라인 텍스트 편집(contenteditable + data-key)
 * - 프로젝트 카드 CRUD
 * - GA4(gtag) 자동 로드
 *
 * 의존성:
 *   - firebase-config.js (window.FIREBASE_CONFIG, window.ADMIN_EMAIL, window.GA_MEASUREMENT_ID)
 *   - firebase v10 compat scripts (HTML에서 로드)
 * =======================================================================*/

(function () {
  "use strict";

  // ---------- 0. config 검증 -------------------------------------------------
  const CFG = window.FIREBASE_CONFIG || null;
  const ADMIN = window.ADMIN_EMAIL || "banns0104@gmail.com";
  const GA_ID = window.GA_MEASUREMENT_ID || "";

  // ---------- 1. Google Analytics (gtag) -------------------------------------
  function loadGA() {
    if (!GA_ID || GA_ID.includes("REPLACE")) return;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { send_page_view: true });
  }

  function gaEvent(name, params) {
    if (window.gtag) window.gtag("event", name, params || {});
  }

  // ---------- 2. Firebase 초기화 ---------------------------------------------
  let app = null, auth = null, db = null;
  let currentUser = null;
  let isEditor = false;

  function initFirebase() {
    if (!CFG || (CFG.apiKey || "").includes("REPLACE")) {
      console.warn("[editor] firebase-config.js 가 채워지지 않아 편집기를 비활성화합니다.");
      return false;
    }
    if (typeof firebase === "undefined") {
      console.warn("[editor] firebase SDK가 로드되지 않았습니다.");
      return false;
    }
    app = firebase.initializeApp(CFG);
    auth = firebase.auth();
    db = firebase.database();
    return true;
  }

  // ---------- 3. UI: 편집기 컨트롤 ----------------------------------------
  function injectStyles() {
    const css = `
    .ed-fab{position:fixed;right:20px;bottom:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:flex-end;}
    .ed-btn{
      border:none;border-radius:50%;width:48px;height:48px;
      background:#191919;color:#fff;font-size:18px;cursor:pointer;
      box-shadow:0 4px 16px rgba(0,0,0,.18);
      display:inline-flex;align-items:center;justify-content:center;
      transition:transform .1s ease;
    }
    .ed-btn:hover{transform:translateY(-1px);}
    .ed-btn.brand{background:#3182F6;}
    .ed-btn.danger{background:#FF5050;}
    .ed-btn.ghost{background:#fff;color:#191919;border:1px solid #EEEEEE;}
    .ed-btn.lg{width:auto;border-radius:24px;padding:0 18px;font-weight:700;font-size:13px;letter-spacing:-0.02em;}
    .ed-status{
      background:#191919;color:#fff;font-size:12px;font-weight:700;
      padding:8px 14px;border-radius:16px;letter-spacing:-0.02em;
      box-shadow:0 4px 16px rgba(0,0,0,.18);
      max-width:240px;text-align:right;
    }
    .ed-status.warn{background:#FF5050;}
    .ed-status.ok{background:#10B981;}

    body.editing [data-edit]{
      outline:1px dashed rgba(49,130,246,.45);
      outline-offset:3px;
      border-radius:4px;
      cursor:text;
      transition:outline-color .15s ease;
    }
    body.editing [data-edit]:hover{ outline-color:#3182F6; outline-style:solid; }
    body.editing [data-edit]:focus{ outline:2px solid #3182F6; }
    body.editing [data-edit-array]{ position:relative; }
    body.editing .proj{ position:relative; }
    body.editing .proj .ed-card-actions{ display:flex; }
    .ed-card-actions{
      display:none;position:absolute;top:8px;right:8px;gap:4px;z-index:5;
    }
    .ed-card-actions button{
      width:26px;height:26px;border-radius:6px;border:none;
      background:#fff;color:#191919;cursor:pointer;font-size:12px;
      box-shadow:0 1px 4px rgba(0,0,0,.1);
    }
    .ed-card-actions button.danger{color:#FF5050;}

    body.editing .proj-grid::after{
      content:"+ 새 프로젝트 추가";
      grid-column:1/-1;
      display:flex;align-items:center;justify-content:center;
      padding:18px;border:2px dashed #BCBCBC;border-radius:14px;
      color:#888;font-weight:700;font-size:13px;cursor:pointer;
      transition:border-color .15s ease, color .15s ease;
    }
    body.editing .proj-grid:hover::after{ border-color:#3182F6; color:#3182F6; }

    /* 모달 */
    .ed-modal-bg{
      position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10000;
      display:none;align-items:center;justify-content:center;padding:20px;
    }
    .ed-modal-bg.show{display:flex;}
    .ed-modal{
      background:#fff;border-radius:14px;max-width:680px;width:100%;
      max-height:90vh;overflow-y:auto;padding:28px;
      font-family:'NanumGothic','Pretendard',sans-serif;letter-spacing:-0.02em;
    }
    .ed-modal h3{font-size:20px;font-weight:800;color:#191919;margin-bottom:14px;letter-spacing:-0.03em;}
    .ed-modal label{display:block;font-size:12px;font-weight:700;color:#191919;margin:14px 0 6px;}
    .ed-modal input, .ed-modal select, .ed-modal textarea{
      width:100%;border:1px solid #EEEEEE;border-radius:8px;padding:10px 12px;
      font-size:13.5px;font-family:inherit;letter-spacing:-0.02em;color:#333;
    }
    .ed-modal textarea{resize:vertical;min-height:60px;}
    .ed-modal .row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
    .ed-modal .arr-list{display:flex;flex-direction:column;gap:6px;}
    .ed-modal .arr-list .arr-row{display:flex;gap:6px;}
    .ed-modal .arr-list .arr-row input{flex:1;}
    .ed-modal .arr-list .arr-row button{width:36px;flex-shrink:0;background:#FF5050;color:#fff;border:none;border-radius:6px;cursor:pointer;}
    .ed-modal .add-btn{
      margin-top:6px;background:transparent;border:1px dashed #BCBCBC;
      padding:8px;border-radius:6px;color:#888;font-weight:700;cursor:pointer;font-size:12px;
    }
    .ed-modal .img-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;}
    .ed-modal .img-grid .img-cell{
      position:relative;border:1px solid #EEEEEE;border-radius:8px;overflow:hidden;aspect-ratio:1.4;background:#F5F5F5;
    }
    .ed-modal .img-grid img{width:100%;height:100%;object-fit:cover;}
    .ed-modal .img-grid .rm{
      position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;
      background:rgba(0,0,0,.6);color:#fff;border:none;cursor:pointer;font-size:11px;
    }
    .ed-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:24px;}
    .ed-modal-actions button{
      border:none;border-radius:8px;padding:10px 16px;font-weight:700;font-size:13px;
      font-family:inherit;cursor:pointer;letter-spacing:-0.02em;
    }
    .ed-modal-actions .save{background:#191919;color:#fff;}
    .ed-modal-actions .cancel{background:#EEEEEE;color:#333;}
    .ed-modal-actions .delete{background:#FF5050;color:#fff;margin-right:auto;}

    /* 프로젝트 상세에 들어가는 새 섹션들 (Why / KPI / 이미지) */
    .proj .why-block, .proj .kpi-block, .proj .images-block{margin-top:8px;padding-top:10px;border-top:1px dashed #EEEEEE;}
    .proj .why-block h4, .proj .kpi-block h4, .proj .images-block h4{
      font-size:12px;font-weight:800;color:#191919;margin-bottom:6px;letter-spacing:-0.02em;
    }
    .proj .why-block p{font-size:12.5px;color:#333;line-height:1.6;}
    .proj .kpi-list{list-style:none;padding:0;display:flex;flex-direction:column;gap:4px;}
    .proj .kpi-list li{
      font-size:12px;color:#10B981;font-weight:700;
      padding-left:18px;position:relative;
    }
    .proj .kpi-list li::before{content:"▲";position:absolute;left:0;font-size:10px;}
    .proj .images-block .gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
    .proj .images-block .gallery img{
      width:100%;aspect-ratio:1.4;object-fit:cover;border-radius:6px;background:#F5F5F5;cursor:zoom-in;
    }

    .ed-imglight{
      position:fixed;inset:0;background:rgba(0,0,0,.85);display:none;z-index:10001;
      align-items:center;justify-content:center;padding:24px;cursor:zoom-out;
    }
    .ed-imglight.show{display:flex;}
    .ed-imglight img{max-width:100%;max-height:100%;border-radius:8px;}

    @media print {
      .ed-fab,.ed-modal-bg,.ed-imglight{display:none !important;}
      body.editing [data-edit]{outline:none !important;}
    }
    `;
    const tag = document.createElement("style");
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  function buildFAB() {
    const fab = document.createElement("div");
    fab.className = "ed-fab";
    fab.innerHTML = `
      <div class="ed-status" id="ed-status" style="display:none;"></div>
      <button class="ed-btn brand" id="ed-login" title="편집자 로그인">✎</button>
    `;
    document.body.appendChild(fab);
    document.getElementById("ed-login").addEventListener("click", onLoginClick);

    // image lightbox
    const light = document.createElement("div");
    light.className = "ed-imglight";
    light.innerHTML = `<img alt="">`;
    light.addEventListener("click", () => light.classList.remove("show"));
    document.body.appendChild(light);
    window.__edLight = light;
  }

  function setStatus(msg, kind) {
    const el = document.getElementById("ed-status");
    if (!el) return;
    if (!msg) { el.style.display = "none"; return; }
    el.textContent = msg;
    el.className = "ed-status" + (kind ? " " + kind : "");
    el.style.display = "block";
    if (kind === "ok") setTimeout(() => { el.style.display = "none"; }, 1800);
  }

  function setEditorMode(on) {
    isEditor = on;
    document.body.classList.toggle("editing", on);
    const fab = document.querySelector(".ed-fab");
    if (!fab) return;
    if (on) {
      fab.innerHTML = `
        <div class="ed-status ok">편집 중 · ${currentUser?.email || ""}</div>
        <button class="ed-btn ghost lg" id="ed-logout">로그아웃</button>
      `;
      document.getElementById("ed-logout").addEventListener("click", () => {
        auth.signOut().then(() => location.reload());
      });
      bindInlineEditors();
      injectCardActions();
      bindGridAdd();
    } else {
      fab.innerHTML = `
        <div class="ed-status" id="ed-status" style="display:none;"></div>
        <button class="ed-btn brand" id="ed-login" title="편집자 로그인">✎</button>
      `;
      document.getElementById("ed-login").addEventListener("click", onLoginClick);
    }
  }

  // ---------- 4. Auth -------------------------------------------------------
  function onLoginClick() {
    if (!auth) return alert("Firebase 설정(firebase-config.js)이 비어있습니다.");
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then(res => { gaEvent("editor_login_attempt", { email: res.user?.email || "" }); })
      .catch(err => alert("로그인 실패: " + err.message));
  }

  function bindAuth() {
    if (!auth) return;
    auth.onAuthStateChanged(user => {
      currentUser = user;
      if (!user) { setEditorMode(false); return; }
      if (user.email !== ADMIN || !user.emailVerified) {
        alert("이 계정으로는 편집할 수 없습니다. (" + user.email + ")");
        auth.signOut();
        return;
      }
      setEditorMode(true);
      gaEvent("editor_login_ok", {});
    });
  }

  // ---------- 5. RTDB sync --------------------------------------------------
  // 이 스크립트는 다음과 같은 두 가지 동기화를 수행:
  //   (a) data-edit="path.to.key" 가 붙은 요소의 textContent 를 RTDB 값으로 덮어쓴다 (있으면)
  //   (b) data-projects-of="<companyKey>" 가 붙은 .proj-grid 안의 .proj 카드 목록을 RTDB로 동기화

  const ROOT_KEY = (document.body.dataset.docKey || "portfolio"); // "portfolio" | "resume" | "career"

  function dbRefPath(path) {
    return db.ref(ROOT_KEY + "/" + path);
  }

  function loadOverrides() {
    if (!db) return;
    db.ref(ROOT_KEY).once("value").then(snap => {
      const v = snap.val() || {};
      // (a) 인라인 텍스트
      document.querySelectorAll("[data-edit]").forEach(el => {
        const key = el.dataset.edit;
        const val = getByPath(v, key);
        if (val != null && typeof val === "string") el.textContent = val;
      });
      // (b) 프로젝트 카드
      const byCompany = {};
      Object.entries(v.projects || {}).forEach(([id, p]) => {
        if (!p) return;
        (byCompany[p.companyKey] = byCompany[p.companyKey] || []).push({ id, ...p });
      });
      document.querySelectorAll("[data-projects-of]").forEach(grid => {
        const key = grid.dataset.projectsOf;
        if (byCompany[key]) {
          // RTDB 데이터가 있으면 grid 비우고 다시 그림
          grid.innerHTML = "";
          byCompany[key].sort((a, b) => (a.order || 0) - (b.order || 0))
            .forEach(p => grid.appendChild(renderProjectCard(p)));
        }
      });
    });
  }

  function getByPath(obj, path) {
    return path.split(".").reduce((a, k) => (a == null ? a : a[k]), obj);
  }

  function setByPath(path, value) {
    return dbRefPath(path).set(value);
  }

  function bindInlineEditors() {
    document.querySelectorAll("[data-edit]").forEach(el => {
      if (el.dataset.bound) return;
      el.dataset.bound = "1";
      el.contentEditable = "true";
      el.addEventListener("blur", () => {
        const path = el.dataset.edit;
        const val = el.textContent.trim();
        setStatus("저장 중…");
        setByPath(path, val)
          .then(() => { setStatus("저장됨", "ok"); markEdited(); gaEvent("inline_edit", { key: path }); })
          .catch(err => { setStatus("저장 실패: " + err.message, "warn"); });
      });
      el.addEventListener("keydown", e => {
        if (e.key === "Escape") el.blur();
      });
    });
  }

  function markEdited() {
    if (!db || !currentUser) return;
    db.ref("meta").set({
      lastEditedAt: Date.now(),
      lastEditedBy: currentUser.email
    });
  }

  // ---------- 6. 프로젝트 카드 렌더링 + CRUD --------------------------------
  function renderProjectCard(p) {
    const wrap = document.createElement("article");
    wrap.className = "proj";
    wrap.dataset.projectId = p.id || "";

    const tagClass = ({
      NEW: "new", RENEWAL: "renewal", COLLAB: "collab",
      OPS: "ops", SYSTEM: "ops"
    })[p.tag] || "new";

    const detailItems = (p.details || []).filter(Boolean).map(d => `<li>${esc(d)}</li>`).join("");
    const kpiItems    = (p.kpi    || []).filter(Boolean).map(k => `<li>${esc(k)}</li>`).join("");
    const imgs        = (p.images || []).filter(Boolean);

    wrap.innerHTML = `
      <div class="ed-card-actions">
        <button class="edit" title="편집">✎</button>
        <button class="danger" title="삭제">🗑</button>
      </div>
      <div class="proj-top">
        <div class="proj-emoji">${esc(p.emoji || "📌")}</div>
        <span class="proj-tag ${tagClass}">${esc(p.tag || "NEW")}</span>
      </div>
      <div class="proj-title">${esc(p.title || "제목")}</div>
      <div class="proj-summary">${esc(p.summary || "")}</div>
      ${p.why ? `<div class="why-block"><h4>기획 의도 / 목적</h4><p>${esc(p.why)}</p></div>` : ""}
      ${kpiItems ? `<div class="kpi-block"><h4>달성 KPI</h4><ul class="kpi-list">${kpiItems}</ul></div>` : ""}
      ${detailItems ? `<div class="proj-detail" style="display:block;"><h4>핵심 기여</h4><ul>${detailItems}</ul>${p.resources ? `<h4>리소스</h4><ul><li>${esc(p.resources)}</li></ul>` : ""}</div>` : ""}
      ${imgs.length ? `<div class="images-block"><h4>이미지</h4><div class="gallery">${imgs.map(u => `<img src="${esc(u)}" alt="">`).join("")}</div></div>` : ""}
      <div class="proj-meta">
        <span><b>${esc(p.metaLabelLeft || "도메인")}</b> ${esc(p.metaLeft || "")}</span>
        <span><b>${esc(p.metaLabelRight || "역할")}</b> ${esc(p.metaRight || "")}</span>
      </div>
    `;
    bindCardEvents(wrap, p);
    return wrap;
  }

  function bindCardEvents(card, p) {
    // image zoom
    card.querySelectorAll(".gallery img").forEach(img => {
      img.addEventListener("click", () => {
        const lb = window.__edLight;
        lb.querySelector("img").src = img.src;
        lb.classList.add("show");
      });
    });
    // editor card actions
    const ea = card.querySelector(".ed-card-actions");
    if (ea) {
      ea.querySelector(".edit").addEventListener("click", e => {
        e.stopPropagation();
        openProjectModal(p, card);
      });
      ea.querySelector(".danger").addEventListener("click", e => {
        e.stopPropagation();
        if (!confirm("이 프로젝트를 삭제할까요?\n\n" + (p.title || ""))) return;
        dbRefPath("projects/" + p.id).remove()
          .then(() => { card.remove(); setStatus("삭제됨", "ok"); markEdited(); gaEvent("project_delete", { id: p.id }); });
      });
    }
  }

  function injectCardActions() {
    document.querySelectorAll(".proj").forEach(card => {
      if (card.querySelector(".ed-card-actions")) return;
      const id = card.dataset.projectId;
      // 정적 카드(아직 DB에 없음)는 편집 버튼 누르면 새로 만듭니다
      const ea = document.createElement("div");
      ea.className = "ed-card-actions";
      ea.innerHTML = `<button class="edit" title="편집">✎</button>${id ? `<button class="danger" title="삭제">🗑</button>` : ""}`;
      card.prepend(ea);
      ea.querySelector(".edit").addEventListener("click", e => {
        e.stopPropagation();
        const proj = scrapeStaticCard(card);
        openProjectModal(proj, card);
      });
      const dbtn = ea.querySelector(".danger");
      if (dbtn) {
        dbtn.addEventListener("click", e => {
          e.stopPropagation();
          if (!id) return;
          if (!confirm("이 프로젝트를 삭제할까요?")) return;
          dbRefPath("projects/" + id).remove()
            .then(() => { card.remove(); setStatus("삭제됨", "ok"); markEdited(); });
        });
      }
    });
  }

  function bindGridAdd() {
    document.querySelectorAll("[data-projects-of]").forEach(grid => {
      if (grid.dataset.addBound) return;
      grid.dataset.addBound = "1";
      grid.addEventListener("click", e => {
        const r = grid.getBoundingClientRect();
        const last = grid.lastElementChild;
        if (!last) return;
        // pseudo ::after 영역(grid 마지막)을 클릭한 경우만 처리
        const cy = e.clientY;
        const lastBottom = last.getBoundingClientRect().bottom;
        if (cy > lastBottom + 4 && cy < r.bottom) {
          openProjectModal({ companyKey: grid.dataset.projectsOf, tag: "NEW" }, null);
        }
      });
    });
  }

  function scrapeStaticCard(card) {
    const id = card.dataset.projectId || "";
    return {
      id,
      companyKey: card.closest("[data-projects-of]")?.dataset.projectsOf || "",
      emoji:    txt(card, ".proj-emoji"),
      tag:      txt(card, ".proj-tag"),
      title:    txt(card, ".proj-title"),
      summary:  txt(card, ".proj-summary"),
      details:  Array.from(card.querySelectorAll(".proj-detail li")).map(li => li.textContent.trim()),
      metaLeft: (card.querySelectorAll(".proj-meta span")[0]?.textContent || "").replace(/^.*?\s/, "").trim(),
      metaRight:(card.querySelectorAll(".proj-meta span")[1]?.textContent || "").replace(/^.*?\s/, "").trim(),
    };
  }
  function txt(root, sel){ return (root.querySelector(sel)?.textContent || "").trim(); }

  // ---------- 7. 프로젝트 편집 모달 -----------------------------------------
  function openProjectModal(p, sourceCard) {
    const isNew = !p.id;
    const id = p.id || ("p_" + Date.now().toString(36) + Math.random().toString(36).slice(2,6));

    let bg = document.querySelector(".ed-modal-bg");
    if (!bg) {
      bg = document.createElement("div");
      bg.className = "ed-modal-bg";
      document.body.appendChild(bg);
    }
    bg.innerHTML = `
      <div class="ed-modal" onclick="event.stopPropagation();">
        <h3>${isNew ? "새 프로젝트" : "프로젝트 편집"}</h3>
        <label>회사</label>
        <input id="m-company" value="${esc(p.companyKey || "")}" />
        <div class="row">
          <div><label>이모지</label><input id="m-emoji" value="${esc(p.emoji || "📌")}" /></div>
          <div><label>태그</label>
            <select id="m-tag">
              ${["NEW","RENEWAL","COLLAB","OPS","SYSTEM"].map(t =>
                `<option ${(p.tag||"NEW")===t?"selected":""}>${t}</option>`).join("")}
            </select>
          </div>
        </div>
        <label>제목</label>
        <input id="m-title" value="${esc(p.title || "")}" />
        <label>한줄 요약</label>
        <textarea id="m-summary">${esc(p.summary || "")}</textarea>
        <label>기획 의도 / 목적 (Why)</label>
        <textarea id="m-why" placeholder="왜 이 기획을 잡았는지, 목적과 목표">${esc(p.why || "")}</textarea>

        <label>달성 KPI <span style="color:#888;font-weight:400;">(한 줄에 하나)</span></label>
        <div id="m-kpi" class="arr-list"></div>
        <button type="button" class="add-btn" data-add="m-kpi">+ KPI 추가</button>

        <label>핵심 기여 (한 줄에 하나)</label>
        <div id="m-details" class="arr-list"></div>
        <button type="button" class="add-btn" data-add="m-details">+ 항목 추가</button>

        <div class="row">
          <div><label>도메인 라벨</label><input id="m-mleft-l" value="${esc(p.metaLabelLeft || "도메인")}" /></div>
          <div><label>도메인 값</label><input id="m-mleft" value="${esc(p.metaLeft || "")}" /></div>
        </div>
        <div class="row">
          <div><label>역할 라벨</label><input id="m-mright-l" value="${esc(p.metaLabelRight || "역할")}" /></div>
          <div><label>역할 값</label><input id="m-mright" value="${esc(p.metaRight || "")}" /></div>
        </div>
        <label>리소스 / 기간</label>
        <input id="m-resources" value="${esc(p.resources || "")}" />

        <label>이미지</label>
        <div class="img-grid" id="m-imggrid"></div>
        <div style="display:flex;gap:6px;margin-top:8px;">
          <input id="m-imgurl" placeholder="이미지 URL 붙여넣기" style="flex:1;" />
          <button type="button" class="add-btn" id="m-imgurl-add" style="margin-top:0;">URL 추가</button>
          <label class="add-btn" style="margin-top:0;cursor:pointer;">
            파일 업로드<input type="file" id="m-imgfile" accept="image/*" style="display:none;" multiple>
          </label>
        </div>
        <div style="font-size:11px;color:#888;margin-top:4px;">파일은 base64로 RTDB에 저장됩니다. 1개당 1MB 이하 권장.</div>

        <div class="ed-modal-actions">
          ${isNew ? "" : `<button type="button" class="delete">삭제</button>`}
          <button type="button" class="cancel">취소</button>
          <button type="button" class="save">저장</button>
        </div>
      </div>
    `;
    bg.classList.add("show");
    bg.onclick = () => bg.classList.remove("show");

    // initial array fields
    fillArrInputs("m-kpi",     p.kpi || []);
    fillArrInputs("m-details", p.details || []);
    bg.querySelectorAll("[data-add]").forEach(b => b.addEventListener("click", () => addArrInput(b.dataset.add)));

    // images
    const imgs = [...(p.images || [])];
    const renderImgs = () => {
      const g = document.getElementById("m-imggrid");
      g.innerHTML = imgs.map((u, i) =>
        `<div class="img-cell"><img src="${esc(u)}"><button class="rm" data-i="${i}">×</button></div>`).join("");
      g.querySelectorAll(".rm").forEach(btn => btn.addEventListener("click", e => {
        imgs.splice(+e.target.dataset.i, 1); renderImgs();
      }));
    };
    renderImgs();
    document.getElementById("m-imgurl-add").addEventListener("click", () => {
      const v = document.getElementById("m-imgurl").value.trim();
      if (v) { imgs.push(v); document.getElementById("m-imgurl").value = ""; renderImgs(); }
    });
    document.getElementById("m-imgfile").addEventListener("change", async e => {
      for (const f of e.target.files) {
        try {
          const dataUrl = await readFileAsDataURL(f);
          if (dataUrl.length > 1.5 * 1024 * 1024) {
            alert("이미지가 너무 큽니다 (1MB 이하 권장): " + f.name);
            continue;
          }
          imgs.push(dataUrl);
        } catch (err) { console.error(err); }
      }
      renderImgs();
    });

    // buttons
    bg.querySelector(".cancel").onclick = () => bg.classList.remove("show");
    bg.querySelector(".save").onclick = () => {
      const data = {
        companyKey: val("m-company"),
        emoji:      val("m-emoji"),
        tag:        val("m-tag"),
        title:      val("m-title"),
        summary:    val("m-summary"),
        why:        val("m-why"),
        kpi:        readArrInputs("m-kpi"),
        details:    readArrInputs("m-details"),
        metaLabelLeft:  val("m-mleft-l"),
        metaLeft:       val("m-mleft"),
        metaLabelRight: val("m-mright-l"),
        metaRight:      val("m-mright"),
        resources:  val("m-resources"),
        images:     imgs,
        order:      p.order ?? Date.now()
      };
      setStatus("저장 중…");
      dbRefPath("projects/" + id).set(data)
        .then(() => {
          setStatus("저장됨", "ok"); markEdited();
          gaEvent(isNew ? "project_create" : "project_update", { id });
          bg.classList.remove("show");
          // Re-render: easiest is full reload of overrides for that grid
          const grid = document.querySelector(`[data-projects-of="${data.companyKey}"]`);
          if (grid) {
            const newCard = renderProjectCard({ id, ...data });
            if (sourceCard) sourceCard.replaceWith(newCard);
            else grid.appendChild(newCard);
            injectCardActions();
          } else {
            location.reload();
          }
        })
        .catch(err => { setStatus("저장 실패: " + err.message, "warn"); });
    };
    const dbtn = bg.querySelector(".delete");
    if (dbtn) dbtn.onclick = () => {
      if (!confirm("이 프로젝트를 삭제할까요?")) return;
      dbRefPath("projects/" + id).remove()
        .then(() => { bg.classList.remove("show"); sourceCard?.remove(); setStatus("삭제됨", "ok"); markEdited(); });
    };
  }

  function val(id){ return document.getElementById(id).value.trim(); }
  function fillArrInputs(containerId, arr) {
    const c = document.getElementById(containerId);
    c.innerHTML = "";
    if (!arr || !arr.length) addArrInput(containerId);
    else arr.forEach(v => addArrInput(containerId, v));
  }
  function addArrInput(containerId, value) {
    const c = document.getElementById(containerId);
    const row = document.createElement("div");
    row.className = "arr-row";
    row.innerHTML = `<input value="${esc(value || "")}"><button type="button">×</button>`;
    row.querySelector("button").addEventListener("click", () => row.remove());
    c.appendChild(row);
  }
  function readArrInputs(containerId) {
    return [...document.querySelectorAll("#" + containerId + " input")]
      .map(i => i.value.trim()).filter(Boolean);
  }
  function readFileAsDataURL(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  function esc(s){
    return String(s == null ? "" : s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }

  // ---------- 8. boot -------------------------------------------------------
  function boot() {
    loadGA();
    injectStyles();
    buildFAB();
    if (initFirebase()) {
      bindAuth();
      loadOverrides();
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
