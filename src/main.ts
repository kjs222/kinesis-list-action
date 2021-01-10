import * as core from '@actions/core'
import AWS, {Kinesis} from 'aws-sdk'

const kinesis = new Kinesis({
  apiVersion: '2013-12-02'
})

async function listStreams(
  exclusiveStartStreamName: string | undefined
): Promise<Kinesis.ListStreamsOutput> {
  const params: any = {}
  if (exclusiveStartStreamName) {
    params.ExclusiveStartStreamName = exclusiveStartStreamName
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
