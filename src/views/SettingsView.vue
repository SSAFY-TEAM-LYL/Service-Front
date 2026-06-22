<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  applyUiSettings,
  fontScaleOptions,
  readStoredUiSettings,
  resetUiSettings,
  saveUiSettings,
  themeOptions,
} from '@/utils/uiSettings'

const settings = ref(readStoredUiSettings())
const saveStatus = ref('저장됨')

const activeTheme = computed(
  () => themeOptions.find((option) => option.id === settings.value.theme) || themeOptions[0],
)

const updateTheme = (themeId) => {
  settings.value = saveUiSettings({ ...settings.value, theme: themeId })
  saveStatus.value = '저장됨'
}

const updateFontScale = (fontScaleId) => {
  settings.value = saveUiSettings({ ...settings.value, fontScale: fontScaleId })
  saveStatus.value = '저장됨'
}

const resetSettings = () => {
  settings.value = resetUiSettings()
  saveStatus.value = '기본값'
}

onMounted(() => {
  settings.value = readStoredUiSettings()
  applyUiSettings(settings.value)
})
</script>

<template>
  <div class="settings-page">
    <header class="settings-header">
      <div>
        <p class="settings-eyebrow">■ SETTINGS TERMINAL</p>
        <h2>화면 설정</h2>
        <span>LOCAL STORAGE · {{ saveStatus }}</span>
      </div>

      <button type="button" class="btn btn-outline" @click="resetSettings">기본값</button>
    </header>

    <section class="settings-active-panel" aria-label="현재 테마">
      <div class="active-theme-copy">
        <span class="settings-eyebrow">▶ ACTIVE THEME</span>
        <h3>{{ activeTheme.name }}</h3>
        <p>{{ activeTheme.description }}</p>
      </div>

      <div class="active-theme-swatches" aria-hidden="true">
        <span
          v-for="swatch in activeTheme.swatches"
          :key="swatch"
          :style="{ backgroundColor: swatch }"
        />
      </div>
    </section>

    <section class="settings-section" aria-labelledby="theme-title">
      <div class="settings-section-title">
        <span />
        <h3 id="theme-title">THEME SELECT</h3>
      </div>

      <div class="theme-grid">
        <button
          v-for="option in themeOptions"
          :key="option.id"
          type="button"
          class="theme-option"
          :class="{ active: settings.theme === option.id }"
          :aria-pressed="settings.theme === option.id"
          @click="updateTheme(option.id)"
        >
          <span class="theme-swatches" aria-hidden="true">
            <span
              v-for="swatch in option.swatches"
              :key="swatch"
              :style="{ backgroundColor: swatch }"
            />
          </span>
          <strong>{{ option.name }}</strong>
          <small>{{ option.description }}</small>
          <b>{{ settings.theme === option.id ? 'SELECTED' : 'SELECT' }}</b>
        </button>
      </div>
    </section>

    <section class="settings-section" aria-labelledby="font-scale-title">
      <div class="settings-section-title">
        <span />
        <h3 id="font-scale-title">TEXT SIZE</h3>
      </div>

      <div class="font-scale-grid">
        <button
          v-for="option in fontScaleOptions"
          :key="option.id"
          type="button"
          class="font-scale-option"
          :class="[`font-scale-${option.id}`, { active: settings.fontScale === option.id }]"
          :aria-pressed="settings.fontScale === option.id"
          @click="updateFontScale(option.id)"
        >
          <strong>Aa</strong>
          <span>
            <b>{{ option.name }}</b>
            <small>{{ option.description }}</small>
          </span>
          <i>{{ settings.fontScale === option.id ? 'SELECTED' : 'SELECT' }}</i>
        </button>
      </div>
    </section>

  </div>
</template>

<style scoped>
.settings-page {
  display: grid;
  gap: 22px;
}

.settings-header,
.settings-active-panel,
.settings-section {
  border: 3px solid var(--primary-line);
  background: var(--surface-plain);
  box-shadow: var(--pixel-shadow-muted);
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 22px;
}

.settings-header h2 {
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: clamp(1.12rem, 1.55vw, 1.48rem);
  font-weight: 950;
  letter-spacing: 0;
  line-height: 1.1;
  margin: 4px 0 6px;
}

.settings-header span,
.active-theme-copy p,
.theme-option small {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 0.76rem;
  font-weight: 750;
}

.settings-eyebrow,
.settings-section-title h3 {
  color: var(--primary-dark);
  font-family: var(--font-mono);
  font-size: 0.64rem;
  font-weight: 950;
  letter-spacing: 0.12em;
}

.settings-active-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(180px, 260px);
  align-items: stretch;
  gap: 18px;
  padding: 22px;
}

.active-theme-copy h3 {
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: clamp(1.28rem, 2.2vw, 1.82rem);
  font-weight: 950;
  line-height: 1.05;
  margin: 8px 0 6px;
}

.active-theme-swatches,
.theme-swatches {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.active-theme-swatches span,
.theme-swatches span {
  border: 3px solid var(--ink);
  box-shadow: 3px 3px 0 var(--line-soft);
}

.active-theme-swatches span {
  min-height: 74px;
}

.settings-section {
  display: grid;
  gap: 18px;
  padding: 22px;
}

.settings-section-title {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.settings-section-title span {
  width: 8px;
  height: 28px;
  background: var(--primary);
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.font-scale-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.theme-option {
  position: relative;
  display: grid;
  align-content: start;
  gap: 8px;
  min-height: 142px;
  padding: 12px;
  border: 3px solid var(--primary-line);
  background: var(--surface-panel);
  box-shadow: 4px 4px 0 var(--line-soft);
  color: var(--ink);
  text-align: left;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    transform var(--transition-fast);
}

.theme-option:hover,
.theme-option.active {
  border-color: var(--primary);
  box-shadow: var(--pixel-shadow);
  transform: translate(-1px, -1px);
}

.font-scale-option {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 76px;
  padding: 12px;
  border: 3px solid var(--primary-line);
  background: var(--surface-panel);
  box-shadow: 4px 4px 0 var(--line-soft);
  color: var(--ink);
  text-align: left;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    transform var(--transition-fast);
}

.font-scale-option:hover,
.font-scale-option.active {
  border-color: var(--primary);
  box-shadow: var(--pixel-shadow);
  transform: translate(-1px, -1px);
}

.font-scale-option strong {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border: 3px solid currentColor;
  background: var(--surface-plain);
  color: var(--primary);
  font-family: var(--font-mono);
  font-weight: 950;
  line-height: 1;
}

.font-scale-small strong {
  font-size: 0.82rem;
}

.font-scale-normal strong {
  font-size: 1rem;
}

.font-scale-large strong {
  font-size: 1.2rem;
}

.font-scale-option span {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.font-scale-option b,
.font-scale-option small,
.font-scale-option i {
  font-family: var(--font-mono);
  font-style: normal;
  font-weight: 950;
}

.font-scale-option b {
  color: var(--ink);
  font-size: 0.82rem;
}

.font-scale-option small {
  color: var(--muted);
  font-size: 0.7rem;
  font-weight: 800;
}

.font-scale-option i {
  color: var(--primary);
  font-size: 0.58rem;
}

.theme-option.active::before {
  position: absolute;
  top: -11px;
  right: 8px;
  padding: 2px 7px;
  border: 2px solid var(--ink);
  background: var(--gold);
  box-shadow: 2px 2px 0 var(--gold-dark);
  color: var(--ink);
  content: "ON";
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 950;
}

.theme-swatches span {
  min-height: 28px;
}

.theme-option strong,
.theme-option b {
  font-family: var(--font-mono);
  font-weight: 950;
}

.theme-option strong {
  color: var(--ink);
  font-size: 0.8rem;
}

.theme-option small {
  line-height: 1.45;
}

.theme-option b {
  align-self: end;
  color: var(--primary);
  font-size: 0.58rem;
  font-weight: 950;
}

@media (max-width: 1180px) {
  .theme-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .settings-header,
  .settings-active-panel {
    grid-template-columns: 1fr;
  }

  .settings-header {
    align-items: start;
  }

  .theme-grid {
    grid-template-columns: 1fr;
  }

  .font-scale-grid {
    grid-template-columns: 1fr;
  }

  .active-theme-swatches span {
    min-height: 56px;
  }
}
</style>
