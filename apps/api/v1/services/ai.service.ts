import { OpenAI } from 'openai'
import { getLogger } from '../../lib/log'

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
}: { file: File }) {
  const log = getLogger(`ai.service:${generateTransactionDataFromFile.name}`)

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
  log.debug('Running assistant on thread. Assistant ID: %s', ASSISTANT_ID)

  const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
    assistant_id: ASSISTANT_ID,
    // TODO: PUT USER CATEGORIES HERE LATER
    // additional_instructions: '<PUT USER CATEGORIES HERE LATER>',
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

    log.debug('First message: %o', firstMessage)

    const aiTransactionData =
      firstMessage.type === 'text' ? JSON.parse(firstMessage.text.value) : null

    log.info('AI transaction data: %o', aiTransactionData)

    await cleanup()

    return aiTransactionData
  }

  log.error('Assistant run failed. Run details: %o', run)
  await cleanup()
  throw new Error('Assistant run failed')
}
