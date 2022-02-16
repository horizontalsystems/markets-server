const express = require('express')
const controller = require('./nft.controller')

const router = express.Router()

/**
 * @apiDefine NFT Collections
 */

/**
 * @api {get} /v1/nft/collections Get NFT Collections
 * @apiDescription Get NFT Collections
 * @apiVersion 1.0.0
 * @apiGroup NFT
 *
 * @apiParam {String}                          asset_owner Currency code
 * @apiParam {Number{-2147483648-2147483648}}  offset For pagination. Number of contracts offset
 * @apiParam {NUmber{1-300}}                   limit For pagination. Maximum number of contracts to return
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

router.get('/collections', controller.collections)

/**
 * @api {get} /v1/nft/collection Get NFT Collection details
 * @apiDescription Get NFT Collection details
 * @apiVersion 1.0.0
 * @apiGroup NFT
 *
 * @apiParam {String}  collection_uid UID (collection slug) of the collection to retrieve details for
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
 * @api {get} /v1/nft/assets Get NFT Assets
 * @apiDescription Get NFT assets
 * @apiVersion 1.0.0
 * @apiGroup NFT
 *
 * @apiParam {String}                          owner                     The address of the owner of the assets
 * @apiParam {String}                          token_ids                 Comma separated token_IDs to search
 * @apiParam {String}                          contract_addresses        Comma separated contract addresses to search
 * @apiParam {String}                          collection                Limit responses to members of a collection
 * @apiParam {String=asc,desc}                 order_direction           Can be asc for ascending or desc for descending
 * @apiParam {Number{-2147483648-2147483648}}  offset                    Offset
 * @apiParam {NUmber{1-50}}                    limit                     Limit. Defaults to 20, capped at 50.
 *
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 * [
 *  {
 *     "token_id": "5550",
 *     "name": "Torao #5550",
 *     "description": "Karafuru is home to 5,555 generative arts",
 *     "contract_address": "0xd2f668a8461d6761115daf8aeb3cdf5f40c532c6",
 *     "contract_type": "ERC721",
 *     "symbol": "KARAFURU",
 *     "collection_uid": "karafuru",
 *     "image_data": {
 *       "image_url": "https://",
 *       "image_preview_url": "https://"
 *     },
 *     "links": {
 *       "permalink": "https://opensea.io/assets/
 *     },
 *     "attributes": [],
 *     "last_sale": {},
 *     "sell_orders": null
 *   }
 * ]
 *
 *  @apiError (Bad Request 400)  ValidationError Some parameters are not valid
 */

router.get('/assets', controller.assets)

/**
 * @api {get} /v1/nft/asset Get NFT Asset details
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
 *     "image_data": {
 *       "image_url": "https://",
 *       "image_preview_url": "https://"
 *     },
 *     "links": {
 *       "permalink": "https://opensea.io/assets/
 *     },
 *     "attributes": [],
 *     "last_sale": {},
 *     "sell_orders": null
 *   }
 *
 *  @apiError (Bad Request 400)  ValidationError Some parameters or Asset address are not valid
 *  @apiError (Not Found 404)    NotFound        Asset does not exist
 */

router.get('/asset/:contract_address/:token_id', controller.asset)

module.exports = router
