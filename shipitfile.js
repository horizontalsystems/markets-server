/* eslint-disable import/no-extraneous-dependencies */

const deploy = require('shipit-deploy')
const shared = require('shipit-shared')
const { apps } = require('./process.json')

module.exports = shipit => {
  deploy(shipit)
  shared(shipit)

  shipit.initConfig({
    default: {
      deployTo: '/home/deploy/markets-server',
      keepReleases: 5,
      repositoryUrl: 'https://github.com/horizontalsystems/markets-server.git',
      shared: {
        overwrite: true,
        files: ['.env', '.bq-key.json'],
        dirs: ['node_modules']
      }
    },
    prod_api: {
      branch: 'master',
      servers: ['deploy@159.89.94.233'],
    },
    prod_syncer: {
      branch: 'master',
      servers: ['deploy@147.182.167.89'],
    },
    dev_api: {
      branch: 'develop',
      servers: ['deploy@161.35.110.248']
    }
  })

  const remote = cmd => {
    shipit.remote(`cd ${shipit.config.deployTo}/current && ${cmd}`)
  }

  apps.forEach(({ name: app }) => {
    shipit.blTask(`${app}:start`, () => {
      shipit.start(`${app}:restart`)
    })

    shipit.blTask(`${app}:stop`, () => {
      remote(`pm2 stop process.json --only ${app}`)
    })

    shipit.blTask(`${app}:restart`, () => {
      remote(`pm2 startOrRestart process.json --env production --only ${app}`)
    })

    shipit.blTask(`${app}:logs`, () => {
      remote(`pm2 logs ${app}`)
    })
  })

  shipit.on('deployed', () => shipit.start('npm:install'))
  shipit.on('rollback', () => shipit.start('npm:install'))

  shipit.blTask('npm:install', async () => {
    remote('npm install --production')
  })

  shipit.blTask('copy-env', () => {
    shipit.copyToRemote('.env.prod', `${shipit.config.deployTo}/shared/.env`)
  })

  shipit.blTask('setup:node', async () => {
    // enable interactive mode in .bashrc
    // # case $- in
    // #     *i*) ;;
    // #       *) return;;
    // # esac

    await shipit.remote('curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash')
    await shipit.remote('nvm install --lts')
    await shipit.remote('nvm install-latest-npm')
    await shipit.remote('npm install pm2 -g')
  })
}
