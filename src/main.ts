import * as core from '@actions/core'
import AWS, {Kinesis} from 'aws-sdk'

AWS.config.credentials = {
  accessKeyId: core.getInput('AWS_ACCESS_KEY_ID'),
  secretAccessKey: core.getInput('AWS_SECRET_ACCESS_KEY')
}

if (!AWS.config.region) {
  core.debug(`setting a region: ${core.getInput('AWS_REGION')}`)
  AWS.config.update({
    region: core.getInput('AWS_REGION')
  })
}

const kinesis = new Kinesis({
  apiVersion: '2013-12-02'
})

async function listStreams(
  exclusiveStartStreamName: string | undefined
): Promise<Kinesis.ListStreamsOutput> {
  const params: any = {}
  if (exclusiveStartStreamName) {
    params.ExclusiveStartStreamName = exclusiveStartStreamName
    core.debug(`setting a start name: ${params.ExclusiveStartStreamName}`)
  }

  return kinesis.listStreams(params).promise()
}

export async function wait(milliseconds: number): Promise<string> {
  return new Promise(resolve => {
    setTimeout(() => resolve('done'), milliseconds)
  })
}

async function listAllStreams(): Promise<string[]> {
  let requestCount = 0
  let hasMoreStreams = true
  let streamNames: string[] = []
  let exclusiveStartStreamName
  while (hasMoreStreams) {
    if (requestCount && requestCount % 5 === 0) {
      core.debug(`Waiting 1000 milliseconds due to AWS request limits`)
      await wait(1000)
    }
    let result: Kinesis.ListStreamsOutput = await listStreams(
      exclusiveStartStreamName
    )
    streamNames = [...streamNames, ...result.StreamNames]
    if (!result.HasMoreStreams) {
      hasMoreStreams = false
    } else {
      exclusiveStartStreamName =
        result.StreamNames[result.StreamNames.length - 1]
    }
    requestCount += 1
  }
  return streamNames
}

async function run(): Promise<void> {
  try {
    const streamNames = await listAllStreams()
    core.setOutput('streamNames', streamNames.join(', '))
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
