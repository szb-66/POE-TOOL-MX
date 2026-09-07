export function observeCharacterExperience(previous, character, now = Date.now()) {
  if (!Number.isSafeInteger(character?.experience) || character.experience < 0) return null
  const date = new Date(now).toDateString()
  const identity = JSON.stringify([character.accountName, character.league, character.name])
  const sameSession = previous?.date === date && previous.identity === identity
  const sameCharacter = previous?.identity === identity
  const retained = sameCharacter ? (previous.points || []) : []
  const cutoff = now - 86400000
  const baseline = retained.filter(point => Date.parse(point.at) <= cutoff).at(-1)
  const points = retained.filter(point => Date.parse(point.at) > cutoff)
  if (baseline) points.unshift(baseline)
  points.push({ at: new Date(now).toISOString(), experience: character.experience })
  return {
    date, identity,
    first: sameSession ? previous.first : character.experience,
    latest: character.experience,
    samples: sameSession ? previous.samples + 1 : 1,
    points,
    sampledAt: new Date(now).toISOString()
  }
}

export function characterExperienceGrowth(observation, now = Date.now()) {
  if (!observation || observation.date !== new Date(now).toDateString() || observation.samples < 2) return null
  return experienceDelta(observation.first, observation.latest)
}
import { experienceDelta } from '../../../shared/experienceStatistics.js'
