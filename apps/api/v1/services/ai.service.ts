import type { CategoryType, User } from '@prisma/client'
import { OpenAI } from 'openai'
import { getLogger } from '../../lib/log'
import { createAiCache, findAiCacheByQuery } from './ai-cache.service'
import { putBlobObject } from './blob.service'
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

function generateAdditionalInstruction({
  noteLanguage,
  categories,
}: {
  noteLanguage: string
  categories: {
    id: string
    name: string
    icon?: string | null
    type?: CategoryType
  }[]
}) {
  const template = `<categories>
{{user_categories}}
</categories>

<additional_info>
- Current datetime: {{current_datetime}}
- User's prefer language: {{user_prefer_lang}}
- User's prefer currency: {{user_prefer_currency}}
</additional_info>`

  const userCategories = JSON.stringify(categories)

  const instruction = template
    .replace('{{user_categories}}', userCategories)
    .replace('{{current_datetime}}', new Date().toISOString())
    .replace('{{user_prefer_lang}}', noteLanguage)
    .replace('{{user_prefer_currency}}', '<unknown>')

  return instruction
}

export async function generateTransactionDataFromFile({
  file: inputFile,
  noteLanguage = 'English',
  categories = [],
  performUser,
}: {
  file: File
  noteLanguage?: string
  categories?: {
    id: string
    name: string
    icon?: string | null
    type?: CategoryType
  }[]
  performUser?: User
}) {
  const log = getLogger(`ai.service:${generateTransactionDataFromFile.name}`)
  const additionalInstructions = generateAdditionalInstruction({
    noteLanguage,
    categories,
  })

  // If cached, return cached response
  const fileHash = await hashFile(inputFile)
  const cacheQuery = `transaction_file:${JSON.stringify({
    fileHash,
    additionalInstructions,
  })}`
  const blobObjectPathname = `transaction_files/${fileHash}`

  log.debug('Checking cache for query: %s', cacheQuery)

  const cachedResponse = await findAiCacheByQuery({ query: cacheQuery })

  if (cachedResponse) {
    log.info('Found cached response for query: %s', cacheQuery)
    return JSON.parse(cachedResponse.response)
  }

  const [visionFile, blobObject] = await Promise.all([
    uploadVisionFile({ file: inputFile }),
    putBlobObject({
      file: inputFile,
      pathname: blobObjectPathname,
      uploadedUser: performUser,
    }),
  ])

  log.debug('Creating thread with uploaded file. File ID: %s', visionFile.id)

  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_file', image_file: { file_id: visionFile.id } },
        ],
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
    await deleteFile({ fileId: visionFile.id })
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

    return { ...aiTransactionData, blobObject }
  }

  log.error('Assistant run failed. Run details: %o', run)
  cleanup()
  throw new Error('Assistant run failed')
}
