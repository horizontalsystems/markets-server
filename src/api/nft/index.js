const express = require('express')
const controller = require('./nft.controller')
const { validateCollections, validateAssets } = require('./nft.validator')

const router = express.Router()

/**
 * @apiDefine NFT_Collections
 */

/**
 * @api {get} /v1/nft/collections Get NFT Collections
 * @apiDescription Get NFT Collections
 * @apiDeprecated
 * @apiVersion 1.0.0
 * @apiGroup NFT
 *
 * @apiParam {String}                          [asset_owner] Asset owner address. If not specified all collections will be returned
 * @apiParam {Number{-2147483648-2147483648}}  [offset]      (Deprecated and will we replaced by page parameter)
 * @apiParam {Number{-2147483648-2147483648}}  [page=1]      For pagination. Number of contracts offset
 * @apiParam {NUmber{1-300}}                   [limit=300]   For pagination. Maximum number of collections to return
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  [
 *    {
 *      "uid": "untitled-collection-254887400",
 *      "name": "Untitled Collection #254887400",
 *      "description": null,
 *      "asset_contracts": [],
 *      "image_data": {},
 *      "links": {},
 *      "stats": {}
 *   }
 *  ]
 *
 *  @apiError (Bad Request 400)  ValidationError Some parameters or Owner address are  not valid
 */
router.get('/collections', validateCollections, controller.collections)

/**
 * @api {get} /v1/nft/collection/:collection_uid Get NFT Collection details
 * @apiDescription Get NFT Collection details
 * @apiVersion 1.0.0
 * @apiDeprecated
 * @apiGroup NFT
 *
 * @apiParam {String}  [collection_uid]       UID (collection slug) of the collection to retrieve details for
 * @apiParam {Boolean} [include_stats_chart=false] Return stats charts data
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    "uid": "untitled-collection-254887400",
 *    "name": "Untitled Collection #254887400",
 *    "description": null,
 *    "asset_contracts": [],
 *    "image_data": {
 *       "image_url": null,
 *       "featured_image_url": null
 *    },
 *    "links": {
 *       "external_url": null,
 *       "discord_url": null,
 *       "telegram_url": null,
 *       "twitter_username": null,
 *       "instagram_username": null,
 *       "wiki_url": null
 *    },
 *    "stats": {
 *      "one_day_volume": 0,
 *      "one_day_change": 0,
 *      "one_day_sales": 0,
 *      "one_day_average_price": 0,
 *      "seven_day_volume": 0,
 *      "seven_day_change": 0,
 *      "seven_day_sales": 0,
 *      "seven_day_average_price": 0,
 *      "thirty_day_volume": 0,
 *      "thirty_day_change": 0,
 *      "thirty_day_sales": 0,
 *      "thirty_day_average_price": 0,
 *      "total_volume": 0,
 *      "total_sales": 0,
 *      "total_supply": 0,
 *      "count": 0,
 *      "num_owners": 0,
 *      "average_price": 0,
 *      "num_reports": 0,
 *      "market_cap": 0,
 *      "floor_price": 0
 *    },
 *    "stats_chart": [
 *      "timestamp": 123123123,
 *      "one_day_volume": 123,
 *      "avеrage_price": 123,
 *      "floor_price": 123,
 *      "one_day_sales": 123
 *    ]
 *
 *  }
 *  @apiError (Bad Request 400)  ValidationError Some parameters or Collection UID/slug are not valid
 *  @apiError (Not Found 404)    NotFound        Collection does not exist
 */
router.get('/collection/:collection_uid', controller.collection)

/**
 * @api {get} /v1/nft/collection/:collection_uid/chart Get NFT Collection chart
 * @apiDescription Get NFT Collection chart
 * @apiVersion 1.0.0
 * @apiDeprecated
 * @apiGroup NFT
 *
 * @apiParam {String}  [collection_uid]       UID (collection slug) of the collection to retrieve details for
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    [
 *      "timestamp": 123123123,
 *      "one_day_volume": 123,
 *      "avеrage_price": 123,
 *      "floor_price": 123,
 *      "one_day_sales": 123
 *    ]
 *  }
 *  @apiError (Bad Request 400)  ValidationError Some parameters or Collection UID/slug are not valid
 *  @apiError (Not Found 404)    NotFound        Collection does not exist
 */
router.get('/collection/:collection_uid/chart', controller.collectionChart)

/**
 * @api {get} /v1/nft/collection/:collection_uid/stats Get NFT Collection stats data
 * @apiDescription Get NFT Collection details
 * @apiVersion 1.0.0
 * @apiDeprecated
 * @apiGroup NFT
 *
 * @apiParam {String}  [collection_uid] UID (collection slug) of the collection to retrieve details for
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    "one_day_volume": 0,
 *    "one_day_change": 0,
 *    "one_day_sales": 0,
 *    "one_day_average_price": 0,
 *    "seven_day_volume": 0,
 *    "seven_day_change": 0,
 *    "seven_day_sales": 0,
 *    "seven_day_average_price": 0,
 *    "thirty_day_volume": 0,
 *    "thirty_day_change": 0,
 *    "thirty_day_sales": 0,
 *    "thirty_day_average_price": 0,
 *    "total_volume": 0,
 *    "total_sales": 0,
 *    "total_supply": 0,
 *    "count": 0,
 *    "num_owners": 0,
 *    "average_price": 0,
 *    "num_reports": 0,
 *    "market_cap": 0,
 *    "floor_price": 0
 *  }
 *  @apiError (Bad Request 400)  ValidationError Some parameters or Collection UID/slug are not valid
 *  @apiError (Not Found 404)    NotFound        Collection does not exist
 */
router.get('/collection/:collection_uid/stats', controller.collectionStats)

/**
 * @api {get} /v1/nft/assets Get NFT Assets
 * @apiDescription Get NFT assets
 * @apiVersion 1.0.0
 * @apiDeprecated
 * @apiGroup NFT
 *
 * @apiParam {String}                          [owner]                     The address of the owner of the assets
 * @apiParam {String}                          [token_ids]                 Comma separated token_IDs to search
 * @apiParam {String}                          [contract_addresses]        Comma separated contract addresses to search
 * @apiParam {String}                          [collection_uid]            Limit responses to members of a collection
 * @apiParam {String}                          [collection]                Deprecated (replaced by collection_uid)
 * @apiParam {String=asc,desc}                 [order_direction]           Can be asc for ascending or desc for descending
 * @apiParam {Boolean}                         [include_orders=false]      A flag determining if order information should be included
 * @apiParam {String}                          [cursor]                    A cursor pointing to the page to retrieve
 * @apiParam {Number{-2147483648-2147483648}}  [offset]                    For pagination (Deprecated and will we replaced by cursor parameter)
 * @apiParam {NUmber{1-50}}                    [limit]                     Limit. Defaults to 20, capped at 50.
 *
 * @apiSuccessExample {json} Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  "cursor": {
 *    "next": "LXBrPTI2ODcyNjk2OA==",
 *    "previous": null
 *  },
 *  "assets":
 *  [
 *    {
 *      "token_id": "5550",
 *      "name": "Torao #5550",
 *      "description": "Karafuru is home to 5,555 generative arts",
 *      "contract" {
 *         "address": "0xd2f668a8461d6761115daf8aeb3cdf5f40c532c6",
 *         "type": "ERC721",
 *      }
 *      "symbol": "KARAFURU",
 *      "collection_uid": "karafuru",
 *      "attributes": [],
 *      "image_data": {
 *        "image_url": "https://",
 *        "image_preview_url": "https://"
 *      },
 *      "links": {
 *        "permalink": "https://opensea.io/assets/
 *      },
 *      "market_data": {
 *        "last_sale": {},
 *        "sell_orders": null
 *        "orders": {}
 *      }
 *    }
 *  ]
 * }
 *
 *  @apiError (Bad Request 400)  ValidationError Some parameters are not valid
 */
router.get('/assets', validateAssets, controller.assets)

/**
 * @api {get} /v1/nft/asset/:contract_address/:token_id Get NFT Asset details
 * @apiDescription Get NFT asset details
 * @apiVersion 1.0.0
 * @apiDeprecated
 * @apiGroup NFT
 *
 * @apiParam {String}  [contract_address]     Address of the contract for this NFT
 * @apiParam {String}  [token_id]             Token ID for this item
 * @apiParam {String}  [account_address]      Address of an owner of the token
 * @apiParam {Boolean} [include_orders=false] A flag determining if order information should be included
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *     "token_id": "5550",
 *     "name": "Torao #5550",
 *     "description": "Karafuru is home to 5,555 generative arts",
 *     "contract_address": "0xd2f668a8461d6761115daf8aeb3cdf5f40c532c6",
 *     "contract_type": "ERC721",
 *     "symbol": "KARAFURU",
 *     "collection_uid": "karafuru",
 *     "attributes": [],
 *     "image_data": {
 *       "image_url": "https://",
 *       "image_preview_url": "https://"
 *     },
 *     "links": {
 *       "external_link": "https://opensea.io/assets/
 *       "permalink": "https://opensea.io/assets/
 *     },
 *     "market_data": {
 *       "last_sale": {},
 *       "sell_orders": null
 *       "orders": {}
 *     }
 *   }
 *
 *  @apiError (Bad Request 400)  ValidationError Some parameters or Asset address are not valid
 *  @apiError (Not Found 404)    NotFound        Asset does not exist
 */
router.get('/asset/:contract_address/:token_id', controller.asset)

/**
 * @api {get} /v1/nft/events Get NFT Events (Activities)
 * @apiDescription Get NFT events
 * @apiVersion 1.0.0
 * @apiDeprecated
 * @apiGroup NFT
 *
 * @apiParam {String} [event_type]       The event type to filter (sale, list, offer, bid, transfer) (do not include param to ignore filter)
 * @apiParam {String} [collection_uid]   Limit responses to events from a collection
 * @apiParam {String} [token_id]         Token ID for this item (When using token_id filter asset_contract is required)
 * @apiParam {String} [asset_contract]   Asset contract address
 * @apiParam {String} [account_address]  A user account's wallet address to filter for events on an account
 * @apiParam {Number} [occured_before]   Only show events listed before this timestamp.
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    "cursor": {
 *      "next": "LXBrPTI2ODcyNjk2OA==",
 *      "previous": null
 *    },
 *    "events":
 *    [
 *      "asset": { ... },
 *      "date": "2022-03-18T04:04:54",
 *      "type": "sale"  -- (Possible values: sale, list, offer, bid, bid_cancel, transfer, cancel and others)",
 *      "amount": "73950000000000000000",
 *      "quantity": "1",
 *      "transaction": { ... },
 *      "markets_data": {
 *        seller: null,
 *        to_account: null,
 *        from_account: null,
 *        owner_account: null,
 *        winner_account: null,
 *        auction_type: "dutch"
 *        payment_token: { ... },
 *      }
   *  ]
 *  }
 *
 *  @apiError (Bad Request 400)  ValidationError Some parameters are not valid
 */
router.get('/events', controller.events)

module.exports = router
