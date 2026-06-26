import { resolvePublicAppUrl } from '@/config/env'

const TRANSFER_NAKLADNOY_PATH = '/transfer/nakladnoy'

export function getTransferNakladnoyPath(transferId: string): string {
  return `${TRANSFER_NAKLADNOY_PATH}/${transferId}`
}

export function getTransferNakladnoyUrl(transferId: string): string {
  const base = resolvePublicAppUrl()
  if (!base) {
    return getTransferNakladnoyPath(transferId)
  }

  return `${base}${getTransferNakladnoyPath(transferId)}`
}

export function parseTransferIdFromQrScan(decodedText: string): string | null {
  const trimmed = decodedText.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed, window.location.origin)
    const match = url.pathname.match(
      /\/transfer\/nakladnoy\/([a-f\d]{24})/i,
    )
    if (match?.[1]) return match[1]
  } catch {
    // not a full URL
  }

  const pathMatch = trimmed.match(/\/transfer\/nakladnoy\/([a-f\d]{24})/i)
  if (pathMatch?.[1]) return pathMatch[1]

  if (/^[a-f\d]{24}$/i.test(trimmed)) return trimmed

  return null
}

export function canShowTransferQr(
  status: 'draft' | 'sent' | 'completed',
): boolean {
  return status === 'sent' || status === 'completed'
}
