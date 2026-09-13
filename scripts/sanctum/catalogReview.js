import { createHash } from 'node:crypto'

export const catalogEntryDigest = entry => createHash('sha256').update(JSON.stringify({
  id: entry.id, name: entry.name, aliases: entry.aliases, descriptions: entry.descriptions
})).digest('hex')

export function applySanctumCatalogReviews(catalog, reviews) {
  return { ...catalog, entries: catalog.entries.map(entry => {
    const review = reviews.entries?.[entry.id]
    if (reviews.patch !== catalog.patch || !review || review.digest !== catalogEntryDigest(entry)) return { ...entry,
      applicability: entry.applicability === 'current' ? 'unverified' : entry.applicability,
      reviewedPatch: null, ruleSupport: 'unreviewed', reviewEvidence: null }
    return { ...entry, applicability: 'current', reviewedPatch: reviews.patch, aliases: [...entry.aliases, ...(review.aliases || [])],
      ...(entry.kind === 'room' && ['fountain', 'merchant', 'pact', 'reward', 'treasure'].includes(review.roomType) ? { roomType: review.roomType } : {}),
      ruleSupport: review.ruleSupport, reviewEvidence: review.evidence }
  }) }
}
