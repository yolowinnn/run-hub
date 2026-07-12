/* data.js — 润 Hub 的赛道、奖励、联赛配置 */
window.RUN = {
  // 四条赛道 —— 卡片点开跳到真正的线上站
  tracks: [
    {
      key: "verbal",
      name: "Verbal · 英语",
      tagline: "背单词 · 雅思听说读写",
      icon: "🗣️",
      grad: ["#2a9d4e", "#14b062"],
      url: "https://ielts75.vercel.app/",
      weight: 0.30,
      why: "出国的第一道线——过语言关。",
      internal: true, // 有独立 Verbal 界面
    },
    {
      key: "culture",
      name: "Culture · 美国文化",
      tagline: "K–12 常识 · 落地融入",
      icon: "🏛️",
      grad: ["#c8952f", "#e0af3f"],
      url: "https://homeroom-orcin.vercel.app/",
      weight: 0.20,
      why: "听懂他们的梗，才算真的到了。",
    },
    {
      key: "quant",
      name: "Quant · 量化",
      tagline: "绿皮书 · AI/ML 面试",
      icon: "📈",
      grad: ["#0f6f3c", "#0a8d4e"],
      url: "https://quant-ai-prep.vercel.app/",
      weight: 0.30,
      why: "海外金融/AI 岗的敲门砖。",
    },
    {
      key: "tech",
      name: "Tech · Life",
      tagline: "技术 · 音乐与生活力",
      icon: "🎹",
      grad: ["#0d9488", "#2dd4bf"],
      url: "https://chordscribe-lake.vercel.app/",
      weight: 0.20,
      why: "硬技能之外，也留一点让生活发光的东西。",
    },
  ],

  // Verbal 子模块
  verbalModules: [
    { icon: "🔁", name: "词汇 · SRS", desc: "间隔重复背单词，闪卡 + 例句。", tag: "342 词", url: "https://ielts75.vercel.app/" },
    { icon: "🎧", name: "听 · 读 · 写", desc: "雅思四项模块化练习。", tag: "8 周计划", url: "https://ielts75.vercel.app/" },
    { icon: "🗣️", name: "口语 · AI 反馈", desc: "GPT 即时批改打分（杀手锏）。", tag: "GPT", url: "https://ielts75.vercel.app/" },
    { icon: "➕", name: "未来扩充", desc: "GRE / 托福 / 日语 / 西语——加个 tab 就行。", tag: "Roadmap", url: null },
  ],

  // 奖励商店（润豆兑换）
  rewards: [
    { icon: "🔓", name: "进阶题库解锁", cost: 300, kind: "内容", desc: "Quant elite 题 / 雅思真题 mock" },
    { icon: "🛡️", name: "护火符 ×1", cost: 150, kind: "道具", desc: "跳过一天不断火苗" },
    { icon: "✨", name: "限定火苗皮肤", cost: 500, kind: "皮肤", desc: "点亮你的连胜特效" },
    { icon: "🎟️", name: "抽奖券 ×1", cost: 400, kind: "权益", desc: "雅思考试费返现 / 网课 / 书" },
  ],

  // 联赛段位
  leagues: [
    { m: "🥉", name: "青铜", en: "Bronze" },
    { m: "🥈", name: "白银", en: "Silver" },
    { m: "🥇", name: "黄金", en: "Gold" },
    { m: "💠", name: "铂金", en: "Platinum" },
    { m: "💎", name: "钻石", en: "Diamond" },
  ],

  dailyGoalTracks: 3, // 一天点满 N 门才算达标、开宝箱
  beansPerCheckin: 30,
};
