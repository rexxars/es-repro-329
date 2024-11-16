const { createServer } = require('http')
const { EventSource: EventSourceV3 } = require('eventsource-v3')
const EventSourceV2 = require('eventsource-v2')

const PORT = 3366

// Switch this to EventSourceV2 / EventSourceV3 to spot any difference
const EventSource = EventSourceV3

// Modelled after https://github.com/EventSource/eventsource/issues/329#issuecomment-2479864394
async function gen() {
  // …do some unrelated request here…

  const esurl = `http://localhost:${PORT}/`
  const es = new EventSource(esurl)
  espromise = new Promise((resolve, reject) => {
    es.onmessage = async ({ data }) => {
      data = JSON.parse(data)
      const { msg } = data
      if (msg !== 'process_completed') {
        return
      }
      
      await wget(data.output.data[0].image.url)
      es.onerror = es.onclose = () => {
        resolve()
        es.close()
      }
    }

    es.onerror = (err) => {
      if (err?.message) {
        reject(err.message)
      }
    }
    es.onclose = () => {
      resolve()
    }
  })

  try {
    return await espromise
  } finally {
    es.close()
  }
}

async function runClient() {
  for (let i = 0; i < 3; i++) {
    try {
      await gen()
      break
    } catch (err) {
      console.error('gen error', err)
    }
  }

  console.log('exit')
}

// Always rejects after 100ms
function wget(_url) {
  return new Promise((_resolve, reject) => {
    setTimeout(reject, 100, new Error('wget error'))
  })
}

// Server
const server = createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })

  // Wait a tiny bit before writing the first message
  const jsonData = JSON.stringify({
    msg: 'process_completed',
    output: {data: [{image: {url: 'http://some.url/'}}]}
  })

  setTimeout(() => res.write(`data: ${jsonData}\n\n`), 50)
})

server.listen(PORT, runClient)
