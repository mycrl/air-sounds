require('electron')
    .app
    .whenReady()
    .then(() => require('./src'))