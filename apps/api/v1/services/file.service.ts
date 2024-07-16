import { createHash } from 'crypto'
import { getLogger } from '../../lib/log'

export async function hashFile(file: File) {
  const log = getLogger(`file.service:${hashFile.name}`)

  log.debug('Hashing file. File size: %d', file.size)

  const buffer = Buffer.from(await file.arrayBuffer())
  const hash = createHash('sha256').update(buffer).digest('hex')

  log.info('Hashed file. Hash: %s', hash)

  return hash
}
