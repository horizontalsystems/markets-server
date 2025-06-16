const { get } = require('lodash')
const { stringify } = require('querystring')
const { create } = require('axios')

const axios = create({
  baseURL: 'https://api.vaults.fyi',
  timeout: 180000 * 3,
  headers: {
    'x-api-key': process.env.VAULTSFYI_KEY
  }
})

exports.getAllVaults = (page, perPage = 5000) => {
  const params = {
    page,
    perPage,
    minTvl: 100000,
    onlyAppFeatured: true
  }

  return axios.get(`/v2/detailed-vaults?${stringify(params)}`)
    .then(res => res.data)
    .then(res => res.data)
}

exports.getHistory = (address, params) => {
  const query = {
    ...params,
    address,
    perPage: 20000
  }

  // return [
  //   {
  //     timestamp: 1749513600,
  //     blockNumber: '22670450',
  //     apy: { base: 0.0038, reward: 0, total: 0.0038 },
  //     tvl: { usd: '175422232', native: '175376003699360595308831432' }
  //   },
  //   {
  //     timestamp: 1749600000,
  //     blockNumber: '22677606',
  //     apy: { base: 0.0043, reward: 0, total: 0.0043 },
  //     tvl: { usd: '178502074', native: '178417067197682886944288430' }
  //   },
  //   {
  //     timestamp: 1749772800,
  //     blockNumber: '22691920',
  //     apy: { base: 0.0083, reward: 0, total: 0.0083 },
  //     tvl: { usd: '182640244', native: '181985199338496235668036261' }
  //   },
  //   {
  //     timestamp: 1749859200,
  //     blockNumber: '22699074',
  //     apy: { base: 0.0082, reward: 0, total: 0.0082 },
  //     tvl: { usd: '185254045', native: '185153638677642128137114169' }
  //   },
  //   {
  //     timestamp: 1750032000,
  //     blockNumber: '22713369',
  //     apy: { base: 0.0078, reward: 0, total: 0.0078 },
  //     tvl: { usd: '192023167', native: '191781419234085190827328764' }
  //   }
  // ]

  return [
    {
      timestamp: 1749459600,
      blockNumber: '22665983',
      apy: {
        base: 0.0047,
        reward: 0,
        total: 0.0047
      },
      tvl: {
        usd: '175040069',
        native: '175031204668816596023393832'
      }
    },
    {
      timestamp: 1749463200,
      blockNumber: '22666282',
      apy: {
        base: 0.0047,
        reward: 0,
        total: 0.0047
      },
      tvl: {
        usd: '175613056',
        native: '175031280981181077405235864'
      }
    },
    {
      timestamp: 1749466800,
      blockNumber: '22666581',
      apy: {
        base: 0.0047,
        reward: 0,
        total: 0.0047
      },
      tvl: {
        usd: '175059480',
        native: '174980913953689646640133952'
      }
    },
    {
      timestamp: 1749470400,
      blockNumber: '22666881',
      apy: {
        base: 0.0047,
        reward: 0,
        total: 0.0047
      },
      tvl: {
        usd: '174883541',
        native: '174980990290679983417975559'
      }
    },
    {
      timestamp: 1749474000,
      blockNumber: '22667180',
      apy: {
        base: 0.0047,
        reward: 0,
        total: 0.0047
      },
      tvl: {
        usd: '174653092',
        native: '174981066627670320195817165'
      }
    },
    {
      timestamp: 1749477600,
      blockNumber: '22667478',
      apy: {
        base: 0.0047,
        reward: 0,
        total: 0.0047
      },
      tvl: {
        usd: '174408040',
        native: '174966605967487843243563479'
      }
    },
    {
      timestamp: 1749481200,
      blockNumber: '22667773',
      apy: {
        base: 0.0046,
        reward: 0,
        total: 0.0046
      },
      tvl: {
        usd: '175371371',
        native: '174966682311665941724552645'
      }
    },
    {
      timestamp: 1749484800,
      blockNumber: '22668071',
      apy: {
        base: 0.0046,
        reward: 0,
        total: 0.0046
      },
      tvl: {
        usd: '175324198',
        native: '174966758655844040205541811'
      }
    },
    {
      timestamp: 1749488400,
      blockNumber: '22668369',
      apy: {
        base: 0.0046,
        reward: 0,
        total: 0.0046
      },
      tvl: {
        usd: '175425253',
        native: '174966835000022138686530977'
      }
    },
    {
      timestamp: 1749492000,
      blockNumber: '22668663',
      apy: {
        base: 0.0046,
        reward: 0,
        total: 0.0046
      },
      tvl: {
        usd: '174883064',
        native: '174967673352797371594602893'
      }
    },
    {
      timestamp: 1749495600,
      blockNumber: '22668962',
      apy: {
        base: 0.0046,
        reward: 0,
        total: 0.0046
      },
      tvl: {
        usd: '174880325',
        native: '174967749697714872356900574'
      }
    },
    {
      timestamp: 1749499200,
      blockNumber: '22669260',
      apy: {
        base: 0.0046,
        reward: 0,
        total: 0.0046
      },
      tvl: {
        usd: '175004042',
        native: '174967826042632373119198254'
      }
    },
    {
      timestamp: 1749502800,
      blockNumber: '22669559',
      apy: {
        base: 0.0046,
        reward: 0,
        total: 0.0046
      },
      tvl: {
        usd: '175021009',
        native: '175375775194893751553302432'
      }
    },
    {
      timestamp: 1749506400,
      blockNumber: '22669856',
      apy: {
        base: 0.0046,
        reward: 0,
        total: 0.0046
      },
      tvl: {
        usd: '175213362',
        native: '175375851363049366138478766'
      }
    },
    {
      timestamp: 1749510000,
      blockNumber: '22670154',
      apy: {
        base: 0.0045,
        reward: 0,
        total: 0.0045
      },
      tvl: {
        usd: '175643482',
        native: '175375927531204980723655099'
      }
    },
    {
      timestamp: 1749513600,
      blockNumber: '22670450',
      apy: {
        base: 0.0045,
        reward: 0,
        total: 0.0045
      },
      tvl: {
        usd: '175422232',
        native: '175376003699360595308831432'
      }
    },
    {
      timestamp: 1749517200,
      blockNumber: '22670749',
      apy: {
        base: 0.0045,
        reward: 0,
        total: 0.0045
      },
      tvl: {
        usd: '175264533',
        native: '175376079867516209894007765'
      }
    },
    {
      timestamp: 1749520800,
      blockNumber: '22671047',
      apy: {
        base: 0.0045,
        reward: 0,
        total: 0.0045
      },
      tvl: {
        usd: '175961332',
        native: '175626614273304545246898978'
      }
    },
    {
      timestamp: 1749524400,
      blockNumber: '22671341',
      apy: {
        base: 0.0045,
        reward: 0,
        total: 0.0045
      },
      tvl: {
        usd: '175539190',
        native: '175123281848688487722397297'
      }
    },
    {
      timestamp: 1749528000,
      blockNumber: '22671639',
      apy: {
        base: 0.0045,
        reward: 0,
        total: 0.0045
      },
      tvl: {
        usd: '175008961',
        native: '175128459081947212338639475'
      }
    },
    {
      timestamp: 1749531600,
      blockNumber: '22671933',
      apy: {
        base: 0.0045,
        reward: 0,
        total: 0.0045
      },
      tvl: {
        usd: '175378522',
        native: '175129126247756606716063863'
      }
    },
    {
      timestamp: 1749535200,
      blockNumber: '22672230',
      apy: {
        base: 0.0045,
        reward: 0,
        total: 0.0045
      },
      tvl: {
        usd: '175286944',
        native: '175129202525745968627233897'
      }
    },
    {
      timestamp: 1749538800,
      blockNumber: '22672529',
      apy: {
        base: 0.0044,
        reward: 0,
        total: 0.0044
      },
      tvl: {
        usd: '175186488',
        native: '175129278803735330538403931'
      }
    },
    {
      timestamp: 1749542400,
      blockNumber: '22672828',
      apy: {
        base: 0.0044,
        reward: 0,
        total: 0.0044
      },
      tvl: {
        usd: '174982601',
        native: '175129355081724692449573965'
      }
    },
    {
      timestamp: 1749546000,
      blockNumber: '22673127',
      apy: {
        base: 0.0044,
        reward: 0,
        total: 0.0044
      },
      tvl: {
        usd: '175225309',
        native: '175129431359714054360743999'
      }
    },
    {
      timestamp: 1749549600,
      blockNumber: '22673423',
      apy: {
        base: 0.0044,
        reward: 0,
        total: 0.0044
      },
      tvl: {
        usd: '175054749',
        native: '175117210032375226154291193'
      }
    },
    {
      timestamp: 1749553200,
      blockNumber: '22673722',
      apy: {
        base: 0.0044,
        reward: 0,
        total: 0.0044
      },
      tvl: {
        usd: '174877075',
        native: '175216806778539036533844649'
      }
    },
    {
      timestamp: 1749556800,
      blockNumber: '22674020',
      apy: {
        base: 0.0044,
        reward: 0,
        total: 0.0044
      },
      tvl: {
        usd: '175266369',
        native: '175216883020225868553005690'
      }
    },
    {
      timestamp: 1749560400,
      blockNumber: '22674320',
      apy: {
        base: 0.0044,
        reward: 0,
        total: 0.0044
      },
      tvl: {
        usd: '174920947',
        native: '175216959261912700572166731'
      }
    },
    {
      timestamp: 1749564000,
      blockNumber: '22674619',
      apy: {
        base: 0.0044,
        reward: 0,
        total: 0.0044
      },
      tvl: {
        usd: '175417065',
        native: '175217035503599532591327772'
      }
    },
    {
      timestamp: 1749571200,
      blockNumber: '22675218',
      apy: {
        base: 0.0043,
        reward: 0,
        total: 0.0043
      },
      tvl: {
        usd: '175162019',
        native: '175217187986973196629649854'
      }
    },
    {
      timestamp: 1749578400,
      blockNumber: '22675816',
      apy: {
        base: 0.0043,
        reward: 0,
        total: 0.0043
      },
      tvl: {
        usd: '178539203',
        native: '178830965979182306813832455'
      }
    },
    {
      timestamp: 1749585600,
      blockNumber: '22676413',
      apy: {
        base: 0.0043,
        reward: 0,
        total: 0.0043
      },
      tvl: {
        usd: '178859574',
        native: '178934412416330254948956849'
      }
    },
    {
      timestamp: 1749592800,
      blockNumber: '22677009',
      apy: {
        base: 0.0043,
        reward: 0,
        total: 0.0043
      },
      tvl: {
        usd: '179307643',
        native: '178816723732386970278858807'
      }
    },
    {
      timestamp: 1749600000,
      blockNumber: '22677606',
      apy: {
        base: 0.0044,
        reward: 0,
        total: 0.0044
      },
      tvl: {
        usd: '178502074',
        native: '178417067197682886944288430'
      }
    },
    {
      timestamp: 1749607200,
      blockNumber: '22678200',
      apy: {
        base: 0.0044,
        reward: 0,
        total: 0.0044
      },
      tvl: {
        usd: '178263190',
        native: '178417410670914756244916224'
      }
    },
    {
      timestamp: 1749614400,
      blockNumber: '22678791',
      apy: {
        base: 0.0044,
        reward: 0,
        total: 0.0044
      },
      tvl: {
        usd: '178277305',
        native: '178417754144146625545544018'
      }
    },
    {
      timestamp: 1749618000,
      blockNumber: '22679088',
      apy: {
        base: 0.0045,
        reward: 0,
        total: 0.0045
      },
      tvl: {
        usd: '178193772',
        native: '178499452972182264076461785'
      }
    },
    {
      timestamp: 1749625200,
      blockNumber: '22679686',
      apy: {
        base: 0.0045,
        reward: 0,
        total: 0.0045
      },
      tvl: {
        usd: '178572680',
        native: '178479796367439505667556071'
      }
    },
    {
      timestamp: 1749632400,
      blockNumber: '22680285',
      apy: {
        base: 0.0045,
        reward: 0,
        total: 0.0045
      },
      tvl: {
        usd: '178820713',
        native: '178482139538242394578456618'
      }
    },
    {
      timestamp: 1749643200,
      blockNumber: '22681177',
      apy: {
        base: 0.0046,
        reward: 0,
        total: 0.0046
      },
      tvl: {
        usd: '178420112',
        native: '178483818802158643559009820'
      }
    },
    {
      timestamp: 1749650400,
      blockNumber: '22681775',
      apy: {
        base: 0.0047,
        reward: 0,
        total: 0.0047
      },
      tvl: {
        usd: '178344994',
        native: '178534605552683281005536545'
      }
    },
    {
      timestamp: 1749657600,
      blockNumber: '22682373',
      apy: {
        base: 0.0047,
        reward: 0,
        total: 0.0047
      },
      tvl: {
        usd: '178984694',
        native: '178534948945542629515874913'
      }
    },
    {
      timestamp: 1749664800,
      blockNumber: '22682968',
      apy: {
        base: 0.0047,
        reward: 0,
        total: 0.0047
      },
      tvl: {
        usd: '179326043',
        native: '178535292338401978026213280'
      }
    },
    {
      timestamp: 1749672000,
      blockNumber: '22683562',
      apy: {
        base: 0.0048,
        reward: 0,
        total: 0.0048
      },
      tvl: {
        usd: '178854345',
        native: '178912932097952704372247254'
      }
    },
    {
      timestamp: 1749693600,
      blockNumber: '22685356',
      apy: {
        base: 0.0049,
        reward: 0,
        total: 0.0049
      },
      tvl: {
        usd: '179804096',
        native: '180204561762885577366044271'
      }
    },
    {
      timestamp: 1749700800,
      blockNumber: '22685954',
      apy: {
        base: 0.0049,
        reward: 0,
        total: 0.0049
      },
      tvl: {
        usd: '181346815',
        native: '181441665455273701997502528'
      }
    },
    {
      timestamp: 1749708000,
      blockNumber: '22686553',
      apy: {
        base: 0.005,
        reward: 0,
        total: 0.005
      },
      tvl: {
        usd: '181514715',
        native: '181442008050156910895491192'
      }
    },
    {
      timestamp: 1749715200,
      blockNumber: '22687151',
      apy: {
        base: 0.005,
        reward: 0,
        total: 0.005
      },
      tvl: {
        usd: '180894578',
        native: '181342350663878456433662147'
      }
    },
    {
      timestamp: 1749722400,
      blockNumber: '22687749',
      apy: {
        base: 0.0051,
        reward: 0,
        total: 0.0051
      },
      tvl: {
        usd: '181575596',
        native: '181542760644489012251530945'
      }
    },
    {
      timestamp: 1749729600,
      blockNumber: '22688346',
      apy: {
        base: 0.0051,
        reward: 0,
        total: 0.0051
      },
      tvl: {
        usd: '181828320',
        native: '181690210699288313516083469'
      }
    },
    {
      timestamp: 1749736800,
      blockNumber: '22688941',
      apy: {
        base: 0.0051,
        reward: 0,
        total: 0.0051
      },
      tvl: {
        usd: '181767410',
        native: '181690553242710151689131054'
      }
    },
    {
      timestamp: 1749744000,
      blockNumber: '22689537',
      apy: {
        base: 0.0052,
        reward: 0,
        total: 0.0052
      },
      tvl: {
        usd: '181907301',
        native: '181688735372600551088836553'
      }
    },
    {
      timestamp: 1749751200,
      blockNumber: '22690131',
      apy: {
        base: 0.0052,
        reward: 0,
        total: 0.0052
      },
      tvl: {
        usd: '182290856',
        native: '181989036289153155677811167'
      }
    },
    {
      timestamp: 1749758400,
      blockNumber: '22690726',
      apy: {
        base: 0.0053,
        reward: 0,
        total: 0.0053
      },
      tvl: {
        usd: '182122407',
        native: '181984514383514842999823429'
      }
    },
    {
      timestamp: 1749765600,
      blockNumber: '22691323',
      apy: {
        base: 0.0053,
        reward: 0,
        total: 0.0053
      },
      tvl: {
        usd: '182725371',
        native: '181984856861005539333929845'
      }
    },
    {
      timestamp: 1749772800,
      blockNumber: '22691920',
      apy: {
        base: 0.0054,
        reward: 0,
        total: 0.0054
      },
      tvl: {
        usd: '182640244',
        native: '181985199338496235668036261'
      }
    },
    {
      timestamp: 1749780000,
      blockNumber: '22692518',
      apy: {
        base: 0.0054,
        reward: 0,
        total: 0.0054
      },
      tvl: {
        usd: '182334612',
        native: '181860500254792366073545283'
      }
    },
    {
      timestamp: 1749787200,
      blockNumber: '22693113',
      apy: {
        base: 0.0055,
        reward: 0,
        total: 0.0055
      },
      tvl: {
        usd: '181358730',
        native: '181660569015775989796493333'
      }
    },
    {
      timestamp: 1749794400,
      blockNumber: '22693705',
      apy: {
        base: 0.0055,
        reward: 0,
        total: 0.0055
      },
      tvl: {
        usd: '182195355',
        native: '181873341411326205671044468'
      }
    },
    {
      timestamp: 1749801600,
      blockNumber: '22694301',
      apy: {
        base: 0.0055,
        reward: 0,
        total: 0.0055
      },
      tvl: {
        usd: '181955283',
        native: '181873683855360824456599848'
      }
    },
    {
      timestamp: 1749808800,
      blockNumber: '22694897',
      apy: {
        base: 0.0056,
        reward: 0,
        total: 0.0056
      },
      tvl: {
        usd: '184587112',
        native: '184176351288964264483985375'
      }
    },
    {
      timestamp: 1749816000,
      blockNumber: '22695494',
      apy: {
        base: 0.0056,
        reward: 0,
        total: 0.0056
      },
      tvl: {
        usd: '184364560',
        native: '184176693113664957277883743'
      }
    },
    {
      timestamp: 1749823200,
      blockNumber: '22696094',
      apy: {
        base: 0.0057,
        reward: 0,
        total: 0.0057
      },
      tvl: {
        usd: '184205009',
        native: '184177034935875429876434703'
      }
    },
    {
      timestamp: 1749826800,
      blockNumber: '22696392',
      apy: {
        base: 0.0057,
        reward: 0,
        total: 0.0057
      },
      tvl: {
        usd: '184042407',
        native: '184254373715910605895235987'
      }
    },
    {
      timestamp: 1749830400,
      blockNumber: '22696691',
      apy: {
        base: 0.0057,
        reward: 0,
        total: 0.0057
      },
      tvl: {
        usd: '183861177',
        native: '184253949330405104709456348'
      }
    },
    {
      timestamp: 1749834000,
      blockNumber: '22696988',
      apy: {
        base: 0.0058,
        reward: 0,
        total: 0.0058
      },
      tvl: {
        usd: '184234204',
        native: '184254120228383985730940166'
      }
    },
    {
      timestamp: 1749837600,
      blockNumber: '22697288',
      apy: {
        base: 0.0058,
        reward: 0,
        total: 0.0058
      },
      tvl: {
        usd: '184229066',
        native: '184254291126362866752423984'
      }
    },
    {
      timestamp: 1749841200,
      blockNumber: '22697586',
      apy: {
        base: 0.0058,
        reward: 0,
        total: 0.0058
      },
      tvl: {
        usd: '183939634',
        native: '184358198110700481231439768'
      }
    },
    {
      timestamp: 1749844800,
      blockNumber: '22697884',
      apy: {
        base: 0.0058,
        reward: 0,
        total: 0.0058
      },
      tvl: {
        usd: '183894585',
        native: '184362627213381137089323634'
      }
    },
    {
      timestamp: 1749848400,
      blockNumber: '22698184',
      apy: {
        base: 0.0058,
        reward: 0,
        total: 0.0058
      },
      tvl: {
        usd: '185377155',
        native: '185096551380525283536203368'
      }
    },
    {
      timestamp: 1749852000,
      blockNumber: '22698478',
      apy: {
        base: 0.0059,
        reward: 0,
        total: 0.0059
      },
      tvl: {
        usd: '185076321',
        native: '185153297110825956026700620'
      }
    },
    {
      timestamp: 1749855600,
      blockNumber: '22698777',
      apy: {
        base: 0.0059,
        reward: 0,
        total: 0.0059
      },
      tvl: {
        usd: '185052435',
        native: '185153467894234042081907394'
      }
    },
    {
      timestamp: 1749859200,
      blockNumber: '22699074',
      apy: {
        base: 0.0059,
        reward: 0,
        total: 0.0059
      },
      tvl: {
        usd: '185254045',
        native: '185153638677642128137114169'
      }
    },
    {
      timestamp: 1749862800,
      blockNumber: '22699372',
      apy: {
        base: 0.0059,
        reward: 0,
        total: 0.0059
      },
      tvl: {
        usd: '185719152',
        native: '185153809461050214192320944'
      }
    },
    {
      timestamp: 1749866400,
      blockNumber: '22699668',
      apy: {
        base: 0.006,
        reward: 0,
        total: 0.006
      },
      tvl: {
        usd: '185197424',
        native: '185153980244458300247527719'
      }
    },
    {
      timestamp: 1749873600,
      blockNumber: '22700264',
      apy: {
        base: 0.006,
        reward: 0,
        total: 0.006
      },
      tvl: {
        usd: '185639043',
        native: '185155321788556749250160954'
      }
    },
    {
      timestamp: 1749877200,
      blockNumber: '22700563',
      apy: {
        base: 0.006,
        reward: 0,
        total: 0.006
      },
      tvl: {
        usd: '185077708',
        native: '185155492576464186786373646'
      }
    },
    {
      timestamp: 1749880800,
      blockNumber: '22700861',
      apy: {
        base: 0.0061,
        reward: 0,
        total: 0.0061
      },
      tvl: {
        usd: '185125790',
        native: '185155663364371624322586339'
      }
    },
    {
      timestamp: 1749884400,
      blockNumber: '22701159',
      apy: {
        base: 0.0061,
        reward: 0,
        total: 0.0061
      },
      tvl: {
        usd: '185595062',
        native: '185165938396571675016135348'
      }
    },
    {
      timestamp: 1749888000,
      blockNumber: '22701457',
      apy: {
        base: 0.0061,
        reward: 0,
        total: 0.0061
      },
      tvl: {
        usd: '185395292',
        native: '185166109187158160667803553'
      }
    },
    {
      timestamp: 1749895200,
      blockNumber: '22702054',
      apy: {
        base: 0.0062,
        reward: 0,
        total: 0.0062
      },
      tvl: {
        usd: '184980397',
        native: '185286251033739435150922663'
      }
    },
    {
      timestamp: 1749898800,
      blockNumber: '22702353',
      apy: {
        base: 0.0062,
        reward: 0,
        total: 0.0062
      },
      tvl: {
        usd: '185446830',
        native: '185289385912902133389552230'
      }
    },
    {
      timestamp: 1749902400,
      blockNumber: '22702651',
      apy: {
        base: 0.0062,
        reward: 0,
        total: 0.0062
      },
      tvl: {
        usd: '185422348',
        native: '185291055035365880063766981'
      }
    },
    {
      timestamp: 1749909600,
      blockNumber: '22703250',
      apy: {
        base: 0.0063,
        reward: 0,
        total: 0.0063
      },
      tvl: {
        usd: '187783497',
        native: '187817204869323988538857424'
      }
    },
    {
      timestamp: 1749916800,
      blockNumber: '22703847',
      apy: {
        base: 0.0063,
        reward: 0,
        total: 0.0063
      },
      tvl: {
        usd: '189468869',
        native: '189433864376770748202442376'
      }
    },
    {
      timestamp: 1749920400,
      blockNumber: '22704145',
      apy: {
        base: 0.0063,
        reward: 0,
        total: 0.0063
      },
      tvl: {
        usd: '189276244',
        native: '189350414630960796898316228'
      }
    },
    {
      timestamp: 1749927600,
      blockNumber: '22704742',
      apy: {
        base: 0.0064,
        reward: 0,
        total: 0.0064
      },
      tvl: {
        usd: '188981413',
        native: '189350755142062445095773955'
      }
    },
    {
      timestamp: 1749934800,
      blockNumber: '22705340',
      apy: {
        base: 0.0064,
        reward: 0,
        total: 0.0064
      },
      tvl: {
        usd: '189114666',
        native: '189517805029025168993477103'
      }
    },
    {
      timestamp: 1749938400,
      blockNumber: '22705638',
      apy: {
        base: 0.0064,
        reward: 0,
        total: 0.0064
      },
      tvl: {
        usd: '189196425',
        native: '189517975266845770964546813'
      }
    },
    {
      timestamp: 1749942000,
      blockNumber: '22705934',
      apy: {
        base: 0.0065,
        reward: 0,
        total: 0.0065
      },
      tvl: {
        usd: '189544799',
        native: '189518145504666372935616524'
      }
    },
    {
      timestamp: 1749949200,
      blockNumber: '22706532',
      apy: {
        base: 0.0065,
        reward: 0,
        total: 0.0065
      },
      tvl: {
        usd: '189505212',
        native: '189518485980307576877755945'
      }
    },
    {
      timestamp: 1749956400,
      blockNumber: '22707124',
      apy: {
        base: 0.0066,
        reward: 0,
        total: 0.0066
      },
      tvl: {
        usd: '189626528',
        native: '189523874893872621610155239'
      }
    },
    {
      timestamp: 1749960000,
      blockNumber: '22707421',
      apy: {
        base: 0.0066,
        reward: 0,
        total: 0.0066
      },
      tvl: {
        usd: '189528034',
        native: '189554049319637567078644328'
      }
    },
    {
      timestamp: 1749963600,
      blockNumber: '22707716',
      apy: {
        base: 0.0066,
        reward: 0,
        total: 0.0066
      },
      tvl: {
        usd: '189199237',
        native: '189554219536838436164140536'
      }
    },
    {
      timestamp: 1749970800,
      blockNumber: '22708314',
      apy: {
        base: 0.0066,
        reward: 0,
        total: 0.0066
      },
      tvl: {
        usd: '189790125',
        native: '190054316170728040386138054'
      }
    },
    {
      timestamp: 1749978000,
      blockNumber: '22708908',
      apy: {
        base: 0.0067,
        reward: 0,
        total: 0.0067
      },
      tvl: {
        usd: '191508243',
        native: '191059739830964231468400320'
      }
    },
    {
      timestamp: 1749985200,
      blockNumber: '22709501',
      apy: {
        base: 0.0067,
        reward: 0,
        total: 0.0067
      },
      tvl: {
        usd: '191482137',
        native: '191060079904420917828388989'
      }
    },
    {
      timestamp: 1749992400,
      blockNumber: '22710091',
      apy: {
        base: 0.0068,
        reward: 0,
        total: 0.0068
      },
      tvl: {
        usd: '191084271',
        native: '191060419977877604188377658'
      }
    },
    {
      timestamp: 1749999600,
      blockNumber: '22710691',
      apy: {
        base: 0.0068,
        reward: 0,
        total: 0.0068
      },
      tvl: {
        usd: '190868113',
        native: '191060760051334290548366327'
      }
    },
    {
      timestamp: 1750003200,
      blockNumber: '22710986',
      apy: {
        base: 0.0069,
        reward: 0,
        total: 0.0069
      },
      tvl: {
        usd: '191357152',
        native: '191060930088062633728360661'
      }
    },
    {
      timestamp: 1750006800,
      blockNumber: '22711285',
      apy: {
        base: 0.0069,
        reward: 0,
        total: 0.0069
      },
      tvl: {
        usd: '191322893',
        native: '191692194251479680889464272'
      }
    },
    {
      timestamp: 1750010400,
      blockNumber: '22711582',
      apy: {
        base: 0.0069,
        reward: 0,
        total: 0.0069
      },
      tvl: {
        usd: '191365964',
        native: '191702361569205304732776485'
      }
    },
    {
      timestamp: 1750014000,
      blockNumber: '22711881',
      apy: {
        base: 0.0069,
        reward: 0,
        total: 0.0069
      },
      tvl: {
        usd: '191703538',
        native: '191776734022344852846176130'
      }
    },
    {
      timestamp: 1750017600,
      blockNumber: '22712179',
      apy: {
        base: 0.0069,
        reward: 0,
        total: 0.0069
      },
      tvl: {
        usd: '191869699',
        native: '191776903979813209714011666'
      }
    },
    {
      timestamp: 1750024800,
      blockNumber: '22712776',
      apy: {
        base: 0.0069,
        reward: 0,
        total: 0.0069
      },
      tvl: {
        usd: '191424366',
        native: '191781079330561466748245781'
      }
    },
    {
      timestamp: 1750028400,
      blockNumber: '22713072',
      apy: {
        base: 0.0069,
        reward: 0,
        total: 0.0069
      },
      tvl: {
        usd: '192278006',
        native: '191781249282323328787787272'
      }
    },
    {
      timestamp: 1750032000,
      blockNumber: '22713369',
      apy: {
        base: 0.0069,
        reward: 0,
        total: 0.0069
      },
      tvl: {
        usd: '192023167',
        native: '191781419234085190827328764'
      }
    },
    {
      timestamp: 1750035600,
      blockNumber: '22713666',
      apy: {
        base: 0.007,
        reward: 0,
        total: 0.007
      },
      tvl: {
        usd: '191720015',
        native: '191781589185847052866870255'
      }
    },
    {
      timestamp: 1750039200,
      blockNumber: '22713964',
      apy: {
        base: 0.007,
        reward: 0,
        total: 0.007
      },
      tvl: {
        usd: '191899371',
        native: '191781759137608914906411746'
      }
    },
    {
      timestamp: 1750042800,
      blockNumber: '22714261',
      apy: {
        base: 0.007,
        reward: 0,
        total: 0.007
      },
      tvl: {
        usd: '191318348',
        native: '191781929089370776945953238'
      }
    },
    {
      timestamp: 1750050000,
      blockNumber: '22714859',
      apy: {
        base: 0.007,
        reward: 0,
        total: 0.007
      },
      tvl: {
        usd: '196445474',
        native: '196875562468240316962079070'
      }
    },
    {
      timestamp: 1750057200,
      blockNumber: '22715455',
      apy: {
        base: 0.007,
        reward: 0,
        total: 0.007
      },
      tvl: {
        usd: '197009664',
        native: '196827555826897282940397474'
      }
    },
    {
      timestamp: 1750060800,
      blockNumber: '22715753',
      apy: {
        base: 0.007,
        reward: 0,
        total: 0.007
      },
      tvl: {
        usd: '197114830',
        native: '196853798911863277659104762'
      }
    }
  ]

  return axios.get(`/v2/historical/mainnet/${address}?${stringify(query)}`)
    .then(res => res.data)
    .then(res => res.data)
}
