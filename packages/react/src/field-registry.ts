"use client"

import type { VoiceField } from "@voicefield/core"

export interface RegisteredField {
  field: VoiceField
  element: HTMLInputElement | HTMLTextAreaElement | null
  setterFn: ((value: string, isFinal: boolean) => void) | null
}

export class FieldRegistry {
  private fields = new Map<string, RegisteredField>()
  private activeFieldId: string | null = null

  register(
    id: string,
    label: string,
    element?: HTMLInputElement | HTMLTextAreaElement | null,
    setterFn?: (value: string, isFinal: boolean) => void,
  ): void {
    this.fields.set(id, {
      field: { id, label },
      element: element ?? null,
      setterFn: setterFn ?? null,
    })
    if (!this.activeFieldId) {
      this.activeFieldId = id
    }
  }

  unregister(id: string): void {
    this.fields.delete(id)
    if (this.activeFieldId === id) {
      const first = this.fields.keys().next()
      this.activeFieldId = first.done ? null : first.value
    }
  }

  setActiveField(id: string): void {
    if (this.fields.has(id)) {
      this.activeFieldId = id
    }
  }

  getActiveFieldId(): string | null {
    return this.activeFieldId
  }

  getFields(): VoiceField[] {
    return Array.from(this.fields.values()).map((r) => r.field)
  }

  injectText(fieldId: string, text: string, isFinal: boolean): void {
    const registered = this.fields.get(fieldId)
    if (!registered) return

    if (registered.setterFn) {
      registered.setterFn(text, isFinal)
      return
    }

    const el = registered.element
    if (!el) return

    if (isFinal) {
      const base = el.dataset.voicefieldBase
      if (base !== undefined) {
        el.value = base
        delete el.dataset.voicefieldBase
      }
      const current = el.value
      const separator = current && !current.endsWith(" ") ? " " : ""
      el.value = current + separator + text
    } else {
      const baseText = el.dataset.voicefieldBase ?? el.value
      if (!el.dataset.voicefieldBase) {
        el.dataset.voicefieldBase = el.value
      }
      el.value = baseText + (baseText && !baseText.endsWith(" ") ? " " : "") + text
    }

    el.dispatchEvent(new Event("input", { bubbles: true }))
  }

  clearPartial(fieldId: string): void {
    const registered = this.fields.get(fieldId)
    if (!registered?.element) return
    const base = registered.element.dataset.voicefieldBase
    if (base !== undefined) {
      registered.element.value = base
      delete registered.element.dataset.voicefieldBase
      registered.element.dispatchEvent(new Event("input", { bubbles: true }))
    }
  }

  finalizePartial(fieldId: string): void {
    const registered = this.fields.get(fieldId)
    if (!registered?.element) return
    delete registered.element.dataset.voicefieldBase
  }
}
