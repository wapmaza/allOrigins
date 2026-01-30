/*!
 * AllOrigins
 * written by Gabriel Nunes <gabriel@multiverso.me>
 * http://github.com/gnuns
 */

const app = require('./app.js')

// For Vercel serverless functions, we need to export the handler
module.exports = app

// For local development, start the server
if (require.main === module) {
  const port = process.env.PORT || 3000
  console.log(`Starting allOrigins v${global.AO_VERSION}`)
  app.listen(port, () => console.log('Listening on', port))
}
