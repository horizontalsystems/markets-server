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
 * @apiVersion 1.0.0
 * @apiGroup NFT
 *
 * @apiParam {String}                          [asset_owner] Asset owner address. If not specified all collections will be returned
 * @apiParam {Number{-2147483648-2147483648}}  [offset]      For pagination. Number of contracts offset (Deprecated and will we replaced by page parameter)
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
 * @apiGroup NFT
 *
 * @apiParam {String}  [collection_uid] UID (collection slug) of the collection to retrieve details for
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
 *    }
 *  }
 *  @apiError (Bad Request 400)  ValidationError Some parameters or Collection UID/slug are not valid
 *  @apiError (Not Found 404)    NotFound        Collection does not exist
 */

router.get('/collection/:collection_uid', controller.collection)

/**
 * @api {get} /v1/nft/collection/:collection_uid/stats Get NFT Collection stats data
 * @apiDescription Get NFT Collection details
 * @apiVersion 1.0.0
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
 * @apiGroup NFT
 *
 * @apiParam {String}                          [owner]                     The address of the owner of the assets
 * @apiParam {String}                          [token_ids]                 Comma separated token_IDs to search
 * @apiParam {String}                          [contract_addresses]        Comma separated contract addresses to search
 * @apiParam {String}                          [collection]                Limit responses to members of a collection
 * @apiParam {String=asc,desc}                 [order_direction]           Can be asc for ascending or desc for descending
 * @apiParam {Number{-2147483648-2147483648}}  [offset]                    For pagination (Deprecated and will we replaced by page parameter)
 * @apiParam {Number{-2147483648-2147483648}}  [page=1]                    For pagination.
 * @apiParam {NUmber{1-50}}                    [limit]                     Limit. Defaults to 20, capped at 50.
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 * [
 *  {
 *     "token_id": "5550",
 *     "name": "Torao #5550",
 *     "description": "Karafuru is home to 5,555 generative arts",
 *     "contract" {
 *        "address": "0xd2f668a8461d6761115daf8aeb3cdf5f40c532c6",
 *        "type": "ERC721",
 *     }
 *     "symbol": "KARAFURU",
 *     "collection_uid": "karafuru",
 *     "attributes": [],
 *     "image_data": {
 *       "image_url": "https://",
 *       "image_preview_url": "https://"
 *     },
 *     "links": {
 *       "permalink": "https://opensea.io/assets/
 *     },
 *     "market_data": {
 *       "last_sale": {},
 *       "sell_orders": null
 *       "orders": {}
 *     }
 *   }
 * ]
 *
 *  @apiError (Bad Request 400)  ValidationError Some parameters are not valid
 */

router.get('/assets', validateAssets, controller.assets)

/**
 * @api {get} /v1/nft/asset/:contract_address/:token_id Get NFT Asset details
 * @apiDescription Get NFT asset details
 * @apiVersion 1.0.0
 * @apiGroup NFT
 *
 * @apiParam {String}  contract_address  Address of the contract for this NFT
 * @apiParam {String}  token_id          Token ID for this item
 * @apiParam {String}  account_address   Address of an owner of the token
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

module.exports = router
