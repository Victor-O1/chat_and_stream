let localStream;
let remoteStream;
let peerConnection;
const servers = {
    iceServers: [
        { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
    ]
};

const socket = new WebSocket("wss://chat-and-stream-backend.onrender.com");
const userId = prompt("Your ID:");
const remoteId = prompt("Connect to user ID:");

socket.onopen = () => {
    socket.send(JSON.stringify({ type: "join", from: userId }));
};

socket.onmessage = async ({ data }) => {
    const { type, from, payload } = JSON.parse(data);

    switch (type) {
        case 'offer':
            await createAnswer(payload, from);
            break;
        case 'answer':
            await peerConnection.setRemoteDescription(new RTCSessionDescription(payload));
            break;
        case 'ice-candidate':
            if (payload) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(payload));
            }
            break;
    }
};

let init = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    });
    document.getElementById('user-1').srcObject = localStream;

    if (confirm("Create offer?")) {
        createOffer();
    }
};

let createOffer = async () => {
    setupPeerConnection();

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    sendToPeer('offer', offer);
};

let createAnswer = async (offer, from) => {
    setupPeerConnection();

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    sendToPeer('answer', answer, from);
};

function setupPeerConnection() {
    peerConnection = new RTCPeerConnection(servers);
    remoteStream = new MediaStream();

    document.getElementById('user-2').srcObject = remoteStream;

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
            remoteStream.addTrack(track);
        });
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            sendToPeer('ice-candidate', event.candidate);
        }
    };
}

function sendToPeer(type, payload, to = remoteId) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type,
            from: userId,
            to,
            payload
        }));
    } else {
        console.warn("Socket not open yet. Queuing or retry logic should be here.");
        // Optional: Retry logic after short delay (if you want)
        setTimeout(() => sendToPeer(type, payload, to), 200); // retry after 200ms
    }
}

init();



// let localStream;
// const peers = {};
// let socket;
// let userId = String(Math.floor(Math.random() * 9999));
// let roomId = prompt("Enter Room ID");

// const servers = {
//   iceServers: [{ urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }]
// };

// const videosContainer = document.getElementById('videos');

// const init = async () => {
//   socket = new WebSocket('ws://localhost:3000');

//   socket.onopen = () => {
//     socket.send(JSON.stringify({ type: 'join', from: userId, roomId }));
//   };

//   socket.onmessage = async ({ data }) => {
//     const { type, from, payload } = JSON.parse(data);

//     switch (type) {
//       case 'new-user':
//         await createOffer(from);
//         break;
//       case 'offer':
//         await handleOffer(payload, from);
//         break;
//       case 'answer':
//         await peers[from].setRemoteDescription(new RTCSessionDescription(payload));
//         break;
//       case 'ice-candidate':
//         if (payload) {
//           await peers[from].addIceCandidate(new RTCIceCandidate(payload));
//         }
//         break;
//     }
//   };

//   localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//   addVideoStream(userId, localStream);
// };

// const createOffer = async (peerId) => {
//   const pc = createPeerConnection(peerId);
//   const offer = await pc.createOffer();
//   await pc.setLocalDescription(offer);

//   sendSignal('offer', offer, peerId);
// };

// const handleOffer = async (offer, from) => {
//   const pc = createPeerConnection(from);
//   await pc.setRemoteDescription(new RTCSessionDescription(offer));

//   const answer = await pc.createAnswer();
//   await pc.setLocalDescription(answer);

//   sendSignal('answer', answer, from);
// };

// const createPeerConnection = (peerId) => {
//   const pc = new RTCPeerConnection(servers);
//   peers[peerId] = pc;

//   localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

//   const remoteStream = new MediaStream();
//   addVideoStream(peerId, remoteStream);

//   pc.ontrack = (event) => {
//     event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
//   };

//   pc.onicecandidate = (event) => {
//     if (event.candidate) {
//       sendSignal('ice-candidate', event.candidate, peerId);
//     }
//   };

//   return pc;
// };

// const sendSignal = (type, payload, to) => {
//   socket.send(JSON.stringify({
//     type,
//     from: userId,
//     to,
//     roomId,
//     payload
//   }));
// };

// const addVideoStream = (id, stream) => {
//   let video = document.createElement('video');
//   video.id = `video-${id}`;
//   video.srcObject = stream;
//   video.autoplay = true;
//   video.playsInline = true;
//   video.classList.add('video-player');
//   videosContainer.appendChild(video);
// };

// init();
