import * as core from '@actions/core'
import AWS, {Kinesis} from 'aws-sdk'

const kinesis = new Kinesis({
  apiVersion: '2013-12-02'
})

async function listStreams(
  exclusiveStartStreamName: string | undefined
): Promise<Kinesis.ListStreamsOutput> {
  const params: any = {Limit: 2}
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
    core.debug(`requestCount: ${requestCount}`)
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
    let streamNames = await listAllStreams()
    if (core.getInput('match')) {
      streamNames = streamNames.filter(sName =>
        sName.includes(core.getInput('match'))
      )
    }
    core.setOutput('streamNames', streamNames.join(', '))
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
