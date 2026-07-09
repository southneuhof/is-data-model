import type { DeepPartial, InputConfig, ModelConfig, ModelFormField } from './types.js'

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

function hasOwn(target: object, key: string) {
  return Object.prototype.hasOwnProperty.call(target, key)
}

function mergeFormFieldConfig(baseValue: unknown, overrideValue: unknown): unknown {
  if (overrideValue === undefined) return cloneValue(baseValue)

  if (isPlainObject(baseValue) && isPlainObject(overrideValue) && !hasOwn(overrideValue, 'type')) {
    return mergeValue(baseValue, overrideValue)
  }

  return cloneValue(overrideValue)
}

export function mergeInputConfig(...values: Array<Record<string, Partial<ModelFormField> | undefined> | undefined>): InputConfig | undefined {
  let result: Record<string, unknown> | undefined

  for (const value of values) {
    if (value === undefined) continue
    result ??= {}
    for (const [field, fieldConfig] of Object.entries(value)) {
      result[field] = mergeFormFieldConfig(result[field], fieldConfig)
    }
  }

  return result as InputConfig | undefined
}

function isModelInputConfigPath(path: string[]) {
  const joined = path.join('.')
  return joined === 'view.list.filter.inputConfig' ||
    joined === 'transaction.inputConfig' ||
    joined === 'transaction.create.inputConfig' ||
    joined === 'transaction.update.inputConfig'
}

function mergeValue(baseValue: unknown, overrideValue: unknown, path: string[] = []): unknown {
  if (overrideValue === undefined) {
    return cloneValue(baseValue)
  }

  if (isModelInputConfigPath(path) && isPlainObject(baseValue) && isPlainObject(overrideValue)) {
    return mergeInputConfig(baseValue, overrideValue)
  }

  if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
    const result: Record<string, unknown> = {}
    const keys = new Set([...Object.keys(baseValue), ...Object.keys(overrideValue)])

    for (const key of keys) {
      result[key] = mergeValue(baseValue[key], overrideValue[key], [...path, key])
    }

    return result
  }

  return cloneValue(overrideValue)
}

export function mergeModelConfig<T extends ModelConfig>(base: T, override?: DeepPartial<T>): T {
  return mergeValue(base, override ?? {}) as T
}
