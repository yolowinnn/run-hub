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
      url: "https://chordscribe-app-coral.vercel.app/",
      weight: 0.20,
      why: "硬技能之外，也留一点让生活发光的东西。",
    },
  ],

  // 统一「语言」入口 —— 一个门里选语种，各自进对应的完整练习
  verbalModules: [
    { icon: "🇬🇧", name: "英语 · 雅思 / 托福", desc: "词汇 SRS · 听说读写 · 口语 AI 批改。", tag: "完整", url: "https://ielts75.vercel.app/" },
    { icon: "🇫🇷", name: "法语 · A1–C1", desc: "词汇闪卡 · 情景对话 · 听力 · 练习。", tag: "已上线", url: "https://run-lang.vercel.app/#fr" },
    { icon: "🇩🇪", name: "德语 · A1–C1", desc: "词汇闪卡 · 情景对话 · 听力 · 练习。", tag: "已上线", url: "https://run-lang.vercel.app/#de" },
    { icon: "➕", name: "日语 / 西语 / GRE", desc: "共享同一套打卡与积分骨架，加档即可。", tag: "Roadmap", url: null },
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

  // ---- 配置：语言 / 难度 / 国家（默认可改） ----
  languages: [
    { key: "en", name: "English", flag: "🇬🇧", tagline: "雅思/托福", ready: true },
    { key: "fr", name: "Français", flag: "🇫🇷", tagline: "DELF/DALF", ready: false },
    { key: "de", name: "Deutsch", flag: "🇩🇪", tagline: "TestDaF/Goethe", ready: false },
    { key: "ja", name: "日本語", flag: "🇯🇵", tagline: "JLPT", ready: false },
    { key: "es", name: "Español", flag: "🇪🇸", tagline: "DELE", ready: false },
  ],
  difficulties: [
    { key: "starter", name: "入门", en: "Starter", desc: "零基础起步" },
    { key: "basic", name: "基础", en: "Basic", desc: "有一点底子" },
    { key: "adv", name: "进阶", en: "Advanced", desc: "中–偏高（现雅思档）" },
    { key: "elite", name: "高阶", en: "Elite", desc: "冲刺高分" },
  ],
  countries: [
    { key: "us", name: "美国", flag: "🇺🇸", lang: "en" },
    { key: "uk", name: "英国", flag: "🇬🇧", lang: "en" },
    { key: "ca", name: "加拿大", flag: "🇨🇦", lang: "en" },
    { key: "au", name: "澳大利亚", flag: "🇦🇺", lang: "en" },
    { key: "fr", name: "法国", flag: "🇫🇷", lang: "fr" },
    { key: "de", name: "德国", flag: "🇩🇪", lang: "de" },
    { key: "sg", name: "新加坡", flag: "🇸🇬", lang: "en" },
  ],
  // 5 题快速定级：难度递增，答对越多档越高
  placement: [
    { q: "Choose the correct: “She ___ to school every day.”", opts: ["go", "goes", "going", "gone"], a: 1, lv: 0 },
    { q: "“I have lived here ___ 2019.”", opts: ["since", "for", "from", "at"], a: 0, lv: 1 },
    { q: "Closest meaning of “ubiquitous”:", opts: ["rare", "everywhere", "ancient", "hidden"], a: 1, lv: 2 },
    { q: "“Had I known, I ___ differently.”", opts: ["will act", "would have acted", "act", "acted"], a: 1, lv: 2 },
    { q: "“The argument was ___; it convinced no one.”", opts: ["cogent", "specious", "lucid", "salient"], a: 1, lv: 3 },
  ],

  // ---- 全平台模块目录（总入口）。分组：出海准备 / 生活·终身 / 趣味 / 社区 ----
  modules: [
    { key: "language", icon: "🗣️", name: "语言", desc: "英语·法语·德语·分级练习", tab: "verbal", live: true, group: "出海准备" },
    { key: "culture", icon: "🏛️", name: "文化 Culture", desc: "多国文化融入", url: "https://homeroom-orcin.vercel.app/", live: true, group: "出海准备" },
    { key: "quant", icon: "📈", name: "Quant / 技术", desc: "面试硬技能", url: "https://quant-ai-prep.vercel.app/", live: true, group: "出海准备" },
    { key: "apply", icon: "🎓", name: "留学申请", desc: "选校·文书·时间线", url: "https://run-modules.vercel.app/#apply", live: true, group: "出海准备" },
    { key: "visa", icon: "🛂", name: "签证", desc: "资格自测·材料清单·倒计时·各国对比", url: "https://run-modules.vercel.app/#visa", live: true, group: "出海准备" },
    { key: "career", icon: "💼", name: "海外找工", desc: "简历·内推·身份", url: "https://run-modules.vercel.app/#career", live: true, group: "出海准备" },
    { key: "fitness", icon: "💪", name: "健身", desc: "训练·饮食·睡眠·清单", url: "https://run-modules.vercel.app/#fitness", live: true, group: "生活 · 终身" },
    { key: "style", icon: "✨", name: "形象 Style", desc: "护肤·美白·穿搭", url: "https://run-modules.vercel.app/#style", live: true, group: "生活 · 终身" },
    { key: "music", icon: "🎸", name: "音乐 · 扒谱", desc: "识曲·和弦·吉他扒谱", url: "https://chordscribe-app-coral.vercel.app/", live: true, group: "生活 · 终身" },
    { key: "mystic", icon: "🔮", name: "玄学定位", desc: "八字/星座/MBTI · 趣味定位", url: "https://run-modules.vercel.app/#mystic", live: true, group: "趣味 · 探索" },
    { key: "buddy", icon: "🤝", name: "润人搭子", desc: "按目标匹配搭子·聚合Agent", url: "https://run-api-mu.vercel.app/", live: true, group: "社区" },
  ],
};
