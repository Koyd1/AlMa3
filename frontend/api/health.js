import { withCors } from '../_lib/cors.js'

export default withCors(function handler(req, res) {
  res.status(200).json({ status: 'ok' })
})
