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
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

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
    if (url) window.open(url, "_blank", "noopener");
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
      '<div class="greet">' + greeting() + '，准备出发的人 👋</div>' +
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
    view.querySelectorAll("[data-tab]").forEach(function (n) { n.addEventListener("click", function () { go(n.dataset.tab); }); });
  }

  function renderVerbal() {
    var vr = S.readiness.verbal || 0;
    var h = '<div class="sec-h" style="margin-top:6px"><div><div class="eyebrow">可扩充</div><h2 style="font-size:26px">Verbal · 英语</h2></div></div>';
    h += '<p class="muted small" style="margin:-6px 2px 4px">语言是所有人的起点——第一个被做深、也最容易扩充的赛道。按「能力」分层，未来加一门考试只是加一个 tab。</p>';
    h += '<div class="card readi fade" style="margin-top:14px"><div class="ring">' + ringSVG(vr, "var(--green)") +
      '<div class="ctr"><div class="n">' + vr + '</div><div class="l">英语度</div></div></div>' +
      '<div class="rt"><div class="h">离雅思 7.5 还有多远</div><p>每天的词量与练习都会喂给这个数字。</p></div></div>';
    h += '<div class="sec-h"><h2>模块</h2></div><div class="mods">';
    RUN.verbalModules.forEach(function (m) {
      h += '<div class="mod fade"' + (m.url ? ' data-study="verbal" data-url="' + m.url + '" style="cursor:pointer"' : '') + '>' +
        '<div class="mi">' + m.icon + '</div><div class="mm"><div class="n">' + m.name + '</div><div class="d">' + m.desc + '</div></div>' +
        '<span class="tag">' + m.tag + '</span></div>';
    });
    h += '</div>';
    h += '<div class="note fade"><b>扩充路径：</b>Verbal 之下再开 GRE / 托福 / 日语 / 西语——每个都是一个 tab、一套题、共享同一个打卡与积分骨架。</div>';
    h += '<a class="btn fade" style="margin-top:16px" href="https://ielts75.vercel.app/" target="_blank" rel="noopener">打开 Verbal 完整练习 →</a>';
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
    h += '<div class="sec-h"><h2>各赛道准备度</h2></div><div class="tracks">';
    RUN.tracks.forEach(function (t) {
      h += '<div class="trk"><div class="row"><div class="ic" style="background:' + trackGradCSS(t) + '">' + t.icon + '</div>' +
        '<div class="mid"><div class="nm">' + t.name + '</div><div class="tg">权重 ' + Math.round(t.weight * 100) + '%</div></div>' +
        '<div class="pctwrap"><div class="pct">' + (S.readiness[t.key] || 0) + '</div><div class="pl">/100</div></div></div>' +
        '<div class="barx"><i style="width:' + (S.readiness[t.key] || 0) + '%;background:' + trackGradCSS(t) + '"></i></div></div>';
    });
    h += '</div>';
    h += '<div class="note fade">润 · Rùn 是一个把英语、美国文化、Quant、技术揉进一个日常习惯的学习打卡站。每一次点开学习，都是离「能走」更近一步。</div>';
    h += '<button class="btn soft fade" id="resetBtn" style="margin-top:16px">重置我的进度</button>';
    view.innerHTML = h;
    document.getElementById("resetBtn").addEventListener("click", function () {
      if (confirm("确定重置全部进度？")) { localStorage.removeItem(KEY); S = load(); toast("已重置"); render(); }
    });
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

  // ---------- boot ----------
  render();
})();
