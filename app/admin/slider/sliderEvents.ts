export const SLIDER_CHANGED_EVENT = 'slider:changed'

export function notifySliderChanged() {
  window.dispatchEvent(new Event(SLIDER_CHANGED_EVENT))
}
