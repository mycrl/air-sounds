const socket = new WebSocket('ws://' + location.host)
const remoteStream = new MediaStream()
const peer = new RTCPeerConnection()
        
function sendMessage(data) {
    socket.send(JSON.stringify(data))
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

peer.addEventListener('track', ({ track }) => {
    remoteStream.addTrack(track, remoteStream)
})

peer.addEventListener('connectionstatechange', async event => {
    signalState(peer.connectionState)
    if (peer.connectionState === 'connected') {
        document.getElementById('player').srcObject = remoteStream
    }
})

socket.onmessage = async ({ data }) => {
    let packet = JSON.parse(data)
    if (packet.type === 'icecandidate') {
        peer.addIceCandidate(packet.candidate)
    } else
    if (packet.type === 'offer') {
        const remoteDesc = new RTCSessionDescription(packet)
        peer.setRemoteDescription(remoteDesc)
        const answer = await peer.createAnswer()
        await peer.setLocalDescription(answer)
        sendMessage(answer)
    }
}

socket.onopen = function() {
    peer.addEventListener('icecandidate', ({ candidate }) => {
        candidate && sendMessage({ 
            type: 'icecandidate', 
            candidate 
        })
    }) 
}

document.getElementById('play').addEventListener('click', () => {
    document.getElementById('player').play()
    document.getElementById('play').style.display = 'none'
})