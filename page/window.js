const { ipcRenderer, desktopCapturer } = require('electron')
        
const peer = new RTCPeerConnection()
const constraint = {
    mandatory: {
        chromeMediaSource: 'desktop'
    }
}

function sendMessage(data) {
    ipcRenderer.send('message', JSON.stringify(data))
}

function signalState(state) {
    document.getElementById('state').innerText = state
    document.getElementById('signal').style.backgroundColor = ({
        connecting: '#00c4fe',
        connected: '#00b150',
        disconnected: '#f00222',
        failed: '#76767e'
    })[state]
}

async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: constraint,
        video: constraint
    })

    stream.getTracks().forEach(track => {
        if (track.kind === "audio") {
            peer.addTrack(track, stream)   
        }
    })
}

ipcRenderer.on('listening', (_, address) => {
    const url = `http://${address.ip}:${address.port}`

    document.getElementById('url-path').innerText = url
    new QRCode(document.getElementById('qrcode'), {
        text: url,
        width: 200,
        height: 200,
        colorDark : '#333',
        colorLight : '#eee',
        correctLevel : QRCode.CorrectLevel.H
    })

    start()
})

document.getElementById('close').addEventListener('click', () => {
    ipcRenderer.send('hide-window')
})

ipcRenderer.on('connection', async () => {
    const offer = await peer.createOffer()
    await peer.setLocalDescription(offer)
    sendMessage(offer)
})

ipcRenderer.on('message', (_, data) => {
    let packet = JSON.parse(data)
    if (packet.type === 'icecandidate') {
        peer.addIceCandidate(packet.candidate)
    } else
    if (packet.type === 'answer') {
        const remoteDesc = new RTCSessionDescription(packet)
        peer.setRemoteDescription(remoteDesc)
    }
})

peer.addEventListener('icecandidate', ({ candidate }) => {
    candidate && sendMessage({ 
        type: 'icecandidate', 
        candidate 
    })
})

peer.addEventListener('connectionstatechange', () => {
    signalState(peer.connectionState)
})