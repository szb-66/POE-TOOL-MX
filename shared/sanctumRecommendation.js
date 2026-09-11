// Position/geometry and a preset exit are not evidence of room contents.
export const hasSanctumRoomContents = (room, floor) => Boolean(room
  && ['matched', 'manual'].includes(room.detailsStatus)
  && (room.revealed !== false || room.detailsStatus === 'manual'
    || !floor?.rerolled && floor?.mapKey != null && Object.values(room.knowledge || {}).some(fact =>
      fact?.status === 'known' && fact.source === 'observed' && fact.mapKey === floor.mapKey)))
