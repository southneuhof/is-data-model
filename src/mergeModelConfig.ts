import type { DeepPartial, ModelConfig } from './types'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as T
  }

  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {}
    for (const [key, nested] of Object.entries(value)) {
      result[key] = cloneValue(nested)
    }
    return result as T
  }

  return value
}

function mergeValue(baseValue: unknown, overrideValue: unknown): unknown {
  if (overrideValue === undefined) {
    return cloneValue(baseValue)
  }

  if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
    const result: Record<string, unknown> = {}
    const keys = new Set([...Object.keys(baseValue), ...Object.keys(overrideValue)])

    for (const key of keys) {
      result[key] = mergeValue(baseValue[key], overrideValue[key])
    }

    return result
  }

  return cloneValue(overrideValue)
}

export function mergeModelConfig<T extends ModelConfig>(base: T, override?: DeepPartial<T>): T {
  return mergeValue(base, override ?? {}) as T
}
