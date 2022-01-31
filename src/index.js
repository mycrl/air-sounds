'use strict'

const { 
    app, 
    Tray, 
    nativeImage, 
    Menu, 
    BrowserWindow, 
    screen, 
    ipcMain,
    MenuItem
} = require('electron')
const http = require('http')
const express = require('express')
const onceCell = require('once_cell')
const { Server } = require('ws')
const address = require('address')
const path = require('path')

const router = express()
const server = http.createServer(router)
const websocket = new Server({ server })

const window = onceCell('window', () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    return new BrowserWindow({
        type: 'toolbar',
        width: 300, 
        height: 345,
        frame: false,
        x: width - 310,
        y: height - 355,
        resizable: false,
        movable: false,
        alwaysOnTop: true,
        momodalable: true,
        transparent: true,
        show: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        }
    })
})

const tray = onceCell('tray', () => {
    return new Tray(nativeImage.createFromPath(
        path.join(__dirname, '../logo.png')
    ))
}) 

const menu = Menu.buildFromTemplate([
    {
        label: 'Show Main Window',
        click() {
            window.show() 
        }
    },
    {
        label: 'Exit',
        click() {
            app.exit(0)
        }
    }
])

tray.setContextMenu(menu)
tray.setToolTip('Keluang air sounds')

window.loadFile(path.join(__dirname, '../page/window.html')).then(() => {    
    server.listen(() => {
        window.webContents.send('listening', {
            ip: address.ip(),
            port: server.address().port
        })
    })
})

ipcMain.on('hide-window', () => {
    window.hide() 
})

router.use(express.json())
router.use(express.urlencoded({ extended: true }))
router.use(express.static(path.join(__dirname, '../page')))

router.get('/', (_, res) => {
    res.sendFile(
        path.join(__dirname, '../page/client.html')
    )
})

let remoteSocket = null
websocket.on('connection', socket => {
    remoteSocket = socket
    
    window.webContents.send('connection')
    socket.on('message', message => {
        window.webContents.send('message', message.toString())
    })
})

ipcMain.on('message', (_, message) => {
    try {
        remoteSocket.send(message)
    } catch(e) {
        // ignore error
    }
})