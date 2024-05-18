import { React, useEffect, useCallback, useState } from 'react';
import { useSocket } from '../context/SocketProvider';
import ReactPlayer from 'react-player';
import peer from '../service/peer'

const RoomPage = () => {
    const socket = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const handleUserJoin = useCallback((data) => {
        console.log("data from user joined", data)
        setRemoteSocketId(data.id);
    }, [])

    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
        });
        const offer = await peer.getOffer();
        socket.emit('user_call', { to: remoteSocketId, offer })
        setMyStream(stream)
    }, [remoteSocketId, socket])

    const handleIncomingCall = useCallback(async ({ offer, from }) => {
        setRemoteSocketId(offer)
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
        });
        setMyStream(stream)
        const answer = await peer.getAnswer(offer);
        socket.emit('call_accepted', { to: from, answer: answer })
        console.log('incoming call', from, offer)
    }, [socket])

    const handleAcceptedCall = useCallback(async ({ answer, from }) => {
        peer.setLocal(answer)
        console.log('accepted call', from)
        for (const track of myStream.getTracks()) {
            peer.peer.addTrack(track)
        }
    }, [myStream])

    const handleNegotiation = useCallback(async (data) => {
        const offer = await peer.getOffer();
        socket.emit('negotiation_needed', { offer: offer, to: remoteSocketId })
    }, [remoteSocketId, socket])

    const handleNeedIncomingCall = useCallback(({ from, offer }) => {
        const answer = peer.getAnswer(offer);
        socket.emit('negotiation_done', { to: from, answer: answer })
    }, [socket])

    const handleFinalCall = useCallback(async ({ answer }) => {
        await peer.setLocalDescription(answer)

    }, [])

    useEffect(() => {
        peer.peer.addEventListener('negotiationneeded', handleNegotiation)
        return () => {
            peer.peer.removeEventListener('negotiationneeded', handleNegotiation)
        }
    }, [handleNegotiation])

    useEffect(() => {
        peer.peer.addEventListener('track', async (event) => {
            const remoteStream = event.streams
            setRemoteStream(remoteStream)
        })
    }, [])

    useEffect(() => {
        socket.on('user_joined', handleUserJoin)
        socket.on('incoming_call', handleIncomingCall)
        socket.on('call_accepted', handleAcceptedCall)
        socket.on('negotiationneeded', handleNeedIncomingCall)
        socket.on('negotiation_done', handleFinalCall)
        return () => {
            socket.off('user_joined', handleUserJoin)
            socket.off('incoming_call', handleIncomingCall)
            socket.off('call_accepted', handleAcceptedCall)
            socket.off('negotiationneeded', handleNeedIncomingCall)
            socket.off('negotiation_done', handleFinalCall)
        }

    }, [socket, handleUserJoin, handleIncomingCall, handleAcceptedCall, handleNeedIncomingCall, handleFinalCall])


    return (
        <div>
            <h1>Room Page</h1>
            <h4>{remoteSocketId ? 'Connected' : 'No one in Room'}</h4>
            {remoteSocketId && <button onClick={handleCallUser}>Call</button>}
            {myStream &&
                <>
                    <h1>My Video</h1>
                    <ReactPlayer
                        playing
                        muted
                        height='200px'
                        width='300px'
                        url={myStream}
                    />
                </>
            }
            {remoteStream &&
                <>
                    <h1>Remote Video</h1>
                    <ReactPlayer
                        playing
                        muted
                        height='200px'
                        width='300px'
                        url={remoteStream}
                    />
                </>
            }
        </div>
    )
}

export default RoomPage;