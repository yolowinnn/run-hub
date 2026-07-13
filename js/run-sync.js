/* run-sync.js — 润 Hub 的账号 + 跨端积分同步（Firebase Auth + Firestore runProfiles/{uid}）。
   设计：Hub 是唯一的登录+积分中枢；内嵌模块用 postMessage 上报赚分，Hub 记账并同步。
   未配置 / 离线时全部走本地，不影响使用。 */
window.RunSync = (function () {
  var SDK = "10.12.2";
  var SYNC_KEYS = ["beans", "streak", "leagueXP", "lastActive", "todayTracks", "readiness", "chestOpenedOn", "profile", "cfg", "modXP"];
  var app, auth, db, ready = false, user = null, status = "local";
  var store = null, pushTimer = null;
  var authCbs = [], statusCbs = [];

  function onAuth(fn) { authCbs.push(fn); try { fn(user); } catch (e) {} }
  function onStatus(fn) { statusCbs.push(fn); try { fn(status); } catch (e) {} }
  function setStatus(s) { status = s; statusCbs.forEach(function (fn) { try { fn(s); } catch (e) {} }); }
  function currentUser() { return user; }
  function configured() { var c = window.FIREBASE_CONFIG || {}; return !!(c.apiKey && c.projectId); }
  function setStore(s) { store = s; }

  function loadScript(src) { return new Promise(function (res, rej) { var s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  function loadSDK() {
    if (window.firebase && firebase.firestore) return Promise.resolve(true);
    var base = "https://www.gstatic.com/firebasejs/" + SDK + "/";
    return loadScript(base + "firebase-app-compat.js")
      .then(function () { return loadScript(base + "firebase-auth-compat.js"); })
      .then(function () { return loadScript(base + "firebase-firestore-compat.js"); })
      .then(function () { return !!(window.firebase && firebase.firestore); });
  }

  function init() {
    if (!configured()) { setStatus("local"); return Promise.resolve(); }
    setStatus("connecting");
    return loadSDK().then(function (ok) {
      if (!ok) throw new Error("SDK load failed");
      app = firebase.initializeApp(window.FIREBASE_CONFIG);
      auth = firebase.auth(); db = firebase.firestore();
      ready = true;
      auth.onAuthStateChanged(function (u) {
        user = u; authCbs.forEach(function (fn) { try { fn(u); } catch (e) {} });
        if (u) { setStatus("syncing"); pullMergePush(u.uid); }
        else setStatus("local");
      });
      document.addEventListener("visibilitychange", function () { if (!document.hidden && user) pull(user.uid); });
      // 处理 redirect 登录返回
      try { auth.getRedirectResult().catch(function () {}); } catch (e) {}
    }).catch(function (e) { console.warn("RunSync init failed, 仅本地", e); setStatus("error"); });
  }

  function ensure() { return ready ? Promise.resolve(true) : init().then(function () { return ready; }); }

  function signInGoogle() {
    return ensure().then(function () {
      if (!auth) throw new Error("no-auth");
      var provider = new firebase.auth.GoogleAuthProvider();
      var cu = auth.currentUser;
      function popupOrRedirect(e) { if (e && /popup/i.test(e.code || e.message || "")) return auth.signInWithRedirect(provider); throw e; }
      if (cu && cu.isAnonymous) {
        // 访客升级为 Google，保留 uid 与已攒进度
        return cu.linkWithPopup(provider).catch(function (e) {
          if (e && /credential-already-in-use|email-already-in-use/i.test(e.code || "")) return auth.signInWithPopup(provider);
          return popupOrRedirect(e);
        });
      }
      return auth.signInWithPopup(provider).catch(popupOrRedirect);
    });
  }
  function signInAnon() { return ensure().then(function () { if (!auth) throw new Error("no-auth"); return auth.signInAnonymously(); }); }
  function signOut() { return auth ? auth.signOut() : Promise.resolve(); }

  function docRef(uid) { return db.collection("runProfiles").doc(uid); }
  function pickState() { var st = store && store.get ? store.get() : {}, o = {}; SYNC_KEYS.forEach(function (k) { if (st[k] !== undefined) o[k] = st[k]; }); return o; }

  function pull(uid) {
    if (!db || !store) return Promise.resolve();
    setStatus("syncing");
    return docRef(uid).get().then(function (snap) {
      if (snap.exists) { var remote = parse(snap.data()); store.apply(merge(pickState(), remote)); if (store.rerender) store.rerender(); }
      setStatus("synced");
    }).catch(function (e) { console.warn("pull", e); setStatus("error"); });
  }
  function pullMergePush(uid) {
    if (!db || !store) return Promise.resolve();
    setStatus("syncing");
    return docRef(uid).get().then(function (snap) {
      var local = pickState();
      var merged = snap.exists ? merge(local, parse(snap.data())) : local;
      store.apply(merged); if (store.rerender) store.rerender(); if (store.onSynced) store.onSynced();
      return writeNow();
    }).then(function () { setStatus("synced"); }).catch(function (e) { console.warn("pullMergePush", e); setStatus("error"); });
  }
  function writeNow() {
    if (!db || !user) return Promise.resolve();
    var st = store && store.get ? store.get() : {};
    return docRef(user.uid).set({ json: JSON.stringify(pickState()), updatedAt: Date.now(), email: (user.email || ""), name: (st.profile && st.profile.name) || "" });
  }
  function push() { if (!user) return; clearTimeout(pushTimer); pushTimer = setTimeout(function () { setStatus("syncing"); writeNow().then(function () { setStatus("synced"); }).catch(function () { setStatus("error"); }); }, 1400); }

  function parse(d) { try { return d && d.json ? JSON.parse(d.json) : (d || {}); } catch (e) { return {}; } }
  function num(x) { return typeof x === "number" && isFinite(x) ? x : 0; }
  function laterStr(x, y) { if (!x) return y; if (!y) return x; return x > y ? x : y; }
  function mergeReadiness(a, b) { a = a || {}; b = b || {}; var o = {}, keys = {}; Object.keys(a).forEach(function (k) { keys[k] = 1; }); Object.keys(b).forEach(function (k) { keys[k] = 1; }); Object.keys(keys).forEach(function (k) { o[k] = Math.max(num(a[k]), num(b[k])); }); return o; }
  function mergeXP(a, b) { a = a || {}; b = b || {}; var o = {}, keys = {}; Object.keys(a).forEach(function (k) { keys[k] = 1; }); Object.keys(b).forEach(function (k) { keys[k] = 1; }); Object.keys(keys).forEach(function (k) { o[k] = Math.max(num(a[k]), num(b[k])); }); return o; }
  function mergeProfile(a, b) { a = a || {}; b = b || {}; return { name: a.name || b.name || null, avatar: a.avatar || b.avatar || "🧑🏻", authed: !!(a.authed || b.authed) }; }
  function mergeCfg(a, b) { a = a || {}; b = b || {}; return a.configured ? a : (b.configured ? b : a); }
  // 同一天则并集今日打卡，否则取 lastActive 更晚的一方
  function mergeToday(a, b) { var la = a.lastActive, lb = b.lastActive, ta = a.todayTracks || [], tb = b.todayTracks || []; if (la && lb && la === lb) { var set = {}; ta.concat(tb).forEach(function (x) { set[x] = 1; }); return Object.keys(set); } return laterStr(la, lb) === la ? ta : tb; }
  function merge(a, b) {
    a = a || {}; b = b || {};
    return {
      beans: Math.max(num(a.beans), num(b.beans)),
      streak: Math.max(num(a.streak), num(b.streak)),
      leagueXP: Math.max(num(a.leagueXP), num(b.leagueXP)),
      lastActive: laterStr(a.lastActive, b.lastActive),
      todayTracks: mergeToday(a, b),
      readiness: mergeReadiness(a.readiness, b.readiness),
      chestOpenedOn: laterStr(a.chestOpenedOn, b.chestOpenedOn),
      profile: mergeProfile(a.profile, b.profile),
      cfg: mergeCfg(a.cfg, b.cfg),
      modXP: mergeXP(a.modXP, b.modXP)
    };
  }

  return { init: init, ready: function () { return ready; }, configured: configured, onAuth: onAuth, onStatus: onStatus, currentUser: currentUser, setStore: setStore, signInGoogle: signInGoogle, signInAnon: signInAnon, signOut: signOut, push: push, pull: function () { return user ? pull(user.uid) : Promise.resolve(); } };
})();
