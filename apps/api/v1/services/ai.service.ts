import type { CategoryType } from '@prisma/client'
import { OpenAI } from 'openai'
import { getLogger } from '../../lib/log'
import { createAiCache, findAiCacheByQuery } from './ai-cache.service'
import { hashFile } from './file.service'

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID!

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function uploadVisionFile({
  file,
}: {
  file: File
}) {
  const log = getLogger(`ai.service:${uploadVisionFile.name}`)

  log.debug('Uploading vision file. File size: %d', file.size)

  const uploadedFile = await openai.files.create({
    file,
    purpose: 'vision',
  })

  log.info('Uploaded vision file. File ID: %s', uploadedFile.id)
  log.debug('Uploaded vision file. File details: %o', uploadedFile)

  return uploadedFile
}

export async function deleteFile({ fileId }: { fileId: string }) {
  const log = getLogger(`ai.service:${deleteFile.name}`)
  log.debug('Deleting file. File ID: %s', fileId)
  const deletedFile = await openai.files.del(fileId)

  log.info('Deleted file. File ID: %s', fileId)
  log.debug('Deleted file. File details: %o', deletedFile)

  return deletedFile
}

export async function generateTransactionDataFromFile({
  file: inputFile,
  noteLanguage = 'English',
  categories,
}: {
  file: File
  noteLanguage?: string
  categories?: {
    id: string
    name: string
    icon?: string | null
    type?: CategoryType
  }[]
}) {
  const log = getLogger(`ai.service:${generateTransactionDataFromFile.name}`)
  const additionalInstructions = `note must be in ${noteLanguage} language but do not translate names. Categories: ${JSON.stringify(categories?.map((cat) => ({ id: cat.id, name: cat.name, icon: cat.icon, type: cat.type })) || [])}`

  // If cached, return cached response
  const fileHash = await hashFile(inputFile)
  const cacheQuery = `transaction_file:${JSON.stringify({
    fileHash,
    additionalInstructions,
  })}`

  log.debug('Checking cache for query: %s', cacheQuery)

  const cachedResponse = await findAiCacheByQuery({ query: cacheQuery })

  if (cachedResponse) {
    log.info('Found cached response for query: %s', cacheQuery)
    return JSON.parse(cachedResponse.response)
  }

  const file = await uploadVisionFile({ file: inputFile })

  log.debug('Creating thread with uploaded file. File ID: %s', file.id)

  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: 'user',
        content: [{ type: 'image_file', image_file: { file_id: file.id } }],
      },
    ],
  })

  log.info('Created thread with uploaded file. Thread ID: %s', thread.id)
  log.debug('Created thread with uploaded file. Thread details: %o', thread)

  log.debug(
    'Running assistant on thread.\nAssistant ID: %s\nAdditional instructions: %s',
    ASSISTANT_ID,
    additionalInstructions,
  )

  const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
    assistant_id: ASSISTANT_ID,
    additional_instructions: additionalInstructions,
  })

  log.info('Ran assistant on thread. Run ID: %s', run.id)

  async function cleanup() {
    // Delete the file after processing
    await deleteFile({ fileId: file.id })
    // Delete the thread after processing
    log.debug('Deleting thread. Thread ID: %s', thread.id)
    await openai.beta.threads.del(thread.id)
    log.info('Deleted thread. Thread ID: %s', thread.id)
  }

  if (run.status === 'completed') {
    const messages = await openai.beta.threads.messages.list(run.thread_id)
    const firstMessage = messages.data[0].content[0]

    const aiTransactionData =
      firstMessage.type === 'text' ? JSON.parse(firstMessage.text.value) : null

    log.info('AI transaction data: %o', aiTransactionData)

    cleanup()

    // save to cache
    createAiCache({
      query: cacheQuery,
      response: JSON.stringify(aiTransactionData),
    })

    return aiTransactionData
  }

  log.error('Assistant run failed. Run details: %o', run)
  cleanup()
  throw new Error('Assistant run failed')
}
