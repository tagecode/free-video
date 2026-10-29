import log from 'electron-log/main'

log.initialize({ preload: false })
log.transports.file.level = 'info'
log.transports.console.level = 'debug'

export const logger = log.scope('free-video')
