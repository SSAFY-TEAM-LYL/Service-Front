export const UI_SETTINGS_STORAGE_KEY = 'algoquest-ui-settings'

export const defaultUiSettings = {
  theme: 'mono',
  density: 'comfortable',
  fontScale: 'normal',
  reduceMotion: false,
  highContrast: false,
}

export const themeOptions = [
  {
    id: 'mono',
    name: 'Mono',
    description: '기본 화이트',
    swatches: ['#ffffff', '#e5e7eb', '#6b7280'],
  },
  {
    id: 'quest-purple',
    name: 'Purple',
    description: '기본 보라색',
    swatches: ['#7c3aed', '#4c1d95', '#ede9fe'],
  },
  {
    id: 'ocean-blue',
    name: 'Blue',
    description: '기본 파란색',
    swatches: ['#2563eb', '#1e3a8a', '#dbeafe'],
  },
  {
    id: 'dark-dungeon',
    name: 'Dark',
    description: '일반 다크모드',
    swatches: ['#0b1120', '#2563eb', '#1f2937'],
  },
]

export const fontScaleOptions = [
  {
    id: 'small',
    name: 'Small',
    description: '작게',
  },
  {
    id: 'normal',
    name: 'Default',
    description: '기본',
  },
  {
    id: 'large',
    name: 'Large',
    description: '크게',
  },
]

const themeIds = new Set(themeOptions.map((option) => option.id))
const fontScaleIds = new Set(fontScaleOptions.map((option) => option.id))

export const normalizeUiSettings = (settings) => {
  const nextSettings = { ...defaultUiSettings, ...settings }

  return {
    ...nextSettings,
    theme: themeIds.has(nextSettings.theme) ? nextSettings.theme : defaultUiSettings.theme,
    fontScale: fontScaleIds.has(nextSettings.fontScale)
      ? nextSettings.fontScale
      : defaultUiSettings.fontScale,
  }
}

export const readStoredUiSettings = () => {
  const storedSettings = localStorage.getItem(UI_SETTINGS_STORAGE_KEY)
  if (!storedSettings) return { ...defaultUiSettings }

  try {
    const parsedSettings = JSON.parse(storedSettings)
    if (!parsedSettings || typeof parsedSettings !== 'object') {
      return { ...defaultUiSettings }
    }

    return normalizeUiSettings(parsedSettings)
  } catch {
    return { ...defaultUiSettings }
  }
}

export const applyUiSettings = (settings) => {
  const nextSettings = normalizeUiSettings(settings)
  const root = document.documentElement

  root.dataset.uiTheme = nextSettings.theme
  root.dataset.uiDensity = nextSettings.density
  root.dataset.uiFontScale = nextSettings.fontScale
  root.classList.toggle('reduce-motion', nextSettings.reduceMotion)
  root.classList.toggle('high-contrast', nextSettings.highContrast)
}

export const saveUiSettings = (settings) => {
  const nextSettings = normalizeUiSettings(settings)

  localStorage.setItem(UI_SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings))
  applyUiSettings(nextSettings)

  return nextSettings
}

export const resetUiSettings = () => saveUiSettings(defaultUiSettings)
