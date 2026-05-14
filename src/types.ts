export type DeepPartial<T> = T extends (...args: any[]) => any
  ? T
  : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T

export type PlatformKey = 'web' | 'mobile'

export type KnownFieldType =
  | 'text'
  | 'textarea'
  | 'password'
  | 'number'
  | 'currency'
  | 'radio'
  | 'select'
  | 'lookup'
  | 'date'
  | 'daterange'
  | 'month'
  | 'year'
  | 'time'
  | 'checkbox'
  | 'checkbox-group'
  | 'switch'
  | 'image'
  | 'file'
  | 'tag'
  | 'location'
  | 'multi-location'
  | 'rich-text'
  | 'icon-select'
  | 'table'
  | 'dynamic-form'
  | 'separator'
  | 'canvas'
  | 'file-manager'
  | 'iso-clause'
  | 'master-lookup'
  | 'custom'

import type { ZodTypeAny } from 'zod'

export type FieldType = KnownFieldType | (string & {})

export type FieldDependency = {
  fields: string[]
  visibility?: {
    validator: (value: Record<string, any>) => boolean
    default: boolean
    value?: boolean
  }
  disabled?: {
    validator: (value: Record<string, any>) => boolean
    default: boolean
    value?: boolean
  }
  props?: {
    generator: (value: Record<string, any>, currentValue: any) => Record<string, any>
    default: Record<string, any>
    value?: Record<string, any>
  }
  inputConfig?: {
    generator: (value: Record<string, any>) => Partial<ModelFormField>
    default: Partial<ModelFormField>
  }
  value?: {
    generator: (value: Record<string, any>) => any
    default: any
  }
}

export type ModelFormField = {
  type: FieldType
  rendererKey?: string
  /** @deprecated Prefer rendererKey and platform renderer registries. */
  component?: unknown
  span?: number
  colSpan?: number
  rowSpan?: number
  dependency?: FieldDependency
  platform?: {
    web?: Partial<ModelFormField>
    mobile?: Partial<ModelFormField>
  }
  props?: Record<string, any> & {
    required?: boolean
    validation?: ZodTypeAny
  }
  propGenerator?: Record<string, (formData: Record<string, any>) => any>
}

export type InputConfig = Record<string, ModelFormField>

export type CommonModelConfig = {
  fields?: string[]
  fieldsAlias?: Record<string, string>
}

export type CommonViewConfig = CommonModelConfig & {
  getAPI?: string
  fieldsDictionary?: Record<string, Record<string, string>>
  fieldsParse?: Record<string, string>
  fieldsProxy?: Record<string, string>
  fieldsType?: Record<string, { type: string; props?: any }>
  fieldsUnit?: Record<string, string>
  searchParameters?: Record<string, any>
}

export type ListConfig = CommonViewConfig & {
  uid?: string
  deleteAPI?: string
  fieldsClass?: Record<string, string>
  fieldsHeaderClass?: Record<string, string>
  fieldsAlign?: Record<string, 'start' | 'center' | 'end'>
  filter?: {
    fields?: string[]
    fieldsAlias?: Record<string, string>
    inputConfig?: InputConfig
  }
  toggleableFields?: string[]
  draggable?: boolean
  onDragChange?: (event: any) => void
  export?: Omit<CommonViewConfig, 'getAPI' | 'searchParameters'> & {
    allow?: boolean
    exportAPI?: string
    onExport?: (params: { exportAPI: string; params: Record<string, any>; listConfig: ListConfig }) => void
  }
}

export type DetailConfig = CommonViewConfig & {
  dataID?: string
  export?: Omit<CommonViewConfig, 'getAPI' | 'searchParameters'> & {
    title?: string
    allow?: boolean | ((data: Record<string, any>) => boolean)
    onExport?: (params: { getAPI: string; params: Record<string, any>; detailConfig: DetailConfig }) => void
  }
}

export type CommonTransactionConfig = CommonModelConfig & {
  targetAPI?: string
  inputConfig?: InputConfig
  extraData?: Record<string, any>
  getInitialData?: () => Promise<Record<string, any>>
  onSuccess?: (params: { formData: Record<string, any>; res: Record<string, any> }) => void
}

export type CreateConfig = CommonTransactionConfig

export type UpdateConfig = CommonTransactionConfig & {
  getAPI?: string
  dataID?: string
  searchParameters?: Record<string, any>
}

export type ViewConfig = CommonViewConfig & {
  list?: ListConfig
  detail?: DetailConfig
}

export type TransactionConfig = CommonTransactionConfig & {
  create?: CreateConfig
  update?: UpdateConfig
}

export type ModelConfig = CommonModelConfig & {
  name: string
  title: string
  modelAPI?: string
  permission?: string
  actions?: {
    create?: boolean
    update?: boolean
    delete?: boolean
    detail?: boolean
  }
  view?: ViewConfig
  transaction?: TransactionConfig
}

export type ModelConfigOverride = DeepPartial<ModelConfig>

export type EvaluatedFieldDependency = {
  fields: string[]
  visibility?: {
    default: boolean
    value: boolean
  }
  disabled?: {
    default: boolean
    value: boolean
  }
  props?: {
    default: Record<string, any>
    value: Record<string, any>
  }
  inputConfig?: {
    default: Partial<ModelFormField>
    value: Partial<ModelFormField>
  }
  value?: {
    default: any
    value: any
  }
}

export type FieldDependencyEvaluation = Record<string, EvaluatedFieldDependency>
