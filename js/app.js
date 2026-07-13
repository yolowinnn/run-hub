/* app.js — 润 Hub 控制器：打卡、积分、准备度、联赛 */
(function () {
  var view = document.getElementById("view");
  var tabbar = document.getElementById("tabbar");
  var KEY = "run-hub:v1";

  // ---------- Store ----------
  var seed = {
    beans: 120,
    streak: 3,
    leagueXP: 640,
    lastActive: null,           // yyyy-mm-dd
    todayTracks: [],            // 今天点过的赛道
    readiness: { verbal: 62, culture: 44, quant: 53, tech: 28 },
    chestOpenedOn: null,
    profile: { name: null, avatar: "🧑🏻", authed: false },
    cfg: { lang: null, country: null, difficulty: null, dailyGoal: 3, configured: false },
    modXP: {},                  // 各内嵌模块上报累积的赚分
  };
  function todayStr() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  var S = load();
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      var s = raw ? Object.assign({}, seed, JSON.parse(raw)) : Object.assign({}, seed);
      // 跨天重置「今天点过的赛道」
      if (s.lastActive !== todayStr()) { s.todayTracks = []; }
      return s;
    } catch (e) { return Object.assign({}, seed); }
  }
  function saveLocal() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function save() { saveLocal(); if (window.RunSync && RunSync.push) RunSync.push(); }

  // ---------- 计算 ----------
  function readinessOverall() {
    var t = 0;
    RUN.tracks.forEach(function (tk) { t += (S.readiness[tk.key] || 0) * tk.weight; });
    return Math.round(t);
  }
  function goalMet() { return S.todayTracks.length >= RUN.dailyGoalTracks; }
  function leagueIndex() { return Math.min(4, Math.floor(S.leagueXP / 400)); }

  // ---------- 交互 ----------
  function study(trackKey, url) {
    // 点一门 = 去真站学 + 记一次打卡
    if (S.todayTracks.indexOf(trackKey) === -1) {
      S.todayTracks.push(trackKey);
      S.beans += RUN.beansPerCheckin;
      S.leagueXP += 20;
      S.readiness[trackKey] = Math.min(100, (S.readiness[trackKey] || 0) + 3);
      // 每天第一次活动 → 续火苗
      if (S.lastActive !== todayStr()) { S.streak += 1; }
      S.lastActive = todayStr();
      save();
      toast("＋" + RUN.beansPerCheckin + " 润豆 · " + trackName(trackKey) + " 已打卡");
      render();
    } else {
      S.lastActive = todayStr(); save();
    }
    if (url) openModule(url, trackName(trackKey));
  }
  // 统一外壳：模块在 Hub 内以内嵌 iframe 打开，不跳独立站
  function closeModule() { var m = document.getElementById("modview"); if (m) m.remove(); }
  function openModule(url, name) {
    if (!url) return;
    closeModule();
    // 把 embed=1 放到 query（# 之前），保留 hash（模块内路由用）
    var hash = "", base = url, hi = url.indexOf("#");
    if (hi > -1) { hash = url.slice(hi); base = url.slice(0, hi); }
    var sep = base.indexOf("?") > -1 ? "&" : "?";
    var src = base + sep + "embed=1" + hash;
    var el = document.createElement("div");
    el.id = "modview"; el.className = "modview";
    el.innerHTML = '<div class="modbar">' +
      '<button class="modback" aria-label="返回">‹ 返回</button>' +
      '<span class="modname">' + esc(name || "模块") + '</span>' +
      '<a class="modopen" href="' + esc(url) + '" target="_blank" rel="noopener" title="新窗口打开">↗</a></div>' +
      '<iframe class="modframe" src="' + esc(src) + '" title="' + esc(name || "模块") + '" loading="eager"></iframe>';
    document.body.appendChild(el);
    el.querySelector(".modback").addEventListener("click", closeModule);
  }
  function openChest() {
    if (!goalMet() || S.chestOpenedOn === todayStr()) return;
    var bonus = 60 + Math.floor(Math.random() * 60);
    S.beans += bonus; S.leagueXP += 40; S.chestOpenedOn = todayStr(); save();
    celebrate(); toast("🎁 今日宝箱：＋" + bonus + " 润豆！");
    render();
  }
  function redeem(name, cost) {
    if (S.beans < cost) { toast("润豆不够，去学习赚一点～"); return; }
    S.beans -= cost; save(); toast("已兑换：" + name + " 🎉"); render();
  }
  function trackName(k) { var t = RUN.tracks.find(function (x) { return x.key === k; }); return t ? t.name.split(" ")[0] : k; }

  // ---------- 渲染 ----------
  function greeting() { var h = new Date().getHours(); return h < 12 ? "早上好" : h < 18 ? "下午好" : "晚上好"; }
  function ringSVG(pct, color) {
    var r = 52, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
    return '<svg width="118" height="118" viewBox="0 0 118 118">' +
      '<circle cx="59" cy="59" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="10"/>' +
      '<circle cx="59" cy="59" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg>';
  }
  function trackGradCSS(t) { return "linear-gradient(135deg," + t.grad[0] + "," + t.grad[1] + ")"; }

  function renderOverview() {
    var ov = readinessOverall();
    var lg = RUN.leagues[leagueIndex()];
    var h = "";

    // hero
    h += '<div class="hub-hero fade">' +
      '<div class="art" style="background-image:url(assets/hero.jpg)"></div>' +
      '<div class="body">' +
      '<div class="greet">' + greeting() + '，' + esc((S.profile && S.profile.name) || "准备出发的人") + ' 👋</div>' +
      '<h1>把每天的学习，攒成出去的底气。</h1>' +
      '<div class="goalline"><span class="gchip">🔥 ' + S.streak + ' 天连胜</span>' +
      '<span class="gchip">' + (goalMet() ? "今日达标 ✅" : "今天还差 " + (RUN.dailyGoalTracks - S.todayTracks.length) + " 门") + '</span></div>' +
      '</div></div>';

    // readiness ring
    h += '<div class="card readi fade">' +
      '<div class="ring">' + ringSVG(ov, "var(--green)") + '<div class="ctr"><div class="n">' + ov + '</div><div class="l">润力值</div></div></div>' +
      '<div class="rt"><div class="h">出国准备度</div><p>四条赛道加权合成——这是你最想晒、也最想被超过的那个数字。</p>' +
      '<div class="breakdown">' + RUN.tracks.map(function (t) {
        return '<div class="bd" title="' + t.name + '"><i style="width:' + (S.readiness[t.key] || 0) + '%;background:' + t.grad[0] + '"></i></div>';
      }).join("") + '</div></div></div>';

    // daily chest
    var gp = Math.min(100, Math.round(S.todayTracks.length / RUN.dailyGoalTracks * 100));
    var chestDone = S.chestOpenedOn === todayStr();
    h += '<div class="chest fade"><span class="em">' + (chestDone ? "✅" : "🎁") + '</span>' +
      '<div class="m"><div class="t">每日宝箱 · 四门点满就开</div><div class="s">' + S.todayTracks.length + " / " + RUN.dailyGoalTracks + ' 门 —— 逼自己雨露均沾</div>' +
      '<div class="cbar"><i style="width:' + gp + '%"></i></div></div>' +
      '<button id="chestBtn"' + (goalMet() && !chestDone ? "" : " disabled") + '>' + (chestDone ? "已开箱" : goalMet() ? "开箱" : "去学习") + '</button></div>';

    // tracks
    h += '<div class="sec-h"><h2>今日功课</h2><span class="faint small">点开＝去学 ＋打卡</span></div>';
    h += '<div class="tracks">';
    RUN.tracks.forEach(function (t) {
      var done = S.todayTracks.indexOf(t.key) !== -1;
      h += '<div class="trk fade" data-study="' + t.key + '" data-url="' + t.url + '">' +
        '<div class="row"><div class="ic" style="background:' + trackGradCSS(t) + '">' + t.icon + '</div>' +
        '<div class="mid"><div class="nm">' + t.name + (t.internal ? ' <span class="go">· 有 Verbal 界面</span>' : '') + (done ? ' <span class="go">✅ 今日已打卡</span>' : '') + '</div>' +
        '<div class="tg">' + t.tagline + '</div></div>' +
        '<div class="pctwrap"><div class="pct">' + (S.readiness[t.key] || 0) + '</div><div class="pl">准备度</div></div></div>' +
        '<div class="barx"><i style="width:' + (S.readiness[t.key] || 0) + '%;background:' + trackGradCSS(t) + '"></i></div>' +
        '<div class="why">' + t.why + '</div></div>';
    });
    h += '</div>';

    // 全部模块目录（总入口）
    h += moduleDirHTML();

    // league
    h += '<div class="sec-h"><h2>本周联赛</h2><span class="lnk" data-tab="rewards">奖励 →</span></div>';
    h += '<div class="card league fade"><span class="medal">' + lg.m + '</span>' +
      '<div class="lm"><div class="t">' + lg.name + ' 联赛 · ' + lg.en + '</div>' +
      '<div class="s">本周 XP ' + (S.leagueXP % 400) + ' / 400 —— 前 5 名升级，周日清零</div></div>' +
      '<div class="rank"><div class="n">3</div><div class="l">名次</div></div></div>';

    view.innerHTML = h;
    var cb = document.getElementById("chestBtn");
    if (cb) cb.addEventListener("click", openChest);
    bindStudy();
    bindModules();
    view.querySelectorAll("[data-tab]").forEach(function (n) { n.addEventListener("click", function () { go(n.dataset.tab); }); });
  }

  function moduleDirHTML() {
    var groups = ["出海准备", "生活 · 终身", "趣味 · 探索", "社区"];
    var h = '<div class="sec-h"><h2>全部模块</h2><span class="faint small">润 · 一个总入口</span></div>';
    groups.forEach(function (g) {
      var mods = RUN.modules.filter(function (m) { return m.group === g; });
      if (!mods.length) return;
      h += '<div class="modgroup"><div class="ph-sec" style="font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-faint);margin:14px 2px 2px">' + g + '</div><div class="modgrid">';
      mods.forEach(function (m) {
        h += '<div class="modcard' + (m.live ? "" : " soon") + '" data-mod="' + m.key + '" data-url="' + (m.url || "") + '" data-tab="' + (m.tab || "") + '" data-live="' + (m.live ? 1 : 0) + '">' +
          '<div class="mi">' + m.icon + '</div><div class="mm"><div class="mn">' + m.name + (m.live ? "" : ' <span class="soonpill">即将</span>') + '</div><div class="md">' + m.desc + '</div></div></div>';
      });
      h += '</div></div>';
    });
    return h;
  }
  function bindModules() {
    view.querySelectorAll("[data-mod]").forEach(function (n) {
      n.addEventListener("click", function () {
        var nm = n.querySelector(".mn").textContent.replace(/即将/g, "").replace(/·.*/, "").trim();
        if (n.dataset.tab) { go(n.dataset.tab); return; }
        if (n.dataset.live === "1" && n.dataset.url) openModule(n.dataset.url, nm);
        else toast("「" + nm + "」即将上线 🌱");
      });
    });
  }

  function renderVerbal() {
    var vr = S.readiness.verbal || 0;
    var h = '<div class="sec-h" style="margin-top:6px"><div><div class="eyebrow">统一入口</div><h2 style="font-size:26px">语言</h2></div></div>';
    h += '<p class="muted small" style="margin:-6px 2px 4px">出海的第一道关。英语、法语、德语都收在这一个门里——选语种进各自的完整练习，进度与积分共用同一套骨架。</p>';
    h += '<div class="card readi fade" style="margin-top:14px"><div class="ring">' + ringSVG(vr, "var(--green)") +
      '<div class="ctr"><div class="n">' + vr + '</div><div class="l">语言度</div></div></div>' +
      '<div class="rt"><div class="h">过语言关的进度</div><p>每天的词量与练习都会喂给这个数字。</p></div></div>';
    h += '<div class="sec-h"><h2>选语种</h2></div><div class="mods">';
    RUN.verbalModules.forEach(function (m) {
      h += '<div class="mod fade"' + (m.url ? ' data-study="verbal" data-url="' + m.url + '" style="cursor:pointer"' : '') + '>' +
        '<div class="mi">' + m.icon + '</div><div class="mm"><div class="n">' + m.name + '</div><div class="d">' + m.desc + '</div></div>' +
        '<span class="tag">' + m.tag + '</span></div>';
    });
    h += '</div>';
    h += '<div class="note fade"><b>扩充路径：</b>再开 GRE / 托福 / 日语 / 西语——每个都是一个语种卡，一套题，共享同一个打卡与积分骨架。</div>';
    view.innerHTML = h;
    bindStudy();
  }

  function renderRewards() {
    var h = '<div class="sec-h" style="margin-top:6px"><div><div class="eyebrow">学习换东西</div><h2 style="font-size:26px">奖励</h2></div>' +
      '<div class="pillstat" style="align-self:center">🫘 <b>' + S.beans + '</b></div></div>';
    h += '<p class="muted small" style="margin:-6px 2px 4px">润豆可花：解锁内容 → 道具皮肤 → 真实权益（考试费返现/抽奖）。学得越勤，赢得越多。</p>';
    h += '<div class="sec-h"><h2>润豆商店</h2></div><div class="store">';
    RUN.rewards.forEach(function (r) {
      var ok = S.beans >= r.cost;
      h += '<div class="rw fade"><div class="e">' + r.icon + '</div><div class="n">' + r.name + '</div><div class="d">' + r.desc + '</div>' +
        '<div class="kind">' + r.kind + '</div>' +
        '<button data-redeem="' + r.name + '" data-cost="' + r.cost + '"' + (ok ? "" : " disabled") + '>🫘 ' + r.cost + '</button></div>';
    });
    h += '</div>';
    h += '<div class="sec-h"><h2>段位联赛</h2></div>';
    h += '<div class="card league fade"><span class="medal">' + RUN.leagues[leagueIndex()].m + '</span>' +
      '<div class="lm"><div class="t">你在 ' + RUN.leagues[leagueIndex()].name + ' 联赛</div><div class="s">每周和 30 人比 XP，升有降，周日清零——保级比任何 push 都好使。</div></div>' +
      '<div class="rank"><div class="n">3</div><div class="l">名次</div></div></div>';
    h += '<div class="ladder">';
    RUN.leagues.forEach(function (l, i) {
      h += '<div class="rung' + (i === leagueIndex() ? " on" : "") + '"><div class="m">' + l.m + '</div><div class="t">' + l.name + '</div><div class="e">' + l.en + '</div></div>';
    });
    h += '</div>';
    h += '<div class="note fade"><b>王炸 · 润学基金：</b>每月拿一笔预算，公开赞助最努力的几位学习者的考试费——「靠学习赢一次真正的资助」，是能上小红书热搜的故事。</div>';
    view.innerHTML = h;
    view.querySelectorAll("[data-redeem]").forEach(function (n) {
      n.addEventListener("click", function () { redeem(n.dataset.redeem, +n.dataset.cost); });
    });
  }

  function renderMe() {
    var ov = readinessOverall();
    var learned = Object.values(S.readiness).reduce(function (a, b) { return a + b; }, 0);
    var h = '<div class="sec-h" style="margin-top:6px"><h2 style="font-size:26px">我的</h2></div>';
    h += '<div class="stat-grid fade">' +
      '<div class="stat"><div class="n">🔥 ' + S.streak + '</div><div class="l">连续打卡</div></div>' +
      '<div class="stat"><div class="n">' + ov + '</div><div class="l">润力值</div></div>' +
      '<div class="stat"><div class="n">🫘 ' + S.beans + '</div><div class="l">润豆</div></div>' +
      '<div class="stat"><div class="n">' + S.leagueXP + '</div><div class="l">总 XP</div></div></div>';
    // 账号 + 跨端同步
    if (window.RunSync && RunSync.configured()) {
      var u = RunSync.currentUser && RunSync.currentUser();
      h += '<div class="sec-h"><h2>账号</h2><span id="syncbadge" class="faint small">' + syncLabel(syncStatus) + '</span></div>';
      h += '<div class="card acct fade">';
      if (u && !u.isAnonymous) h += '<div class="acct-m"><div class="t">' + esc(u.email || S.profile.name || "已登录") + '</div><div class="s">润豆与进度已跨端同步 · 换设备登录同一账号即可恢复</div></div><button class="btn soft" id="signout">退出登录</button>';
      else if (u && u.isAnonymous) h += '<div class="acct-m"><div class="t">访客模式</div><div class="s">用 Google 登录，换设备也能同步、清缓存也不丢进度</div></div><button class="btn" id="signin-g">用 Google 登录</button>';
      else h += '<div class="acct-m"><div class="t">未登录</div><div class="s">登录后润豆与各模块进度跨端同步</div></div><button class="btn" id="signin-g">用 Google 登录</button>';
      h += '</div>';
    }
    h += '<div class="sec-h"><h2>各赛道准备度</h2></div><div class="tracks">';
    RUN.tracks.forEach(function (t) {
      h += '<div class="trk"><div class="row"><div class="ic" style="background:' + trackGradCSS(t) + '">' + t.icon + '</div>' +
        '<div class="mid"><div class="nm">' + t.name + '</div><div class="tg">权重 ' + Math.round(t.weight * 100) + '%</div></div>' +
        '<div class="pctwrap"><div class="pct">' + (S.readiness[t.key] || 0) + '</div><div class="pl">/100</div></div></div>' +
        '<div class="barx"><i style="width:' + (S.readiness[t.key] || 0) + '%;background:' + trackGradCSS(t) + '"></i></div></div>';
    });
    h += '</div>';
    h += '<div class="sec-h"><h2>配置</h2><span class="faint small">默认可改</span></div>';
    h += settingsHTML();
    h += '<div class="note fade" style="margin-top:14px">润 · Rùn 是一个把语言、文化、Quant、技术、身心揉进一个日常习惯的学习打卡站。每一次点开学习，都是离「能走」更近一步。</div>';
    h += '<button class="btn soft fade" id="reonbBtn" style="margin-top:16px">重新做引导配置</button>';
    h += '<button class="btn soft fade" id="wipeBtn" style="margin-top:10px;color:var(--ink-faint);border-color:var(--line)">重置全部进度</button>';
    view.innerHTML = h;
    bindSettings();
    var so = document.getElementById("signout"); if (so) so.addEventListener("click", function () { RunSync.signOut().then(function () { toast("已退出登录"); setTimeout(function () { location.reload(); }, 400); }); });
    var sg = document.getElementById("signin-g"); if (sg) sg.addEventListener("click", function () { toast("正在打开 Google 登录…"); RunSync.signInGoogle().then(function () { render(); }).catch(function (e) { toast(authErr(e)); }); });
    document.getElementById("reonbBtn").addEventListener("click", function () { showOnboarding(true); });
    document.getElementById("wipeBtn").addEventListener("click", function () {
      if (confirm("确定重置全部进度？")) { localStorage.removeItem(KEY); S = load(); toast("已重置"); location.reload(); }
    });
  }

  // ---------- 配置 / 设置 ----------
  function langName(k) { var l = RUN.languages.find(function (x) { return x.key === k; }); return l ? l.flag + " " + l.name : "未设"; }
  function diffName(k) { var d = RUN.difficulties.find(function (x) { return x.key === k; }); return d ? d.name : "未设"; }
  function countryName(k) { var c = RUN.countries.find(function (x) { return x.key === k; }); return c ? c.flag + " " + c.name : "未设"; }
  function settingsHTML() {
    var c = S.cfg;
    var h = '<div class="setblock fade">';
    // 语言
    h += '<div class="setrow"><div class="k">学习语言<small>选定即默认</small></div><div class="chips">' +
      RUN.languages.map(function (l) {
        return '<button class="chip2 ' + (c.lang === l.key ? "on" : "") + (l.ready ? "" : " lock") + '" data-set="lang" data-v="' + l.key + '"' + (l.ready ? "" : " disabled") + '>' + l.flag + " " + l.name + '</button>';
      }).join("") + '</div></div>';
    // 难度
    h += '<div class="setrow"><div class="k">难度档位<small>覆盖入门→高阶</small></div><div class="chips">' +
      RUN.difficulties.map(function (d) {
        return '<button class="chip2 ' + (c.difficulty === d.key ? "on" : "") + '" data-set="difficulty" data-v="' + d.key + '">' + d.name + '</button>';
      }).join("") + '</div></div>';
    // 国家/文化
    h += '<div class="setrow"><div class="k">目标国家 / 文化<small>默认文化跟着走</small></div><div class="chips">' +
      RUN.countries.map(function (co) {
        return '<button class="chip2 ' + (c.country === co.key ? "on" : "") + '" data-set="country" data-v="' + co.key + '">' + co.flag + " " + co.name + '</button>';
      }).join("") + '</div></div>';
    // 每日目标
    h += '<div class="setrow"><div class="k">每日目标<small>点满几门算达标</small></div><div class="chips">' +
      [2, 3, 4].map(function (n) {
        return '<button class="chip2 ' + (c.dailyGoal === n ? "on" : "") + '" data-set="dailyGoal" data-v="' + n + '">' + n + ' 门</button>';
      }).join("") + '</div></div>';
    h += '</div>';
    return h;
  }
  function bindSettings() {
    view.querySelectorAll("[data-set]").forEach(function (n) {
      n.addEventListener("click", function () {
        if (n.disabled) return;
        var key = n.dataset.set, v = n.dataset.v;
        if (key === "dailyGoal") { S.cfg.dailyGoal = +v; RUN.dailyGoalTracks = +v; }
        else S.cfg[key] = v;
        S.cfg.configured = true;
        save(); toast("已更新配置"); render();
      });
    });
  }

  // ---------- 引导配置 onboarding ----------
  function showOnboarding(force) {
    if (document.getElementById("onb")) return;
    var pick = { lang: S.cfg.lang, country: S.cfg.country };
    var ans = [];           // placement answers
    var step = 0;           // 0 lang, 1 country, 2..(2+n-1) placement, last: result
    var P = RUN.placement, nP = P.length;
    var box = document.createElement("div");
    box.id = "onb"; box.className = "onb";
    document.body.appendChild(box);

    function recDifficulty() {
      var correct = ans.reduce(function (a, ok) { return a + (ok ? 1 : 0); }, 0);
      return correct <= 1 ? "starter" : correct === 2 ? "basic" : correct <= 4 ? "adv" : "elite";
    }
    function close() { box.remove(); }
    function finish() {
      S.cfg.lang = pick.lang || "en";
      S.cfg.country = pick.country || "us";
      S.cfg.difficulty = recDifficulty();
      S.cfg.configured = true;
      save(); close(); toast("配置完成，开学！🌱"); render();
    }
    function paint() {
      var totalSteps = 2 + nP; // lang + country + placement
      var prog = Math.round((step / (totalSteps)) * 100);
      var h = '<div class="onb-in">';
      h += '<div class="prog"><i style="width:' + prog + '%"></i></div>';

      if (step === 0) {
        h += '<div class="step-n">Step 1 · 语言</div><h2>你想学哪门语言？</h2><div class="sub">选定后成为默认，之后可在设置里改。</div><div class="opts">';
        RUN.languages.forEach(function (l) {
          h += '<button class="obtn ' + (pick.lang === l.key ? "sel" : "") + (l.ready ? "" : " dim") + '" data-lang="' + l.key + '"><span class="big">' + l.flag + '</span> ' + l.name + '<span class="sm">' + (l.ready ? l.tagline : "即将上线") + '</span></button>';
        });
        h += '</div><button class="cta" id="next"' + (pick.lang ? "" : " disabled") + '>下一步</button>';
      } else if (step === 1) {
        h += '<div class="step-n">Step 2 · 目标国家</div><h2>想润去哪？</h2><div class="sub">文化模块会默认跟着你的目标国家走。</div><div class="opts">';
        RUN.countries.forEach(function (c) {
          h += '<button class="obtn ' + (pick.country === c.key ? "sel" : "") + '" data-country="' + c.key + '"><span class="big">' + c.flag + '</span> ' + c.name + '</button>';
        });
        h += '</div><button class="cta" id="next"' + (pick.country ? "" : " disabled") + '>做个分级测试 →</button>';
      } else if (step >= 2 && step < 2 + nP) {
        var qi = step - 2, Q = P[qi];
        h += '<div class="step-n">分级测试 · ' + (qi + 1) + " / " + nP + '</div><h2 style="font-size:22px">测一下水平</h2><div class="qtext">' + esc(Q.q) + '</div><div class="opts">';
        Q.opts.forEach(function (o, oi) {
          h += '<button class="obtn" data-opt="' + oi + '">' + esc(o) + '</button>';
        });
        h += '</div>';
      } else {
        var d = RUN.difficulties.find(function (x) { return x.key === recDifficulty(); });
        h += '<div class="step-n">完成</div><h2>给你配好了</h2>' +
          '<div class="result-ring"><div class="big">' + d.name + '</div><div class="sub">' + d.en + " · " + d.desc + '</div></div>' +
          '<div class="opts" style="margin-top:8px">' +
          '<div class="obtn" style="cursor:default"><span class="big">' + (RUN.languages.find(function (x) { return x.key === (pick.lang || "en"); }) || {}).flag + '</span> ' + (RUN.languages.find(function (x) { return x.key === (pick.lang || "en"); }) || {}).name + '<span class="sm">语言</span></div>' +
          '<div class="obtn" style="cursor:default"><span class="big">' + (RUN.countries.find(function (x) { return x.key === (pick.country || "us"); }) || {}).flag + '</span> ' + (RUN.countries.find(function (x) { return x.key === (pick.country || "us"); }) || {}).name + '<span class="sm">目标</span></div>' +
          '</div><button class="cta" id="done">进入润 · 开学</button><div class="skip" id="tweak">难度不对？进去后可在设置里改</div>';
      }
      h += (step < 2 + nP && !force ? '' : '');
      if (step === 0) h += '<div class="skip" id="skip">先跳过，用默认配置</div>';
      h += '</div>';
      box.innerHTML = h;

      // bind
      box.querySelectorAll("[data-lang]").forEach(function (n) { n.addEventListener("click", function () { pick.lang = n.dataset.lang; paint(); }); });
      box.querySelectorAll("[data-country]").forEach(function (n) { n.addEventListener("click", function () { pick.country = n.dataset.country; paint(); }); });
      box.querySelectorAll("[data-opt]").forEach(function (n) {
        n.addEventListener("click", function () {
          var qi = step - 2; ans[qi] = (+n.dataset.opt === P[qi].a); step++; paint();
        });
      });
      var nx = box.querySelector("#next"); if (nx) nx.addEventListener("click", function () { step++; paint(); });
      var dn = box.querySelector("#done"); if (dn) dn.addEventListener("click", finish);
      var sk = box.querySelector("#skip"); if (sk) sk.addEventListener("click", function () { pick.lang = pick.lang || "en"; pick.country = pick.country || "us"; ans = [true, true, false]; finish(); });
      var tw = box.querySelector("#tweak"); if (tw) tw.addEventListener("click", finish);
    }
    paint();
  }

  function bindStudy() {
    view.querySelectorAll("[data-study]").forEach(function (n) {
      n.addEventListener("click", function () { study(n.dataset.study, n.dataset.url); });
    });
  }

  // ---------- 路由 ----------
  var current = "overview";
  var R = { overview: renderOverview, verbal: renderVerbal, rewards: renderRewards, me: renderMe };
  function render() { refreshTop(); (R[current] || renderOverview)(); }
  function go(tab) {
    closeModule();
    current = tab;
    [].forEach.call(tabbar.querySelectorAll(".tab"), function (b) { b.classList.toggle("active", b.dataset.tab === tab); });
    window.scrollTo(0, 0);
    render();
  }
  function refreshTop() {
    document.querySelector("#tb-beans b").textContent = S.beans;
    document.querySelector("#tb-streak b").textContent = S.streak;
  }

  tabbar.addEventListener("click", function (e) {
    var b = e.target.closest(".tab"); if (b) go(b.dataset.tab);
  });

  // ---------- helpers ----------
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function toast(msg) {
    var host = document.getElementById("toast-host");
    host.innerHTML = '<div class="toast">' + msg + "</div>";
    clearTimeout(host._t);
    host._t = setTimeout(function () { host.innerHTML = ""; }, 2200);
  }
  function celebrate() {
    var colors = ["#2a9d4e", "#0a8d4e", "#c39430", "#e0af3f", "#14b062"];
    var box = document.createElement("div");
    box.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:300;overflow:hidden";
    for (var i = 0; i < 60; i++) {
      var b = document.createElement("div");
      b.style.cssText = "position:absolute;top:-12px;width:9px;height:14px;border-radius:2px;left:" +
        (Math.random() * 100) + "vw;background:" + colors[i % colors.length] +
        ";animation:drop " + (1.6 + Math.random() * 1.4) + "s linear forwards;transform:rotate(" + (Math.random() * 360) + "deg)";
      box.appendChild(b);
    }
    document.body.appendChild(box);
    setTimeout(function () { box.remove(); }, 3200);
  }

  // confetti keyframes (inject once)
  var st = document.createElement("style");
  st.textContent = "@keyframes drop{to{transform:translateY(110vh) rotate(600deg);opacity:.85}}";
  document.head.appendChild(st);

  // ---------- 登录 / 欢迎屏 ----------
  function showLogin() {
    if (document.getElementById("login")) return;
    var avatars = ["🧑🏻", "👩🏻", "🧑🏻‍🎓", "👨🏻‍💻", "👩🏻‍🎨", "🧑🏽", "👩🏽‍🔬", "🧑🏻‍🏫"];
    var pick = { name: S.profile.name || "", avatar: S.profile.avatar || "🧑🏻" };
    var box = document.createElement("div");
    box.id = "login"; box.className = "login"; box.style.setProperty("--login-img", "url(/assets/login.jpg)");
    function finish(name) {
      S.profile.name = ((name || pick.name || "润友") + "").trim() || "润友";
      S.profile.avatar = pick.avatar; S.profile.authed = true; save();
      box.remove(); refreshTop();
      if (!S.cfg || !S.cfg.configured) showOnboarding(false); else render();
    }
    function paint() {
      box.innerHTML = '<div class="login-card">' +
        '<div class="brand"><img src="assets/logo.png" alt=""/><b>润<span>·Rùn</span></b></div>' +
        '<h2>欢迎，准备出发的人 👋</h2>' +
        '<div class="ls">把每天的学习，攒成出去的底气。取个名、选个头像就开始。</div>' +
        '<div class="avpick">' + avatars.map(function (a) { return '<button data-av="' + a + '"' + (pick.avatar === a ? ' class="on"' : '') + '>' + a + '</button>'; }).join("") + '</div>' +
        '<input id="lname" placeholder="你的昵称" value="' + esc(pick.name) + '" maxlength="16"/>' +
        '<button class="cta" id="lstart">开始学习 →</button>' +
        '<div class="social"><button data-soc="google">🟢 Google</button><button data-soc="wechat">💬 微信</button><button data-soc="apple">🍎 Apple</button></div>' +
        '<div class="skip" id="lskip">先随便逛逛</div>' +
        '<div class="terms">继续即表示同意用户协议与隐私政策（示例）</div></div>';
      box.querySelectorAll("[data-av]").forEach(function (n) { n.addEventListener("click", function () { pick.avatar = n.dataset.av; paint(); }); });
      var inp = box.querySelector("#lname"); if (inp) inp.addEventListener("input", function () { pick.name = inp.value; });
      function doLogin(kind) {
        var nm = ((inp ? inp.value : pick.name) || "").trim();
        if (nm) S.profile.name = nm;
        S.profile.avatar = pick.avatar; saveLocal();
        if (window.RunSync && RunSync.configured()) {
          var card = box.querySelector(".login-card"); if (card) card.classList.add("busy");
          (kind === "google" ? RunSync.signInGoogle() : RunSync.signInAnon()).catch(function (e) { if (card) card.classList.remove("busy"); toast(authErr(e)); });
        } else { finish(nm); }
      }
      box.querySelector("#lstart").addEventListener("click", function () { doLogin("guest"); });
      box.querySelectorAll("[data-soc]").forEach(function (n) { n.addEventListener("click", function () { if (n.dataset.soc === "google") doLogin("google"); else toast("微信 / Apple 登录即将支持，可先用 Google 或访客进入"); }); });
      box.querySelector("#lskip").addEventListener("click", function () { doLogin("guest"); });
    }
    document.body.appendChild(box); paint();
  }

  // ---------- 账号 + 跨端同步（Firebase / RunSync）----------
  var syncStatus = "local", authFlowDone = false;
  function authErr(e) { var c = (e && (e.code || e.message)) || ""; if (/popup-closed|cancelled/i.test(c)) return "已取消登录"; if (/network/i.test(c)) return "网络不稳，稍后再试"; return "登录失败，可先用访客进入"; }
  function afterAuthSettled() {
    if (authFlowDone) return; authFlowDone = true;
    if (!S.cfg || !S.cfg.configured) { if (!document.getElementById("onb")) showOnboarding(false); }
    else render();
  }
  function onSignedIn() {
    var lg = document.getElementById("login"); if (lg) lg.remove();
    S.profile.authed = true; saveLocal(); refreshTop();
    setTimeout(afterAuthSettled, 2400); // 兜底：即使云同步失败也进主流程
  }
  function updateSyncBadge(s) { syncStatus = s; var el = document.getElementById("syncbadge"); if (el) el.textContent = syncLabel(s); }
  function syncLabel(s) { return s === "synced" ? "☁️ 已同步" : s === "syncing" ? "☁️ 同步中…" : s === "signed-in" ? "☁️ 已登录" : s === "connecting" ? "☁️ 连接中…" : s === "error" ? "⚠️ 同步失败" : "📴 本地"; }

  if (S.cfg && S.cfg.dailyGoal) RUN.dailyGoalTracks = S.cfg.dailyGoal;
  render();

  if (window.RunSync && RunSync.configured()) {
    RunSync.setStore({
      get: function () { return S; },
      apply: function (m) { Object.assign(S, m); saveLocal(); if (S.cfg && S.cfg.dailyGoal) RUN.dailyGoalTracks = S.cfg.dailyGoal; },
      rerender: function () { refreshTop(); if (!document.getElementById("onb") && !document.getElementById("login")) render(); },
      onSynced: function () { afterAuthSettled(); }
    });
    RunSync.onAuth(function (u) { if (u) onSignedIn(); else { authFlowDone = false; if (!(S.profile && S.profile.authed) && !document.getElementById("login")) showLogin(); } });
    RunSync.onStatus(updateSyncBadge);
    RunSync.init();
  } else {
    if (!S.profile || !S.profile.authed) showLogin();
    else if (!S.cfg || !S.cfg.configured) showOnboarding(false);
  }

  // 内嵌模块通过 postMessage 上报赚分 → Hub 记账并同步
  window.addEventListener("message", function (ev) {
    var d = ev.data; if (!d || d.type !== "run-points") return;
    var n = Math.max(0, Math.min(50, +d.points || 0)); if (!n) return;
    S.beans += n; S.leagueXP += Math.round(n / 2);
    if (d.source) { S.modXP = S.modXP || {}; S.modXP[d.source] = (S.modXP[d.source] || 0) + n; }
    if (S.lastActive !== todayStr()) { S.streak += 1; } S.lastActive = todayStr();
    save(); refreshTop();
  });
})();
