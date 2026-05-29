import type { ThemeId } from './themes';
import { isActiveBuddiesTheme, isDarkTheme, THEME_IDS } from './themes';

type AccentFamily = 'cyan' | 'fuchsia' | 'indigo' | 'emerald' | 'mono';

function accentFamily(theme: ThemeId): AccentFamily {
  if (isActiveBuddiesTheme(theme)) return 'mono';
  if (theme === 'vibrant' || theme === 'vibrant-dark') return 'fuchsia';
  if (theme === 'bento' || theme === 'bento-dark') return 'indigo';
  if (theme === 'neon' || theme === 'neon-dark') return 'emerald';
  return 'cyan';
}

function textBase(dark: boolean, ab: boolean) {
  if (dark && ab) {
    return {
      head: 'text-[hsl(210_20%_94%)]',
      sub: 'text-[hsl(220_14%_82%)]',
      muted: 'text-[hsl(220_13%_74%)]',
      body: 'text-[hsl(220_14%_85%)]',
      sectionHead: 'text-[hsl(220_13%_70%)]',
    };
  }
  if (dark) {
    return {
      head: 'text-white',
      sub: 'text-gray-200',
      muted: 'text-gray-300',
      body: 'text-gray-200',
      sectionHead: 'text-gray-300',
    };
  }
  if (ab) {
    return {
      head: 'text-[hsl(220_14%_12%)]',
      sub: 'text-[hsl(220_10%_34%)]',
      muted: 'text-[hsl(220_10%_38%)]',
      body: 'text-[hsl(220_10%_32%)]',
      sectionHead: 'text-[hsl(220_10%_40%)]',
    };
  }
  return {
    head: 'text-gray-900',
    sub: 'text-gray-600',
    muted: 'text-gray-600',
    body: 'text-gray-700',
    sectionHead: 'text-gray-600',
  };
}

function linkClass(dark: boolean, family: AccentFamily): string {
  if (family === 'mono') {
    return dark
      ? 'text-[hsl(220_12%_80%)] hover:text-white'
      : 'text-[hsl(220_14%_12%)] hover:text-black';
  }
  if (dark) {
    if (family === 'fuchsia') return 'text-fuchsia-400 hover:text-fuchsia-300';
    if (family === 'indigo') return 'text-indigo-400 hover:text-indigo-300';
    return 'text-emerald-400 hover:text-emerald-300';
  }
  if (family === 'fuchsia') return 'text-fuchsia-600 hover:text-fuchsia-700';
  if (family === 'indigo') return 'text-indigo-600 hover:text-indigo-700';
  if (family === 'emerald') return 'text-emerald-600 hover:text-emerald-700';
  return 'text-cyan-600 hover:text-cyan-800';
}

function surfaces(dark: boolean, ab: boolean) {
  if (dark && ab) {
    return {
      divider: 'divide-[hsl(220_13%_22%)]',
      borderB: 'border-[hsl(220_13%_22%)]',
      borderT: 'border-[hsl(220_13%_22%)]',
      itemHover: 'hover:bg-[hsl(220_16%_14%)]',
      txHover: 'hover:bg-[hsl(220_16%_14%)]',
      inputBg:
        'bg-[hsl(220_16%_16%)] border border-[hsl(220_13%_22%)] text-[hsl(210_20%_92%)] placeholder-[hsl(220_12%_55%)]',
      readBg: 'border-[hsl(220_13%_22%)] bg-[hsl(220_16%_14%)]',
      unreadBg: 'border-[hsl(220_13%_28%)] bg-[hsl(220_16%_16%)]',
      selectBg: 'bg-[hsl(220_16%_16%)] border-[hsl(220_13%_22%)] text-white',
      bankBg: 'border-[hsl(220_13%_22%)] bg-[hsl(220_16%_14%)]',
      bankIcon: 'bg-[hsl(220_16%_18%)] border-[hsl(220_13%_22%)] text-[hsl(220_12%_75%)]',
      infoBg: 'bg-[hsl(220_16%_14%)] border border-[hsl(220_13%_22%)] shadow-none',
      topicBg:
        'border-[hsl(220_13%_22%)] bg-[hsl(220_16%_14%)] hover:bg-[hsl(220_16%_16%)]',
      topicLabel: 'text-[hsl(210_20%_92%)]',
      progressBg: 'bg-[hsl(220_16%_14%)]',
      cardSurface: 'bg-[hsl(220_16%_14%)]',
    };
  }
  if (dark) {
    return {
      divider: 'divide-gray-700/40',
      borderB: 'border-gray-700/40',
      borderT: 'border-gray-700/40',
      itemHover: 'hover:bg-gray-700/20',
      txHover: 'hover:bg-gray-700/20',
      inputBg: 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500',
      readBg: 'border-gray-700/40 bg-gray-800/30',
      unreadBg: 'border-gray-700/40 bg-gray-800/40',
      selectBg: 'bg-gray-800 border-gray-700 text-white',
      bankBg: 'border-gray-700/40 bg-gray-800/30',
      bankIcon: 'bg-gray-700/40 border-gray-600 text-gray-400',
      infoBg: 'bg-gray-800/30 border-none shadow-none',
      topicBg: 'border-gray-700/40 bg-gray-800/30 hover:bg-gray-700/30',
      topicLabel: 'text-white',
      progressBg: 'bg-gray-700/40',
      cardSurface: 'bg-gray-800/50',
    };
  }
  if (ab) {
    return {
      divider: 'divide-[hsl(220_13%_88%)]',
      borderB: 'border-[hsl(220_13%_88%)]',
      borderT: 'border-[hsl(220_13%_88%)]',
      itemHover: 'hover:bg-[hsl(220_14%_96%)]',
      txHover: 'hover:bg-[hsl(220_14%_96%)]',
      inputBg:
        'bg-white border border-[hsl(220_13%_88%)] text-[hsl(220_14%_12%)] placeholder-[hsl(220_9%_50%)]',
      readBg: 'border-[hsl(220_13%_88%)] bg-white',
      unreadBg: 'border-[hsl(220_13%_88%)] bg-[hsl(220_14%_96%)]',
      selectBg: 'bg-[hsl(220_14%_96%)] border-[hsl(220_13%_88%)] text-[hsl(220_14%_12%)]',
      bankBg: 'border-[hsl(220_13%_88%)] bg-[hsl(220_14%_96%)]',
      bankIcon: 'bg-white shadow-soft border-[hsl(220_13%_88%)] text-[hsl(220_9%_46%)]',
      infoBg: 'bg-[hsl(220_14%_96%)] border border-[hsl(220_13%_88%)] shadow-none',
      topicBg: 'border-[hsl(220_13%_88%)] bg-white hover:shadow-soft',
      topicLabel: 'text-[hsl(220_14%_12%)]',
      progressBg: 'bg-gray-100',
      cardSurface: 'bg-white',
    };
  }
  return {
    divider: 'divide-gray-100',
    borderB: 'border-gray-100',
    borderT: 'border-gray-100',
    itemHover: 'hover:bg-gray-50',
    txHover: 'hover:bg-gray-50',
    inputBg: 'bg-white border-gray-200 text-gray-900 placeholder-gray-400',
    readBg: 'border-gray-100 bg-white',
    unreadBg: 'border-gray-200 bg-gray-50',
    selectBg: 'bg-gray-50 border-gray-200 text-gray-900',
    bankBg: 'border-gray-200 bg-gray-50',
    bankIcon: 'bg-white shadow-soft border-gray-100 text-gray-500',
    infoBg: 'bg-gray-50 border-none shadow-none',
    topicBg: 'border-gray-100 bg-white hover:shadow-soft',
    topicLabel: 'text-gray-900',
    progressBg: 'bg-gray-100',
    cardSurface: 'bg-white',
  };
}

function accentExtras(dark: boolean, family: AccentFamily) {
  const mono = family === 'mono';
  if (mono && dark) {
    return {
      tabActive: 'bg-[hsl(0_0%_95%)] text-[hsl(220_14%_12%)] border-[hsl(220_13%_28%)]',
      tabInactive: 'text-[hsl(220_12%_70%)] border-transparent hover:text-[hsl(210_20%_92%)]',
      tabActiveBorder: 'border-white text-white',
      tabInactiveBorder: 'border-transparent text-[hsl(220_12%_70%)] hover:text-white',
      statBg: 'bg-[hsl(220_16%_18%)] border-[hsl(220_13%_22%)]',
      statVal: 'text-[hsl(210_20%_92%)]',
      cardHover: 'hover:border-[hsl(220_13%_35%)]',
      chipActive: 'bg-[hsl(0_0%_95%)] text-[hsl(220_14%_12%)]',
      chipInactive:
        'bg-[hsl(220_16%_14%)] border border-[hsl(220_13%_22%)] text-[hsl(220_12%_75%)] hover:text-white',
      toggleOn: 'bg-[hsl(0_0%_95%)]',
      iconColor: 'text-[hsl(210_20%_92%)]',
      dot: 'bg-white',
      actionBtn: 'text-[hsl(220_14%_12%)] bg-[hsl(0_0%_95%)] hover:bg-white',
      msgIcon: 'text-white hover:bg-[hsl(220_16%_18%)]',
      acceptBtn: 'bg-[hsl(0_0%_95%)] text-[hsl(220_14%_12%)] hover:bg-white',
      requestBadge: 'bg-white',
      trustHigh: 'text-white',
      tagBg: 'bg-[hsl(220_16%_18%)] text-[hsl(220_12%_80%)] border-[hsl(220_13%_28%)]',
      hoverText: 'group-hover:text-white',
      ring: 'focus:ring-white/40',
      progressFill: 'bg-white',
      barFill: 'bg-white',
      articleCat: 'text-[hsl(220_12%_75%)]',
      contactIcon: 'text-white',
      contactBtn: 'bg-[hsl(0_0%_95%)] text-[hsl(220_14%_12%)] hover:bg-white',
      heroBg: 'bg-[hsl(220_16%_16%)]',
      heroSub: 'text-[hsl(220_12%_75%)]',
      balanceBg: 'bg-[hsl(220_16%_16%)] border border-[hsl(220_13%_22%)]',
      balanceLabel: 'text-[hsl(220_12%_75%)]',
      withdrawBtn: 'bg-[hsl(0_0%_95%)] text-[hsl(220_14%_12%)] hover:bg-white border-0',
      iconAccent: 'text-[hsl(210_20%_92%)]',
      timelineDot: 'bg-white',
      scoreStroke: '#e5e7eb',
      scoreFill: 'fill-white',
    };
  }
  if (mono) {
    return {
      tabActive: 'bg-[hsl(220_14%_12%)] text-white border-[hsl(220_14%_12%)]',
      tabInactive: 'text-[hsl(220_11%_34%)] border-transparent hover:text-[hsl(220_14%_12%)]',
      tabActiveBorder: 'border-[hsl(220_14%_12%)] text-[hsl(220_14%_12%)]',
      tabInactiveBorder: 'border-transparent text-gray-500 hover:text-gray-800',
      statBg: 'bg-[hsl(220_14%_96%)] border-[hsl(220_13%_88%)]',
      statVal: 'text-[hsl(220_14%_12%)]',
      cardHover: 'hover:border-[hsl(220_13%_72%)]',
      chipActive: 'bg-[hsl(220_14%_12%)] text-white',
      chipInactive: 'bg-white border border-[hsl(220_13%_88%)] text-gray-700 hover:text-gray-900',
      toggleOn: 'bg-[hsl(220_14%_12%)]',
      iconColor: 'text-[hsl(220_14%_12%)]',
      dot: 'bg-[hsl(220_14%_12%)]',
      actionBtn: 'text-[hsl(220_14%_12%)] bg-[hsl(220_14%_96%)] hover:bg-[hsl(220_13%_92%)]',
      msgIcon: 'text-[hsl(220_14%_12%)] hover:bg-[hsl(220_14%_96%)]',
      acceptBtn: 'bg-[hsl(220_14%_12%)] text-white hover:bg-black',
      requestBadge: 'bg-[hsl(220_14%_12%)]',
      trustHigh: 'text-[hsl(220_14%_12%)]',
      tagBg: 'bg-[hsl(220_14%_96%)] text-[hsl(220_14%_12%)] border-[hsl(220_13%_88%)]',
      hoverText: 'group-hover:text-[hsl(220_14%_12%)]',
      ring: 'focus:ring-[hsl(220_14%_20%)]',
      progressFill: 'bg-[hsl(220_14%_12%)]',
      barFill: 'bg-[hsl(220_14%_12%)]',
      articleCat: 'text-[hsl(220_9%_40%)]',
      contactIcon: 'text-[hsl(220_14%_12%)]',
      contactBtn: 'bg-[hsl(220_14%_12%)] text-white hover:bg-black',
      heroBg: 'bg-[hsl(220_14%_12%)]',
      heroSub: 'text-[hsl(220_10%_75%)]',
      balanceBg: 'bg-[hsl(220_14%_12%)] border-0',
      balanceLabel: 'text-[hsl(220_10%_80%)]',
      withdrawBtn: 'bg-white text-[hsl(220_14%_12%)] hover:bg-gray-100 border-0',
      iconAccent: 'text-[hsl(220_14%_12%)]',
      timelineDot: 'bg-[hsl(220_14%_12%)]',
      scoreStroke: '#374151',
      scoreFill: 'fill-[hsl(220_14%_12%)]',
    };
  }

  if (family === 'fuchsia') {
    return {
      tabActive: dark
        ? 'bg-fuchsia-900/30 text-fuchsia-300 border-fuchsia-500'
        : 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-500',
      tabInactive: dark
        ? 'text-gray-400 border-transparent hover:text-gray-200'
        : 'text-gray-500 border-transparent hover:text-gray-800',
      tabActiveBorder: dark ? 'border-fuchsia-500 text-fuchsia-400' : 'border-fuchsia-600 text-fuchsia-600',
      tabInactiveBorder: dark
        ? 'border-transparent text-gray-400 hover:text-gray-200'
        : 'border-transparent text-gray-400 hover:text-gray-600',
      statBg: dark ? 'bg-fuchsia-900/20 border-fuchsia-800/30' : 'bg-fuchsia-50 border-fuchsia-100',
      statVal: dark ? 'text-fuchsia-400' : 'text-fuchsia-600',
      cardHover: dark ? 'hover:border-fuchsia-700' : 'hover:border-fuchsia-200',
      chipActive: dark ? 'bg-fuchsia-600 text-white' : 'bg-fuchsia-600 text-white',
      chipInactive: dark
        ? 'bg-gray-800/50 border-gray-600 text-gray-300'
        : 'bg-white border-gray-200 text-gray-600',
      toggleOn: 'bg-fuchsia-600',
      iconColor: dark ? 'text-fuchsia-400' : 'text-fuchsia-600',
      dot: 'bg-fuchsia-500',
      actionBtn: dark
        ? 'text-fuchsia-400 bg-fuchsia-900/20 hover:bg-fuchsia-900/30'
        : 'text-fuchsia-700 bg-fuchsia-100 hover:bg-fuchsia-200',
      msgIcon: dark ? 'text-fuchsia-400 hover:bg-fuchsia-900/30' : 'text-fuchsia-600 hover:bg-fuchsia-50',
      acceptBtn: 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white',
      requestBadge: 'bg-fuchsia-500',
      trustHigh: dark ? 'text-fuchsia-400' : 'text-fuchsia-600',
      tagBg: dark
        ? 'bg-fuchsia-900/20 text-fuchsia-300 border-fuchsia-800'
        : 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
      hoverText: dark ? 'group-hover:text-fuchsia-400' : 'group-hover:text-fuchsia-600',
      ring: 'focus:ring-fuchsia-500',
      progressFill: 'bg-fuchsia-500',
      barFill: 'bg-fuchsia-500',
      articleCat: dark ? 'text-fuchsia-400' : 'text-fuchsia-600',
      contactIcon: dark ? 'text-fuchsia-400' : 'text-fuchsia-600',
      contactBtn: 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white',
      heroBg: dark ? 'bg-fuchsia-800/60' : 'bg-fuchsia-600',
      heroSub: dark ? 'text-fuchsia-300' : 'text-fuchsia-100',
      balanceBg: dark ? 'bg-fuchsia-800/60 border-fuchsia-700/40' : 'bg-fuchsia-600 border-0',
      balanceLabel: dark ? 'text-fuchsia-300' : 'text-fuchsia-100',
      withdrawBtn: dark
        ? 'bg-white/10 text-white hover:bg-white/20 border-0'
        : 'bg-white text-fuchsia-900 hover:bg-gray-100 border-0',
      iconAccent: dark ? 'text-fuchsia-400' : 'text-fuchsia-600',
      timelineDot: 'bg-fuchsia-500',
      scoreStroke: '#d946ef',
      scoreFill: dark ? 'fill-white' : 'fill-gray-900',
    };
  }

  if (family === 'indigo') {
    return {
      tabActive: 'bg-indigo-50 text-indigo-700 border-indigo-500',
      tabInactive: 'text-gray-500 border-transparent hover:text-gray-800',
      tabActiveBorder: 'border-indigo-600 text-indigo-600',
      tabInactiveBorder: 'border-transparent text-gray-400 hover:text-gray-600',
      statBg: 'bg-indigo-50 border-indigo-100',
      statVal: 'text-indigo-600',
      cardHover: 'hover:border-indigo-200',
      chipActive: 'bg-indigo-600 text-white',
      chipInactive: 'bg-white border-gray-200 text-gray-600',
      toggleOn: 'bg-indigo-600',
      iconColor: 'text-indigo-600',
      dot: 'bg-indigo-500',
      actionBtn: 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200',
      msgIcon: 'text-indigo-600 hover:bg-indigo-50',
      acceptBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      requestBadge: 'bg-indigo-500',
      trustHigh: 'text-indigo-600',
      tagBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      hoverText: 'group-hover:text-indigo-600',
      ring: 'focus:ring-indigo-500',
      progressFill: 'bg-indigo-500',
      barFill: 'bg-indigo-500',
      articleCat: 'text-indigo-600',
      contactIcon: 'text-indigo-600',
      contactBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      heroBg: 'bg-indigo-600',
      heroSub: 'text-indigo-100',
      balanceBg: 'bg-indigo-600 border-0',
      balanceLabel: 'text-indigo-100',
      withdrawBtn: 'bg-white text-indigo-900 hover:bg-gray-100 border-0',
      iconAccent: 'text-indigo-600',
      timelineDot: 'bg-indigo-500',
      scoreStroke: '#6366f1',
      scoreFill: 'fill-gray-900',
    };
  }

  // emerald + cyan default dark branch for indigo family only on bento - emerald used for neon/bento-dark
  const em = family === 'emerald';
  return {
    tabActive: dark
      ? em
        ? 'bg-emerald-900/30 text-emerald-300 border-emerald-500'
        : 'bg-gray-700 text-white border-gray-500'
      : em
        ? 'bg-emerald-50 text-emerald-700 border-emerald-500'
        : 'bg-cyan-50 text-cyan-700 border-cyan-500',
    tabInactive: dark
      ? 'text-gray-400 border-transparent hover:text-gray-200'
      : 'text-gray-500 border-transparent hover:text-gray-700',
    tabActiveBorder: dark
      ? em
        ? 'border-emerald-500 text-emerald-400'
        : 'border-cyan-500 text-cyan-400'
      : em
        ? 'border-emerald-600 text-emerald-600'
        : 'border-cyan-600 text-cyan-600',
    tabInactiveBorder: dark
      ? 'border-transparent text-gray-400 hover:text-gray-200'
      : 'border-transparent text-gray-400 hover:text-gray-600',
    statBg: dark
      ? em
        ? 'bg-emerald-900/20 border-emerald-800/30'
        : 'bg-cyan-900/20 border-cyan-800/30'
      : em
        ? 'bg-emerald-50 border-emerald-100'
        : 'bg-cyan-50 border-cyan-100',
    statVal: dark ? (em ? 'text-emerald-400' : 'text-cyan-400') : em ? 'text-emerald-600' : 'text-cyan-600',
    cardHover: dark
      ? em
        ? 'hover:border-emerald-700'
        : 'hover:border-cyan-700'
      : em
        ? 'hover:border-emerald-200'
        : 'hover:border-cyan-200',
    chipActive: dark ? (em ? 'bg-emerald-600' : 'bg-cyan-600') + ' text-white' : (em ? 'bg-emerald-600' : 'bg-gray-900') + ' text-white',
    chipInactive: dark
      ? 'bg-gray-800/50 border-gray-600 text-gray-300'
      : 'bg-gray-100 text-gray-700 border-gray-200',
    toggleOn: em ? 'bg-emerald-600' : 'bg-cyan-600',
    iconColor: dark ? (em ? 'text-emerald-400' : 'text-cyan-400') : em ? 'text-emerald-600' : 'text-cyan-600',
    dot: em ? 'bg-emerald-500' : 'bg-cyan-500',
    actionBtn: dark
      ? em
        ? 'text-emerald-400 bg-emerald-900/20 hover:bg-emerald-900/30'
        : 'text-cyan-400 bg-cyan-900/20 hover:bg-cyan-900/30'
      : em
        ? 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200'
        : 'text-cyan-700 bg-cyan-100 hover:bg-cyan-200',
    msgIcon: dark
      ? em
        ? 'text-emerald-400 hover:bg-emerald-900/30'
        : 'text-cyan-400 hover:bg-cyan-900/30'
      : em
        ? 'text-emerald-600 hover:bg-emerald-50'
        : 'text-cyan-600 hover:bg-cyan-50',
    acceptBtn: em
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
      : 'bg-cyan-600 hover:bg-cyan-700 text-white',
    requestBadge: em ? 'bg-emerald-500' : 'bg-cyan-600',
    trustHigh: dark ? (em ? 'text-emerald-400' : 'text-cyan-400') : em ? 'text-emerald-600' : 'text-cyan-600',
    tagBg: dark
      ? em
        ? 'bg-emerald-900/20 text-emerald-300 border-emerald-800'
        : 'bg-cyan-900/20 text-cyan-300 border-cyan-800'
      : em
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-cyan-50 text-cyan-700 border-cyan-200',
    hoverText: dark
      ? em
        ? 'group-hover:text-emerald-400'
        : 'group-hover:text-cyan-400'
      : em
        ? 'group-hover:text-emerald-600'
        : 'group-hover:text-cyan-600',
    ring: em ? 'focus:ring-emerald-500' : 'focus:ring-cyan-500',
    progressFill: em ? 'bg-emerald-500' : 'bg-cyan-500',
    barFill: em ? 'bg-emerald-500' : 'bg-cyan-500',
    articleCat: dark ? (em ? 'text-emerald-400' : 'text-cyan-400') : em ? 'text-emerald-600' : 'text-cyan-600',
    contactIcon: dark ? (em ? 'text-emerald-400' : 'text-cyan-400') : em ? 'text-emerald-600' : 'text-cyan-600',
    contactBtn: em ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-cyan-600 hover:bg-cyan-700',
    heroBg: dark ? (em ? 'bg-emerald-800/50' : 'bg-gray-800') : em ? 'bg-emerald-600' : 'bg-cyan-600',
    heroSub: dark ? (em ? 'text-emerald-300' : 'text-gray-300') : em ? 'text-emerald-100' : 'text-cyan-100',
    balanceBg: dark
      ? em
        ? 'bg-emerald-800/50 border-emerald-700/40'
        : 'bg-cyan-800/50 border-cyan-700/40'
      : em
        ? 'bg-emerald-600 border-0'
        : 'bg-cyan-600 border-0',
    balanceLabel: dark ? (em ? 'text-emerald-300' : 'text-cyan-300') : em ? 'text-emerald-100' : 'text-cyan-100',
    withdrawBtn: dark
      ? 'bg-white/10 text-white hover:bg-white/20 border-0'
      : 'bg-white text-emerald-900 hover:bg-gray-100 border-0',
    iconAccent: dark ? (em ? 'text-emerald-400' : 'text-cyan-400') : em ? 'text-emerald-600' : 'text-cyan-600',
    timelineDot: em ? 'bg-emerald-500' : 'bg-green-500',
    scoreStroke: em ? '#10b981' : '#10b981',
    scoreFill: dark ? 'fill-white' : 'fill-gray-900',
  };
}

/** Page-level contrast tokens (all 9 themes). */
export type PageContrast = ReturnType<typeof getPageContrast>;

export function getPageContrast(theme: string) {
  const id = (THEME_IDS.includes(theme as ThemeId) ? theme : 'classic') as ThemeId;
  const dark = isDarkTheme(id);
  const ab = isActiveBuddiesTheme(id);
  const family = accentFamily(id);
  const text = textBase(dark, ab);
  const surf = surfaces(dark, ab);
  const accent = accentExtras(dark, family);

  return {
    theme: id,
    isDark: dark,
    isAB: ab,
    accentFamily: family,
    ...text,
    ...surf,
    ...accent,
    link: linkClass(dark, family),
    faqAnswer: text.sub,
    chevron: text.muted,
    heroCircle: 'bg-white opacity-10',
    articleHover: accent.cardHover,
    pendingIcon: dark
      ? ab
        ? 'bg-[hsl(220_16%_18%)] text-[hsl(220_12%_75%)] border-[hsl(220_13%_22%)]'
        : 'bg-gray-700/30 text-gray-400 border-gray-600'
      : 'bg-gray-50 text-gray-500 border-gray-200',
    pendingLabel: text.muted,
    uploadArea: dark
      ? ab
        ? 'bg-[hsl(220_16%_16%)] border-[hsl(220_13%_22%)]'
        : 'bg-gray-800/30 border-gray-600'
      : 'bg-gray-50 border-gray-200',
    uploadText: text.sub,
    advBadge: dark
      ? ab
        ? 'bg-[hsl(220_16%_18%)] text-[hsl(220_12%_70%)]'
        : 'bg-gray-700/40 text-gray-400'
      : 'bg-gray-100 text-gray-600',
    scoreBg: ab && !dark ? 'bg-[hsl(220_14%_12%)]' : 'bg-gradient-to-br from-cyan-500 to-emerald-500',
    tierListText: text.sub,
    progressIcon: accent.statBg,
    progressIconColor: accent.statVal,
    progressHead: dark ? accent.statVal : accent.statVal,
    progressSub: text.sub,
    progressBar: dark ? surf.progressBg : accent.statBg.replace('border-', 'bg-').split(' ')[0],
    completedIcon: dark ? 'bg-cyan-900/30 text-cyan-400' : 'bg-cyan-50 text-cyan-600',
    tierEmail: dark ? 'bg-cyan-900/20 border-cyan-800/30' : 'bg-cyan-50 border-cyan-100',
    tierPhone: dark ? 'bg-purple-900/20 border-purple-800/30' : 'bg-purple-50 border-purple-100',
    tierId: dark ? 'bg-amber-900/20 border-amber-800/30' : 'bg-amber-50 border-amber-100',
    tierTimeBg: surf.cardSurface,
    catOn: accent.tagBg,
    catOff: accent.chipInactive,
    twofaBg: dark
      ? ab
        ? 'border-[hsl(220_13%_28%)] bg-[hsl(220_16%_16%)]'
        : 'border-gray-700/40 bg-gray-800/30'
      : family === 'fuchsia'
        ? 'border-fuchsia-200 bg-fuchsia-50/30'
        : family === 'indigo'
          ? 'border-indigo-200 bg-indigo-50/30'
          : family === 'emerald'
            ? 'border-emerald-200 bg-emerald-50/30'
            : 'border-cyan-200 bg-cyan-50/30',
    sessionBadge: dark
      ? 'text-emerald-300 bg-emerald-900/30'
      : 'text-emerald-700 bg-emerald-50',
    timelineLine: dark ? 'bg-gray-700' : 'bg-gray-200',
    streakOff: dark ? 'bg-gray-700/30 text-gray-500' : 'bg-gray-100 text-gray-400',
    lbBorder: dark ? 'border-gray-700/30' : 'border-gray-50',
    xpBadge: accent.statBg + ' ' + accent.statVal,
    gradientFrom: family === 'fuchsia' ? 'from-fuchsia-500' : family === 'indigo' ? 'from-indigo-500' : family === 'mono' ? 'from-gray-600' : 'from-emerald-500',
    gradientTo: family === 'fuchsia' ? 'to-orange-500' : family === 'indigo' ? 'to-violet-500' : 'to-gray-400',
    highlightRow: dark ? surf.unreadBg : accent.statBg,
    highlightText: accent.statVal,
    challengeBg: dark
      ? ab
        ? 'bg-[hsl(220_16%_14%)] border-[hsl(220_13%_22%)]'
        : 'bg-gray-800/40 border-gray-700/40'
      : 'bg-gray-50 border-gray-100',
    shareHover: dark ? `${text.muted} hover:${accent.statVal.split(' ')[0]}` : `${text.muted} hover:text-cyan-600`,
    label: text.head,
    value: text.head,
    labelMuted: text.muted,
  };
}

/** Profile page extras */
export function getProfileContrast(theme: string) {
  const p = getPageContrast(theme);
  const dark = p.isDark;
  const family = p.accentFamily;

  if (family === 'mono') {
    return {
      ...p,
      accent: dark ? 'text-white' : 'text-[hsl(220_14%_12%)]',
      accentBg: dark ? 'bg-[hsl(220_16%_18%)]' : 'bg-[hsl(220_14%_96%)]',
      accentBorder: dark ? 'border-[hsl(220_13%_22%)]' : 'border-[hsl(220_13%_88%)]',
      accentLight: dark ? 'text-[hsl(220_12%_80%)]' : 'text-[hsl(220_9%_40%)]',
      ring: 'focus:ring-white/30 focus:border-white/40',
      checkbox: dark ? 'text-white' : 'text-[hsl(220_14%_12%)]',
      radioActive: dark
        ? 'border-[hsl(220_13%_28%)] bg-[hsl(220_16%_16%)]'
        : 'border-[hsl(220_13%_88%)] bg-[hsl(220_14%_96%)]',
      radioText: p.head,
      radioSub: p.sub,
      tierHighlight: dark
        ? 'border-[hsl(220_13%_28%)] bg-[hsl(220_16%_16%)]'
        : 'border-emerald-200 bg-emerald-50/50',
      tierHighlightText: dark ? 'text-white' : 'text-emerald-800',
      tierHighlightSub: dark ? 'text-[hsl(220_12%_75%)]' : 'text-emerald-600/80',
      btnAccent: dark ? 'text-white hover:bg-[hsl(220_16%_18%)]' : 'text-[hsl(220_14%_12%)] hover:bg-[hsl(220_14%_96%)]',
      historyIcon: dark
        ? 'bg-[hsl(220_16%_18%)] text-white'
        : 'bg-[hsl(220_14%_96%)] text-[hsl(220_14%_12%)]',
      selectBg: p.selectBg,
      selectRing: p.ring,
      settingCard: dark
        ? 'bg-[hsl(220_16%_14%)] border-[hsl(220_13%_22%)]'
        : 'bg-white border-gray-100',
      avatarBg: dark ? 'bg-[hsl(220_16%_18%)] border-[hsl(220_13%_22%)]' : 'bg-[hsl(220_14%_96%)] border-[hsl(220_13%_88%)]',
      avatarText: dark ? 'text-white' : 'text-[hsl(220_14%_12%)]',
    };
  }

  // Re-use fuchsia/emerald/indigo/cyan from original profile accents
  if (family === 'fuchsia') {
    return {
      ...p,
      accent: dark ? 'text-fuchsia-400' : 'text-fuchsia-600',
      accentBg: dark ? 'bg-fuchsia-900/20' : 'bg-fuchsia-50',
      accentBorder: dark ? 'border-fuchsia-800' : 'border-fuchsia-200',
      accentLight: dark ? 'text-fuchsia-300' : 'text-fuchsia-700',
      ring: 'focus:ring-fuchsia-500 focus:border-fuchsia-500',
      checkbox: dark ? 'text-fuchsia-400' : 'text-fuchsia-600',
      radioActive: dark ? 'border-fuchsia-600 bg-fuchsia-900/20' : 'border-fuchsia-200 bg-fuchsia-50/30',
      radioText: dark ? 'text-fuchsia-300' : 'text-fuchsia-900',
      radioSub: dark ? 'text-fuchsia-400/80' : 'text-fuchsia-700/80',
      tierHighlight: dark ? 'border-fuchsia-700 bg-fuchsia-900/20' : 'border-emerald-200 bg-emerald-50/50',
      tierHighlightText: dark ? 'text-fuchsia-300' : 'text-emerald-800',
      tierHighlightSub: dark ? 'text-fuchsia-400/80' : 'text-emerald-600/80',
      btnAccent: dark ? 'text-fuchsia-400 hover:bg-fuchsia-900/30' : 'text-fuchsia-600 hover:bg-fuchsia-50',
      historyIcon: dark ? 'bg-fuchsia-900/30 text-fuchsia-400' : 'bg-fuchsia-100 text-fuchsia-600',
      selectBg: dark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200',
      selectRing: 'focus:border-fuchsia-500 focus:ring-fuchsia-500',
      settingCard: dark ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-gray-100',
      avatarBg: dark ? 'bg-fuchsia-900/30 border-fuchsia-700' : 'bg-fuchsia-100 border-fuchsia-200',
      avatarText: dark ? 'text-fuchsia-400' : 'text-fuchsia-700',
    };
  }

  if (family === 'indigo') {
    return {
      ...p,
      accent: 'text-indigo-600',
      accentBg: 'bg-indigo-50',
      accentBorder: 'border-indigo-200',
      accentLight: 'text-indigo-700',
      ring: 'focus:ring-indigo-500 focus:border-indigo-500',
      checkbox: 'text-indigo-600',
      radioActive: 'border-indigo-200 bg-indigo-50/30',
      radioText: 'text-indigo-900',
      radioSub: 'text-indigo-700/80',
      tierHighlight: 'border-emerald-200 bg-emerald-50/50',
      tierHighlightText: 'text-emerald-800',
      tierHighlightSub: 'text-emerald-600/80',
      btnAccent: 'text-indigo-600 hover:bg-indigo-50',
      historyIcon: 'bg-indigo-100 text-indigo-600',
      selectBg: 'bg-gray-50 border-gray-200',
      selectRing: 'focus:border-indigo-500 focus:ring-indigo-500',
      settingCard: 'bg-white border-gray-100',
      avatarBg: 'bg-indigo-100 border-indigo-200',
      avatarText: 'text-indigo-700',
    };
  }

  const em = family === 'emerald';
  return {
    ...p,
    accent: dark ? (em ? 'text-emerald-400' : 'text-cyan-400') : em ? 'text-emerald-600' : 'text-cyan-600',
    accentBg: dark ? (em ? 'bg-emerald-900/20' : 'bg-cyan-900/20') : em ? 'bg-emerald-50' : 'bg-cyan-50',
    accentBorder: dark ? (em ? 'border-emerald-800' : 'border-cyan-800') : em ? 'border-emerald-200' : 'border-cyan-200',
    accentLight: dark ? (em ? 'text-emerald-300' : 'text-cyan-300') : em ? 'text-emerald-700' : 'text-cyan-700',
    ring: em ? 'focus:ring-emerald-500 focus:border-emerald-500' : 'focus:ring-cyan-500 focus:border-cyan-500',
    checkbox: dark ? (em ? 'text-emerald-400' : 'text-cyan-400') : em ? 'text-emerald-600' : 'text-cyan-600',
    radioActive: dark
      ? em
        ? 'border-emerald-600 bg-emerald-900/20'
        : 'border-cyan-600 bg-cyan-900/20'
      : em
        ? 'border-emerald-200 bg-emerald-50/30'
        : 'border-cyan-200 bg-cyan-50/30',
    radioText: dark ? (em ? 'text-emerald-300' : 'text-cyan-300') : em ? 'text-emerald-900' : 'text-cyan-900',
    radioSub: dark ? (em ? 'text-emerald-400/80' : 'text-cyan-400/80') : em ? 'text-emerald-700/80' : 'text-cyan-700/80',
    tierHighlight: dark
      ? em
        ? 'border-emerald-700 bg-emerald-900/20'
        : 'border-cyan-700 bg-cyan-900/20'
      : 'border-emerald-200 bg-emerald-50/50',
    tierHighlightText: dark ? (em ? 'text-emerald-300' : 'text-cyan-300') : 'text-emerald-800',
    tierHighlightSub: dark ? (em ? 'text-emerald-400/80' : 'text-cyan-400/80') : 'text-emerald-600/80',
    btnAccent: dark
      ? em
        ? 'text-emerald-400 hover:bg-emerald-900/30'
        : 'text-cyan-400 hover:bg-cyan-900/30'
      : em
        ? 'text-emerald-600 hover:bg-emerald-50'
        : 'text-cyan-600 hover:bg-cyan-50',
    historyIcon: dark
      ? em
        ? 'bg-emerald-900/30 text-emerald-400'
        : 'bg-cyan-900/30 text-cyan-400'
      : em
        ? 'bg-emerald-100 text-emerald-600'
        : 'bg-cyan-100 text-cyan-600',
    selectBg: dark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200',
    selectRing: em ? 'focus:border-emerald-500 focus:ring-emerald-500' : 'focus:border-cyan-500 focus:ring-cyan-500',
    settingCard: dark ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-gray-100',
    avatarBg: dark
      ? em
        ? 'bg-emerald-900/30 border-emerald-700'
        : 'bg-cyan-900/30 border-cyan-700'
      : em
        ? 'bg-emerald-100 border-emerald-200'
        : 'bg-cyan-100 border-cyan-200',
    avatarText: dark ? (em ? 'text-emerald-400' : 'text-cyan-400') : em ? 'text-emerald-700' : 'text-cyan-700',
  };
}
