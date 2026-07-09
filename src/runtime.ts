import { mergeInputConfig, mergeModelConfig } from './mergeModelConfig.js'
import type {
  CreateConfig,
  DeepPartial,
  DetailConfig,
  FieldDependencyEvaluation,
  InputConfig,
  ListConfig,
  ModelConfig,
  ModelFormField,
  PlatformKey,
  UpdateConfig,
} from './types.js'

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
  if (overrideValue === undefined) return cloneValue(baseValue)
  if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
    const result: Record<string, unknown> = {}
    const keys = new Set([...Object.keys(baseValue), ...Object.keys(overrideValue)])
    for (const key of keys) result[key] = mergeValue(baseValue[key], overrideValue[key])
    return result
  }
  return cloneValue(overrideValue)
}

function applyPlatformToInputConfig(inputConfig: InputConfig | undefined, platform?: PlatformKey): InputConfig | undefined {
  if (!inputConfig) return inputConfig
  if (!platform) return cloneValue(inputConfig)

  const result: InputConfig = {}
  for (const [field, config] of Object.entries(inputConfig)) {
    const platformOverride = config.platform?.[platform]
    const mergedField = mergeValue(config, platformOverride) as ModelFormField
    if (mergedField?.platform) delete mergedField.platform
    result[field] = mergedField
  }
  return result
}

function pickFirst<T>(...values: Array<T | undefined>): T | undefined {
  return values.find((item) => item !== undefined)
}

function mergeRecordValues<T extends Record<string, unknown>>(...values: Array<T | undefined>): T | undefined {
  let result: T | undefined

  for (const value of values) {
    if (value === undefined) continue
    result = mergeValue(result ?? {}, value) as T
  }

  return result
}

export function resolveModelConfig<T extends ModelConfig>(base: T, override?: DeepPartial<T>, platform?: PlatformKey): T {
  const merged = mergeModelConfig(base, override)
  if (!platform) return merged as T

  const result = cloneValue(merged) as T

  if (result.view?.list?.filter?.inputConfig) {
    result.view.list.filter.inputConfig = applyPlatformToInputConfig(result.view.list.filter.inputConfig, platform)
  }
  if (result.transaction?.inputConfig) {
    result.transaction.inputConfig = applyPlatformToInputConfig(result.transaction.inputConfig, platform)
  }
  if (result.transaction?.create?.inputConfig) {
    result.transaction.create.inputConfig = applyPlatformToInputConfig(result.transaction.create.inputConfig, platform)
  }
  if (result.transaction?.update?.inputConfig) {
    result.transaction.update.inputConfig = applyPlatformToInputConfig(result.transaction.update.inputConfig, platform)
  }

  return result
}

export function buildListConfig(modelConfig: ModelConfig, defaults: Partial<ListConfig> = {}): ListConfig {
  const list = modelConfig.view?.list
  const view = modelConfig.view

  return {
    ...defaults,
    uid: pickFirst(list?.uid, defaults.uid, 'id'),
    getAPI: pickFirst(list?.getAPI, view?.getAPI, modelConfig.modelAPI, modelConfig.name, defaults.getAPI),
    deleteAPI: pickFirst(list?.deleteAPI, defaults.deleteAPI),
    fields: pickFirst(list?.fields, view?.fields, modelConfig.fields, defaults.fields, []),
    fieldsAlias: mergeRecordValues(defaults.fieldsAlias, modelConfig.fieldsAlias, view?.fieldsAlias, list?.fieldsAlias),
    fieldsDictionary: mergeRecordValues(defaults.fieldsDictionary, view?.fieldsDictionary, list?.fieldsDictionary),
    fieldsParse: mergeRecordValues(defaults.fieldsParse, view?.fieldsParse, list?.fieldsParse),
    fieldsProxy: mergeRecordValues(defaults.fieldsProxy, view?.fieldsProxy, list?.fieldsProxy),
    fieldsType: mergeRecordValues(defaults.fieldsType, view?.fieldsType, list?.fieldsType),
    fieldsUnit: mergeRecordValues(defaults.fieldsUnit, view?.fieldsUnit, list?.fieldsUnit),
    fieldsClass: mergeRecordValues(defaults.fieldsClass, list?.fieldsClass),
    fieldsHeaderClass: mergeRecordValues(defaults.fieldsHeaderClass, list?.fieldsHeaderClass),
    fieldsAlign: mergeRecordValues(defaults.fieldsAlign, list?.fieldsAlign),
    toggleableFields: pickFirst(list?.toggleableFields, defaults.toggleableFields),
    draggable: pickFirst(list?.draggable, defaults.draggable),
    onDragChange: pickFirst(list?.onDragChange, defaults.onDragChange),
    searchParameters: mergeRecordValues(defaults.searchParameters, view?.searchParameters, list?.searchParameters),
    filter: {
      fields: pickFirst(list?.filter?.fields, defaults.filter?.fields),
      fieldsAlias: mergeRecordValues(defaults.filter?.fieldsAlias, list?.filter?.fieldsAlias),
      inputConfig: mergeInputConfig(defaults.filter?.inputConfig, list?.filter?.inputConfig),
    },
    export: {
      ...(defaults.export || {}),
      allow: pickFirst(list?.export?.allow, defaults.export?.allow, true),
      exportAPI: pickFirst(list?.export?.exportAPI, list?.getAPI, view?.getAPI, modelConfig.modelAPI, modelConfig.name, defaults.export?.exportAPI),
      onExport: pickFirst(list?.export?.onExport, defaults.export?.onExport),
      fieldsDictionary: mergeRecordValues(defaults.export?.fieldsDictionary, view?.fieldsDictionary, list?.fieldsDictionary, list?.export?.fieldsDictionary),
      fieldsParse: mergeRecordValues(defaults.export?.fieldsParse, view?.fieldsParse, list?.fieldsParse, list?.export?.fieldsParse),
      fieldsProxy: mergeRecordValues(defaults.export?.fieldsProxy, view?.fieldsProxy, list?.fieldsProxy, list?.export?.fieldsProxy),
      fieldsType: mergeRecordValues(defaults.export?.fieldsType, view?.fieldsType, list?.fieldsType, list?.export?.fieldsType),
      fieldsUnit: mergeRecordValues(defaults.export?.fieldsUnit, view?.fieldsUnit, list?.fieldsUnit, list?.export?.fieldsUnit),
    },
  }
}

export function buildDetailConfig(modelConfig: ModelConfig, defaults: Partial<DetailConfig> = {}): DetailConfig {
  const detail = modelConfig.view?.detail
  const view = modelConfig.view

  return {
    ...defaults,
    getAPI: pickFirst(detail?.getAPI, view?.getAPI, modelConfig.modelAPI, modelConfig.name, defaults.getAPI),
    dataID: pickFirst(detail?.dataID, defaults.dataID),
    fields: pickFirst(detail?.fields, view?.fields, modelConfig.fields, defaults.fields, []),
    fieldsAlias: mergeRecordValues(defaults.fieldsAlias, modelConfig.fieldsAlias, view?.fieldsAlias, detail?.fieldsAlias),
    fieldsDictionary: mergeRecordValues(defaults.fieldsDictionary, view?.fieldsDictionary, detail?.fieldsDictionary),
    fieldsParse: mergeRecordValues(defaults.fieldsParse, view?.fieldsParse, detail?.fieldsParse),
    fieldsProxy: mergeRecordValues(defaults.fieldsProxy, view?.fieldsProxy, detail?.fieldsProxy),
    fieldsType: mergeRecordValues(defaults.fieldsType, view?.fieldsType, detail?.fieldsType),
    fieldsUnit: mergeRecordValues(defaults.fieldsUnit, view?.fieldsUnit, detail?.fieldsUnit),
    searchParameters: mergeRecordValues(defaults.searchParameters, view?.searchParameters, detail?.searchParameters),
    export: {
      ...(defaults.export || {}),
      allow: pickFirst(detail?.export?.allow, defaults.export?.allow),
      title: pickFirst(detail?.export?.title, defaults.export?.title),
      onExport: pickFirst(detail?.export?.onExport, defaults.export?.onExport),
      fieldsDictionary: mergeRecordValues(defaults.export?.fieldsDictionary, view?.fieldsDictionary, detail?.fieldsDictionary, detail?.export?.fieldsDictionary),
      fieldsParse: mergeRecordValues(defaults.export?.fieldsParse, view?.fieldsParse, detail?.fieldsParse, detail?.export?.fieldsParse),
      fieldsProxy: mergeRecordValues(defaults.export?.fieldsProxy, view?.fieldsProxy, detail?.fieldsProxy, detail?.export?.fieldsProxy),
      fieldsType: mergeRecordValues(defaults.export?.fieldsType, view?.fieldsType, detail?.fieldsType, detail?.export?.fieldsType),
      fieldsUnit: mergeRecordValues(defaults.export?.fieldsUnit, view?.fieldsUnit, detail?.fieldsUnit, detail?.export?.fieldsUnit),
    },
  }
}

export function buildFormConfig(modelConfig: ModelConfig, mode: 'create' | 'update', defaults: Partial<CreateConfig & UpdateConfig> = {}): CreateConfig | UpdateConfig {
  const transaction = modelConfig.transaction
  const scoped = mode === 'create' ? transaction?.create : transaction?.update
  const fallback = mode === 'update' ? transaction?.create : undefined

  return {
    ...defaults,
    fields: pickFirst(scoped?.fields, fallback?.fields, transaction?.fields, modelConfig.fields, defaults.fields, []),
    targetAPI: pickFirst(scoped?.targetAPI, fallback?.targetAPI, transaction?.targetAPI, modelConfig.modelAPI, modelConfig.name, defaults.targetAPI),
    getAPI: mode === 'update' ? pickFirst((scoped as UpdateConfig | undefined)?.getAPI, modelConfig.modelAPI, modelConfig.name, defaults.getAPI) : undefined,
    dataID: mode === 'update' ? pickFirst((scoped as UpdateConfig | undefined)?.dataID, defaults.dataID) : undefined,
    searchParameters: mode === 'update' ? pickFirst((scoped as UpdateConfig | undefined)?.searchParameters, defaults.searchParameters) : undefined,
    fieldsAlias: mergeRecordValues(defaults.fieldsAlias, modelConfig.fieldsAlias, transaction?.fieldsAlias, fallback?.fieldsAlias, scoped?.fieldsAlias),
    inputConfig: mergeInputConfig(defaults.inputConfig, transaction?.inputConfig, fallback?.inputConfig, scoped?.inputConfig),
    extraData: mergeRecordValues(defaults.extraData, transaction?.extraData, fallback?.extraData, scoped?.extraData),
    getInitialData: pickFirst(scoped?.getInitialData, fallback?.getInitialData, transaction?.getInitialData, defaults.getInitialData),
    onSuccess: pickFirst(scoped?.onSuccess, fallback?.onSuccess, transaction?.onSuccess, defaults.onSuccess),
  }
}

export function evaluateFieldDependencies(formData: Record<string, any>, inputConfig: InputConfig): FieldDependencyEvaluation {
  const result: FieldDependencyEvaluation = {}

  for (const [field, config] of Object.entries(inputConfig || {})) {
    const dependency = config.dependency
    if (!dependency) continue

    const targetData = Object.fromEntries((dependency.fields || []).map((depField) => [depField, formData[depField]]))
    const evaluated: FieldDependencyEvaluation[string] = {
      fields: dependency.fields || [],
    }

    if (dependency.visibility) {
      evaluated.visibility = {
        default: dependency.visibility.default,
        value: dependency.visibility.validator?.(targetData) ?? dependency.visibility.default,
      }
    }
    if (dependency.disabled) {
      evaluated.disabled = {
        default: dependency.disabled.default,
        value: dependency.disabled.validator?.(targetData) ?? dependency.disabled.default,
      }
    }
    if (dependency.props) {
      const currentProps = config.props || {}
      evaluated.props = {
        default: dependency.props.default,
        value: dependency.props.generator?.(targetData, currentProps) ?? dependency.props.default,
      }
    }
    if (dependency.inputConfig) {
      evaluated.inputConfig = {
        default: dependency.inputConfig.default,
        value: dependency.inputConfig.generator?.(targetData) ?? dependency.inputConfig.default,
      }
    }
    if (dependency.value) {
      evaluated.value = {
        default: dependency.value.default,
        value: dependency.value.generator?.(targetData) ?? dependency.value.default,
      }
    }

    result[field] = evaluated
  }

  return result
}
