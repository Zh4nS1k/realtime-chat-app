// iOS color utilities

export function getIOSColors(theme: 'light' | 'dark') {
  if (theme === 'dark') {
    return {
      blue: '#0a84ff',
      blueDark: '#0051d5',
      green: '#30d158',
      orange: '#ff9f0a',
      pink: '#ff375f',
      purple: '#bf5af2',
      red: '#ff453a',
      teal: '#64d2ff',
      yellow: '#ffd60a',
      indigo: '#5e5ce6',
      avatar: [
        '#0a84ff',
        '#ff9f0a',
        '#bf5af2',
        '#ff375f',
        '#64d2ff',
        '#30d158',
        '#5e5ce6',
      ],
    };
  }
  return {
    blue: '#007aff',
    blueDark: '#0051d5',
    green: '#34c759',
    orange: '#ff9500',
    pink: '#ff2d55',
    purple: '#af52de',
    red: '#ff3b30',
    teal: '#5ac8fa',
    yellow: '#ffcc00',
    indigo: '#5856d6',
    avatar: [
      '#007aff',
      '#ff9500',
      '#af52de',
      '#ff2d55',
      '#5ac8fa',
      '#34c759',
      '#5856d6',
    ],
  };
}

