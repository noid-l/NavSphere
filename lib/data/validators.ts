import type { DataImportBatchPayload, DataImportPayload, LinkEnv } from '@/lib/types'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isLinkEnv(value: unknown): value is LinkEnv {
  return value === 'test' || value === 'prod'
}

export function isDataImportPayload(value: unknown): value is DataImportPayload {
  if (!isPlainObject(value)) {
    return false
  }

  if (!isPlainObject(value.category) || typeof value.category.name !== 'string') {
    return false
  }

  if (!Array.isArray(value.links)) {
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

export function isDataImportBatchPayload(value: unknown): value is DataImportBatchPayload {
  return Array.isArray(value) && value.length > 0 && value.every(isDataImportPayload)
}

export const isAiImportPayload = isDataImportPayload
export const isAiImportBatchPayload = isDataImportBatchPayload
