import { describe, expect, it } from 'vitest'
import { buildDetailConfig, buildFormConfig, buildListConfig, evaluateFieldDependencies, resolveModelConfig, type ModelConfig } from '../index'

describe('model-meta runtime helpers', () => {
  const baseModel: ModelConfig = {
    name: 'users',
    title: 'Users',
    fields: ['name', 'status'],
    view: {
      list: {
        filter: {
          inputConfig: {
            status: {
              type: 'radio',
              props: {
                data: [{ id: 'active', name: 'Active' }],
              },
            },
          },
        },
      },
    },
    transaction: {
      inputConfig: {
        name: { type: 'text', props: { required: true } },
        status: {
          type: 'select',
          platform: {
            mobile: {
              type: 'radio',
            },
          },
        },
      },
    },
  }

  it('resolves platform overrides', () => {
    const resolved = resolveModelConfig(baseModel, undefined, 'mobile')
    expect(resolved.transaction?.inputConfig?.status?.type).toBe('radio')
  })

  it('preserves bind definitions through config merging', () => {
    const resolved = resolveModelConfig(baseModel, {
      transaction: {
        inputConfig: {
          name: {
            bind: {
              uploadState: 'nameUploadState',
              previewOpen: 'namePreviewOpen',
            },
          },
        },
      },
    })

    expect(resolved.transaction?.inputConfig?.name?.bind).toEqual({
      uploadState: 'nameUploadState',
      previewOpen: 'namePreviewOpen',
    })
  })

  it('builds list/detail/form configs deterministically', () => {
    expect(buildListConfig(baseModel).fields).toEqual(['name', 'status'])
    expect(buildDetailConfig(baseModel).fields).toEqual(['name', 'status'])
    expect(buildFormConfig(baseModel, 'create').fields).toEqual(['name', 'status'])
  })

  it('merges fieldsType with defaults instead of replacing them', () => {
    const model: ModelConfig = {
      name: 'jobs',
      fields: ['name', 'active'],
      view: {
        fieldsType: {
          name: { type: 'html' },
        },
      },
    }

    const defaults = {
      fieldsType: {
        active: {
          type: 'chip',
          props: {
            options: {
              true: { label: 'Active' },
            },
          },
        },
      },
      export: {
        fieldsType: {
          active: {
            type: 'chip',
          },
        },
      },
    }

    expect(buildListConfig(model, defaults).fieldsType).toEqual({
      active: {
        type: 'chip',
        props: {
          options: {
            true: { label: 'Active' },
          },
        },
      },
      name: { type: 'html' },
    })

    expect(buildDetailConfig(model, defaults).fieldsType).toEqual({
      active: {
        type: 'chip',
        props: {
          options: {
            true: { label: 'Active' },
          },
        },
      },
      name: { type: 'html' },
    })
  })

  it('extends other object configs from defaults across list/detail/form builders', () => {
    const model: ModelConfig = {
      name: 'jobs',
      title: 'Jobs',
      fields: ['name', 'active'],
      fieldsAlias: {
        name: 'Model Name',
        active: 'Model Status',
      },
      view: {
        fieldsAlias: {
          name: 'View Name',
        },
        fieldsParse: {
          active: 'boolean-label',
        },
        searchParameters: {
          page: 1,
        },
        list: {
          fieldsAlias: {
            active: 'List Status',
          },
          fieldsAlign: {
            active: 'center',
          },
          searchParameters: {
            sort: 'asc',
          },
          filter: {
            fieldsAlias: {
              active: 'Filter Status',
            },
            inputConfig: {
              status: {
                type: 'radio',
                props: {
                  data: [{ id: 'active', name: 'Active' }],
                },
              },
            },
          },
        },
      },
      transaction: {
        inputConfig: {
          active: {
            props: {
              required: false,
            },
          },
        },
        create: {
          inputConfig: {
            name: {
              props: {
                required: false,
                placeholder: 'Job title',
              },
            },
          },
        },
      },
    }

    const listConfig = buildListConfig(model, {
      fieldsAlias: {
        created_at: 'Created At',
      },
      fieldsParse: {
        created_at: 'datetime',
      },
      fieldsAlign: {
        name: 'start',
      },
      searchParameters: {
        limit: 10,
      },
      filter: {
        fieldsAlias: {
          name: 'Filter Name',
        },
        inputConfig: {
          active: {
            type: 'radio',
            props: {
              data: [{ id: true, name: 'Yes' }],
            },
          },
        },
      },
    })

    expect(listConfig.fieldsParse).toEqual({
      created_at: 'datetime',
      active: 'boolean-label',
    })
    expect(listConfig.fieldsAlias).toEqual({
      created_at: 'Created At',
      name: 'View Name',
      active: 'List Status',
    })
    expect(listConfig.fieldsAlign).toEqual({
      name: 'start',
      active: 'center',
    })
    expect(listConfig.searchParameters).toEqual({
      limit: 10,
      page: 1,
      sort: 'asc',
    })
    expect(listConfig.filter?.inputConfig).toEqual({
      active: {
        type: 'radio',
        props: {
          data: [{ id: true, name: 'Yes' }],
        },
      },
      status: {
        type: 'radio',
        props: {
          data: [{ id: 'active', name: 'Active' }],
        },
      },
    })
    expect(listConfig.filter?.fieldsAlias).toEqual({
      name: 'Filter Name',
      active: 'Filter Status',
    })

    const detailConfig = buildDetailConfig(model, {
      fieldsAlias: {
        created_at: 'Created At',
      },
    })

    expect(detailConfig.fieldsAlias).toEqual({
      created_at: 'Created At',
      name: 'View Name',
      active: 'Model Status',
    })

    const formConfig = buildFormConfig(model, 'create', {
      fieldsAlias: {
        created_at: 'Created At',
      },
      inputConfig: {
        name: {
          type: 'text',
          props: {
            required: true,
          },
        },
        active: {
          type: 'radio',
          props: {
            defaultValue: true,
          },
        },
      },
      extraData: {
        source: 'defaults',
      },
    })

    expect(formConfig.inputConfig).toEqual({
      name: {
        type: 'text',
        props: {
          required: false,
          placeholder: 'Job title',
        },
      },
      active: {
        type: 'radio',
        props: {
          defaultValue: true,
          required: false,
        },
      },
    })
    expect(formConfig.fieldsAlias).toEqual({
      created_at: 'Created At',
      name: 'Model Name',
      active: 'Model Status',
    })
  })

  it('evaluates dependencies without framework context', () => {
    const deps = evaluateFieldDependencies(
      { login_method: 'sso' },
      {
        username: {
          type: 'text',
          dependency: {
            fields: ['login_method'],
            visibility: {
              default: true,
              validator: ({ login_method }) => login_method === 'local',
            },
          },
        },
      }
    )

    expect(deps.username?.visibility?.value).toBe(false)
  })
})
