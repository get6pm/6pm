import type { User } from '@prisma/client'
import {
  type PutBlobResult,
  type PutCommandOptions,
  del,
  put,
} from '@vercel/blob'
import { getLogger } from '../../lib/log'
import prisma from '../../lib/prisma'

const BASE_UPLOAD_PATH = process.env.VERCEL_ENV || 'local'

type FindBlobObjectCondition =
  | { id: string }
  | { pathname: string }
  | { url: string }

export async function putBlobObject(args: {
  id?: string
  pathname: string
  file: File
  blobOptions?: PutCommandOptions
  uploadedUser?: User | null
  transactionId?: string | null
}) {
  const {
    id,
    pathname,
    file,
    blobOptions = { access: 'public' },
    uploadedUser,
    transactionId,
  } = args
  const logger = getLogger(`blob.service:${putBlobObject.name}`)
  const blobPathname = `${BASE_UPLOAD_PATH}/${pathname}`

  logger.debug('Uploading blob %o', { ...args, blobPathname })

  let blob: PutBlobResult

  try {
    blob = await put(blobPathname, file, blobOptions)
  } catch (error) {
    logger.error('Error uploading blob %o', error)
    throw error
  }

  logger.info('Uploaded blob %o', blob)
  logger.debug('Saving blob metadata...')

  // Save blob metadata to database
  const blobObject = await prisma.blobObject.create({
    data: {
      id,
      pathname: blob.pathname,
      contentType: blob.contentType,
      contentDisposition: blob.contentDisposition,
      downloadUrl: blob.downloadUrl,
      url: blob.url,
      uploadedByUser: uploadedUser
        ? { connect: { id: uploadedUser.id } }
        : undefined,
      transaction: transactionId
        ? { connect: { id: transactionId } }
        : undefined,
    },
  })

  logger.info('Saved blob metadata %o', blobObject)

  return blobObject
}

export async function getBlobObject(condition: FindBlobObjectCondition) {
  const logger = getLogger(`blob.service:${getBlobObject.name}`)
  logger.debug('Getting blob %o', condition)

  const blobObject = await prisma.blobObject.findFirst({
    where: condition,
  })

  logger.debug('Got blob %o', blobObject)

  return blobObject
}

export async function deleteBlobObject(condition: FindBlobObjectCondition) {
  const logger = getLogger(`blob.service:${deleteBlobObject.name}`)
  logger.debug('Deleting blob %o', condition)

  const blobObject = await getBlobObject(condition)

  if (!blobObject) {
    logger.warn('Blob not found in DB. Condition: %o', condition)
  } else {
    logger.debug('Deleting blob from DB %o', blobObject)

    await prisma.blobObject.delete({
      where: { id: blobObject.id },
    })

    logger.info('Deleted blob from DB %o', blobObject)
  }

  const blobUrl =
    blobObject?.url || ('url' in condition && condition.url) || null

  if (!blobUrl) {
    logger.warn('Blob URL not found. Abort deleting.')
    return false
  }

  // Delete blob on Vercel Blob
  try {
    logger.debug('Deleting blob on Vercel with URL: %s', blobUrl)

    await del(blobUrl)

    logger.info('Deleted blob on Vercel with URL: %s', blobUrl)
  } catch (error) {
    logger.error(
      'Error deleting blob on Vercel with URL %s. Error: %o',
      blobUrl,
      error,
    )

    return false
  }

  return true
}
