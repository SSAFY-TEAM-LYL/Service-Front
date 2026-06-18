<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import 'monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution'
import 'monaco-editor/esm/vs/basic-languages/java/java.contribution'
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution'

globalThis.MonacoEnvironment = {
  getWorker() {
    return new editorWorker()
  },
}

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  language: {
    type: String,
    default: 'PYTHON3',
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const editorRoot = ref(null)
let editor = null
let model = null
let resizeObserver = null

const languageMap = {
  PYTHON3: 'python',
  JAVA: 'java',
  CPP: 'cpp',
}

const monacoLanguage = (language) => languageMap[language] || 'plaintext'

onMounted(() => {
  model = monaco.editor.createModel(props.modelValue, monacoLanguage(props.language))
  editor = monaco.editor.create(editorRoot.value, {
    model,
    theme: 'vs-dark',
    readOnly: props.readOnly,
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
    lineHeight: 22,
    padding: { top: 14, bottom: 14 },
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    tabSize: 4,
    wordWrap: 'on',
    bracketPairColorization: { enabled: true },
    guides: { bracketPairs: true, indentation: true },
  })

  editor.onDidChangeModelContent(() => {
    const value = editor.getValue()
    if (value !== props.modelValue) {
      emit('update:modelValue', value)
    }
  })

  resizeObserver = new ResizeObserver(() => {
    editor?.layout()
  })
  resizeObserver.observe(editorRoot.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  editor?.dispose()
  model?.dispose()
})

watch(
  () => props.modelValue,
  (value) => {
    if (editor && value !== editor.getValue()) {
      editor.setValue(value)
    }
  },
)

watch(
  () => props.language,
  (language) => {
    if (model) {
      monaco.editor.setModelLanguage(model, monacoLanguage(language))
    }
  },
)

watch(
  () => props.readOnly,
  (readOnly) => {
    editor?.updateOptions({ readOnly })
  },
)
</script>

<template>
  <div ref="editorRoot" class="monaco-code-editor"></div>
</template>

<style scoped>
.monaco-code-editor {
  width: 100%;
  min-height: 480px;
  overflow: hidden;
  border: 4px solid var(--ink);
  border-radius: var(--radius-md);
  background: #1e1e1e;
  box-shadow: 5px 5px 0 var(--primary-shadow);
}

.monaco-code-editor:focus-within {
  border-color: var(--color-primary);
  box-shadow: 5px 5px 0 var(--primary-shadow);
}

@media (max-width: 860px) {
  .monaco-code-editor {
    min-height: 380px;
  }
}
</style>
