// Global event emitter for cross-tree communication (Nav ↔ CommandBar)

const target = new EventTarget()

export const commandBarEvents = {
  emit() {
    target.dispatchEvent(new Event('open-command-bar'))
  },
  listen(handler: () => void) {
    target.addEventListener('open-command-bar', handler)
    return () => target.removeEventListener('open-command-bar', handler)
  },
}
