<script setup>
import { computed } from 'vue'

const props = defineProps({
  streak: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const monthLabels = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

const normalizeDate = (value) => {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const displayDays = computed(() => props.streak?.days || [])

const filledCells = computed(() => {
  if (!displayDays.value.length) return []

  const firstDate = normalizeDate(displayDays.value[0].date)
  const leadingBlanks = firstDate?.getDay() || 0
  const blanks = Array.from({ length: leadingBlanks }, (_, index) => ({
    key: `blank-${index}`,
    blank: true,
  }))

  return [
    ...blanks,
    ...displayDays.value.map((day) => ({
      key: day.date,
      date: day.date,
      submitted: day.submitted,
      submissionCount: day.submissionCount || 0,
      level: Math.min(day.submissionCount || 0, 4),
      label: `${day.date} ${day.submissionCount || 0}회 제출`,
    })),
  ]
})

const weeks = computed(() => {
  const result = []
  for (let index = 0; index < filledCells.value.length; index += 7) {
    result.push(filledCells.value.slice(index, index + 7))
  }
  return result
})

const monthMarkers = computed(() => {
  const markers = []
  displayDays.value.forEach((day, index) => {
    const date = normalizeDate(day.date)
    if (!date || date.getDate() !== 1) return

    const firstDate = normalizeDate(displayDays.value[0].date)
    const offset = (firstDate?.getDay() || 0) + index
    markers.push({
      label: monthLabels[date.getMonth()],
      gridColumn: Math.floor(offset / 7) + 1,
    })
  })
  return markers
})

const hasAnySubmission = computed(() => displayDays.value.some((day) => day.submitted))
</script>

<template>
  <div class="streak-grass" :class="{ 'is-compact': compact }">
    <div class="streak-topline">
      <div>
        <p class="streak-kicker">스트릭</p>
        <h3>
          현재 <strong>{{ streak?.currentStreak || 0 }}</strong
          >일
        </h3>
      </div>
      <dl class="streak-stats">
        <div>
          <dt>최장</dt>
          <dd>{{ streak?.longestStreak || 0 }}일</dd>
        </div>
        <div>
          <dt>활동</dt>
          <dd>{{ streak?.totalActiveDays || 0 }}일</dd>
        </div>
      </dl>
    </div>

    <div v-if="loading" class="streak-state">불러오는 중...</div>
    <div v-else-if="error" class="streak-state streak-state-error">{{ error }}</div>
    <div v-else class="grass-wrap" :class="{ 'is-empty': !hasAnySubmission }">
      <div class="weekday-labels" aria-hidden="true">
        <span v-for="(label, index) in dayLabels" :key="`${label}-${index}`">{{ label }}</span>
      </div>

      <div class="grass-scroll">
        <div class="month-labels" :style="{ gridTemplateColumns: `repeat(${weeks.length}, var(--streak-cell-size))` }">
          <span
            v-for="marker in monthMarkers"
            :key="`${marker.label}-${marker.gridColumn}`"
            :style="{ gridColumn: marker.gridColumn }"
          >
            {{ marker.label }}
          </span>
        </div>

        <div class="grass-grid" :style="{ gridTemplateColumns: `repeat(${weeks.length}, var(--streak-cell-size))` }">
          <template v-for="(week, weekIndex) in weeks" :key="weekIndex">
            <span
              v-for="cell in week"
              :key="cell.key"
              class="grass-cell"
              :class="{
                'is-blank': cell.blank,
                'is-submitted': cell.submitted,
                [`level-${cell.level}`]: cell.submitted,
              }"
              :aria-label="cell.label"
              :title="cell.label"
            />
            <span
              v-for="blankIndex in 7 - week.length"
              :key="`tail-${weekIndex}-${blankIndex}`"
              class="grass-cell is-blank"
              aria-hidden="true"
            />
          </template>
        </div>
      </div>
    </div>

    <div class="streak-legend" aria-hidden="true">
      <span>적음</span>
      <i class="legend-cell level-0"></i>
      <i class="legend-cell level-1"></i>
      <i class="legend-cell level-2"></i>
      <i class="legend-cell level-3"></i>
      <i class="legend-cell level-4"></i>
      <span>많음</span>
    </div>
  </div>
</template>

<style scoped>
.streak-grass {
  --streak-cell-size: 14px;
  --streak-cell-gap: 4px;
  display: grid;
  gap: var(--space-5);
}

.streak-topline {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: var(--space-5);
}

.streak-kicker {
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--font-xs);
  font-weight: 900;
}

.streak-topline h3 {
  margin-top: 2px;
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: var(--font-xl);
  font-weight: 950;
}

.streak-topline strong {
  color: var(--streak-level-4);
  font-size: var(--font-2xl);
}

.streak-stats {
  display: flex;
  gap: var(--space-4);
}

.streak-stats div {
  min-width: 68px;
  text-align: right;
}

.streak-stats dt {
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--font-xs);
  font-weight: 850;
}

.streak-stats dd {
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: var(--font-sm);
  font-weight: 950;
}

.streak-state {
  min-height: 120px;
  display: grid;
  place-items: center;
  border: 2px dashed var(--color-border-light);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--font-sm);
  font-weight: 850;
}

.streak-state-error {
  color: var(--color-error);
}

.grass-wrap {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: var(--space-3);
  align-items: start;
}

.weekday-labels {
  display: grid;
  grid-template-rows: repeat(7, var(--streak-cell-size));
  gap: var(--streak-cell-gap);
  padding-top: calc(var(--streak-cell-size) + 8px);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 850;
  line-height: var(--streak-cell-size);
}

.grass-scroll {
  overflow-x: auto;
  padding-bottom: var(--space-2);
  scrollbar-width: thin;
}

.month-labels {
  display: grid;
  gap: var(--streak-cell-gap);
  min-width: max-content;
  height: calc(var(--streak-cell-size) + 4px);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 850;
  line-height: 1;
}

.month-labels span {
  white-space: nowrap;
}

.grass-grid {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(7, var(--streak-cell-size));
  gap: var(--streak-cell-gap);
  min-width: max-content;
}

.grass-cell {
  width: var(--streak-cell-size);
  height: var(--streak-cell-size);
  border: 1px solid var(--streak-cell-border);
  background: var(--streak-empty);
}

.grass-cell.is-submitted {
  border-color: var(--streak-level-2);
  background: var(--streak-level-1);
  box-shadow: inset 0 -2px 0 var(--streak-level-2);
}

.grass-cell.level-2 {
  border-color: var(--streak-level-3);
  background: var(--streak-level-2);
  box-shadow: inset 0 -2px 0 var(--streak-level-3);
}

.grass-cell.level-3 {
  border-color: var(--streak-level-4);
  background: var(--streak-level-3);
  box-shadow: inset 0 -2px 0 var(--streak-level-4);
}

.grass-cell.level-4 {
  border-color: var(--streak-level-4);
  background: var(--streak-level-4);
  box-shadow: inset 0 -2px 0 color-mix(in srgb, var(--streak-level-4) 72%, #000);
}

.grass-cell.is-blank {
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}

.streak-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--font-xs);
  font-weight: 850;
}

.legend-cell {
  width: 14px;
  height: 14px;
  border: 1px solid var(--streak-cell-border);
}

.legend-cell.level-0 {
  background: var(--streak-empty);
}

.legend-cell.level-1 {
  border-color: var(--streak-level-2);
  background: var(--streak-level-1);
  box-shadow: inset 0 -2px 0 var(--streak-level-2);
}

.legend-cell.level-2 {
  border-color: var(--streak-level-3);
  background: var(--streak-level-2);
  box-shadow: inset 0 -2px 0 var(--streak-level-3);
}

.legend-cell.level-3 {
  border-color: var(--streak-level-4);
  background: var(--streak-level-3);
  box-shadow: inset 0 -2px 0 var(--streak-level-4);
}

.legend-cell.level-4 {
  border-color: var(--streak-level-4);
  background: var(--streak-level-4);
  box-shadow: inset 0 -2px 0 color-mix(in srgb, var(--streak-level-4) 72%, #000);
}

.is-compact {
  --streak-cell-size: clamp(22px, 1.72vw, 34px);
  --streak-cell-gap: clamp(4px, 0.34vw, 7px);
  gap: var(--space-4);
  padding-top: var(--space-6);
  border-top: 3px solid var(--color-border-light);
}

.is-compact .streak-topline {
  align-items: end;
}

.is-compact .streak-topline h3 {
  font-size: var(--font-xl);
}

.is-compact .streak-topline strong {
  font-size: var(--font-2xl);
}

.is-compact .streak-stats {
  gap: var(--space-6);
}

.is-compact .grass-wrap {
  grid-template-columns: 28px minmax(0, 1fr);
}

.is-compact .grass-scroll {
  padding: 0 2px var(--space-3);
}

.is-compact .month-labels,
.is-compact .weekday-labels {
  font-size: 0.72rem;
}

.is-compact .grass-grid,
.is-compact .month-labels {
  width: max-content;
}

.is-compact .streak-legend {
  padding-top: var(--space-1);
}

@media (max-width: 760px) {
  .streak-grass,
  .is-compact {
    --streak-cell-size: 18px;
    --streak-cell-gap: 4px;
  }

  .streak-topline {
    display: grid;
  }

  .streak-stats {
    justify-content: space-between;
  }

  .streak-stats div {
    text-align: left;
  }
}
</style>
