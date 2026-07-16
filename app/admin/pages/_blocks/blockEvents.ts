export const BLOCK_CHANGED_EVENT = 'content-block:changed'

export function notifyBlockChanged() {
  window.dispatchEvent(new Event(BLOCK_CHANGED_EVENT))
}
