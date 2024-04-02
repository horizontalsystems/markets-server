const express = require('express')
const controller = require('./stats.controller')

const router = express.Router()

/**
 * @api {POST} /v1/stats Page stats
 * @apiDescription Page stats
 * @apiVersion 1.0.0
 * @apiGroup Stats
 *
 * @apiParam  {String}  event       Event name
 * @apiParam  {String}  event_page  Event page
 * @apiParam  {String}  [page]      Page
 * @apiParam  {String}  [tab]       tab
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {}
 */
router.post('/', controller.stats)

router.get('/pages', controller.pages)
router.get('/events', controller.events)

module.exports = router


