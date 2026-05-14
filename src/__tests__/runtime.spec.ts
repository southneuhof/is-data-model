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

  it('builds list/detail/form configs deterministically', () => {
    expect(buildListConfig(baseModel).fields).toEqual(['name', 'status'])
    expect(buildDetailConfig(baseModel).fields).toEqual(['name', 'status'])
    expect(buildFormConfig(baseModel, 'create').fields).toEqual(['name', 'status'])
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
