import { mergeModelConfig } from './mergeModelConfig'
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
} from './types'

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
    fieldsAlias: {
      ...(defaults.fieldsAlias || {}),
      ...(list?.fieldsAlias || view?.fieldsAlias || modelConfig.fieldsAlias || {}),
    },
    fieldsDictionary: pickFirst(list?.fieldsDictionary, view?.fieldsDictionary, defaults.fieldsDictionary),
    fieldsParse: pickFirst(list?.fieldsParse, view?.fieldsParse, defaults.fieldsParse),
    fieldsProxy: pickFirst(list?.fieldsProxy, view?.fieldsProxy, defaults.fieldsProxy),
    fieldsType: pickFirst(list?.fieldsType, view?.fieldsType, defaults.fieldsType),
    fieldsUnit: pickFirst(list?.fieldsUnit, view?.fieldsUnit, defaults.fieldsUnit),
    fieldsClass: pickFirst(list?.fieldsClass, defaults.fieldsClass),
    fieldsHeaderClass: pickFirst(list?.fieldsHeaderClass, defaults.fieldsHeaderClass),
    fieldsAlign: pickFirst(list?.fieldsAlign, defaults.fieldsAlign),
    toggleableFields: pickFirst(list?.toggleableFields, defaults.toggleableFields),
    draggable: pickFirst(list?.draggable, defaults.draggable),
    onDragChange: pickFirst(list?.onDragChange, defaults.onDragChange),
    searchParameters: pickFirst(list?.searchParameters, view?.searchParameters, defaults.searchParameters),
    filter: {
      fields: pickFirst(list?.filter?.fields, defaults.filter?.fields),
      fieldsAlias: {
        ...(defaults.filter?.fieldsAlias || {}),
        ...(list?.filter?.fieldsAlias || {}),
      },
      inputConfig: {
        ...(defaults.filter?.inputConfig || {}),
        ...(list?.filter?.inputConfig || {}),
      },
    },
    export: {
      ...(defaults.export || {}),
      allow: pickFirst(list?.export?.allow, defaults.export?.allow, true),
      exportAPI: pickFirst(list?.export?.exportAPI, list?.getAPI, view?.getAPI, modelConfig.modelAPI, modelConfig.name, defaults.export?.exportAPI),
      onExport: pickFirst(list?.export?.onExport, defaults.export?.onExport),
      fieldsDictionary: pickFirst(list?.export?.fieldsDictionary, list?.fieldsDictionary, view?.fieldsDictionary, defaults.export?.fieldsDictionary),
      fieldsParse: pickFirst(list?.export?.fieldsParse, list?.fieldsParse, view?.fieldsParse, defaults.export?.fieldsParse),
      fieldsProxy: pickFirst(list?.export?.fieldsProxy, list?.fieldsProxy, view?.fieldsProxy, defaults.export?.fieldsProxy),
      fieldsType: pickFirst(list?.export?.fieldsType, list?.fieldsType, view?.fieldsType, defaults.export?.fieldsType),
      fieldsUnit: pickFirst(list?.export?.fieldsUnit, list?.fieldsUnit, view?.fieldsUnit, defaults.export?.fieldsUnit),
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
    fieldsAlias: {
      ...(defaults.fieldsAlias || {}),
      ...(detail?.fieldsAlias || view?.fieldsAlias || modelConfig.fieldsAlias || {}),
    },
    fieldsDictionary: pickFirst(detail?.fieldsDictionary, view?.fieldsDictionary, defaults.fieldsDictionary),
    fieldsParse: pickFirst(detail?.fieldsParse, view?.fieldsParse, defaults.fieldsParse),
    fieldsProxy: pickFirst(detail?.fieldsProxy, view?.fieldsProxy, defaults.fieldsProxy),
    fieldsType: pickFirst(detail?.fieldsType, view?.fieldsType, defaults.fieldsType),
    fieldsUnit: pickFirst(detail?.fieldsUnit, view?.fieldsUnit, defaults.fieldsUnit),
    searchParameters: pickFirst(detail?.searchParameters, view?.searchParameters, defaults.searchParameters),
    export: {
      ...(defaults.export || {}),
      allow: pickFirst(detail?.export?.allow, defaults.export?.allow),
      title: pickFirst(detail?.export?.title, defaults.export?.title),
      onExport: pickFirst(detail?.export?.onExport, defaults.export?.onExport),
      fieldsDictionary: pickFirst(detail?.export?.fieldsDictionary, detail?.fieldsDictionary, view?.fieldsDictionary, defaults.export?.fieldsDictionary),
      fieldsParse: pickFirst(detail?.export?.fieldsParse, detail?.fieldsParse, view?.fieldsParse, defaults.export?.fieldsParse),
      fieldsProxy: pickFirst(detail?.export?.fieldsProxy, detail?.fieldsProxy, view?.fieldsProxy, defaults.export?.fieldsProxy),
      fieldsType: pickFirst(detail?.export?.fieldsType, detail?.fieldsType, view?.fieldsType, defaults.export?.fieldsType),
      fieldsUnit: pickFirst(detail?.export?.fieldsUnit, detail?.fieldsUnit, view?.fieldsUnit, defaults.export?.fieldsUnit),
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
    fieldsAlias: {
      ...(defaults.fieldsAlias || {}),
      ...(scoped?.fieldsAlias || fallback?.fieldsAlias || transaction?.fieldsAlias || modelConfig.fieldsAlias || {}),
    },
    inputConfig: pickFirst(scoped?.inputConfig, fallback?.inputConfig, transaction?.inputConfig, defaults.inputConfig),
    extraData: pickFirst(scoped?.extraData, fallback?.extraData, transaction?.extraData, defaults.extraData),
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

