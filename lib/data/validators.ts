import type { AiImportBatchPayload, AiImportPayload, LinkEnv } from '@/lib/types'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isLinkEnv(value: unknown): value is LinkEnv {
  return value === 'test' || value === 'prod'
}

export function isAiImportPayload(value: unknown): value is AiImportPayload {
  if (!isPlainObject(value)) {
    return false
  }

  if (!isPlainObject(value.category) || typeof value.category.name !== 'string') {
    return false
  }

  if (!Array.isArray(value.links) || value.links.length === 0) {
    return false
  }

  return value.links.every((link) => {
    if (!isPlainObject(link)) {
      return false
    }

    if (typeof link.name !== 'string' || typeof link.url !== 'string') {
      return false
    }

    if (link.env !== undefined && !isLinkEnv(link.env)) {
      return false
    }

    return true
  })
}

export function isAiImportBatchPayload(value: unknown): value is AiImportBatchPayload {
  return Array.isArray(value) && value.length > 0 && value.every(isAiImportPayload)
}
