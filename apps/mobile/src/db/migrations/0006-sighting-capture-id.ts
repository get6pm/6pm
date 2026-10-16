/**
 * The capture a sighting came from (an email's, a shared receipt's id), so one fetched again is
 * known by its id: two payments printed in the same minute are never taken for one.
 */
export const sql = `
  ALTER TABLE spend_sightings ADD COLUMN capture_id TEXT;
  CREATE INDEX spend_sightings_capture ON spend_sightings (capture_id);
`;
