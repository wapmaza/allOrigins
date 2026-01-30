/*!
 * AllOrigins
 * written by Gabriel Nunes <gabriel@multiverso.me>
 * http://github.com/gnuns
 */
const express = require('express')
const puppeteer = require('puppeteer')

const { version } = require('./package.json')
// yep, global. it's ok
// https://softwareengineering.stackexchange.com/a/47926/289420
global.AO_VERSION = version

const processRequest = require('./app/process-request')
console.log("processRequest");
console.log(processRequest);

function enableCORS(req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Credentials', true)
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Content-Encoding, Accept'
  )
  res.header(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PATCH, PUT, DELETE'
  )
  res.header('Via', `allOrigins v${version}`)
  next()
}

module.exports = (function app() {
  const app = express()

  app.set('case sensitive routing', false)
  app.set('jsonp callback name', 'callback')
  app.disable('x-powered-by')
  app.enable("trust proxy")
  app.use(enableCORS)

  // accept optional device segment, e.g. /raw/mobile to request with mobile UA
  app.all('/:format(get|raw|json|info)/:device?', processRequest)

  // Puppeteer route
  app.get('/raw/pup', async (req, res) => {
    try {
      const url = req.query.url
      if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' })
      }

      const browser = await puppeteer.launch()
      const page = await browser.newPage()
      
      // Set a User-Agent to look like a real browser
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')

      await page.goto(url, { waitUntil: 'networkidle2' })

      const content = await page.content()
      console.log("Page Loaded")
      
      await browser.close()
      
      res.json({ content })
    } catch (error) {
      console.error('Error:', error)
      res.status(500).json({ error: 'Failed to fetch page' })
    }
  })

  return app
})()
