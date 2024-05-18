import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from '../context/SocketProvider';
const LobbyScreen = () => {
    const [email, setEmail] = useState('');
    const [room, setRoom] = useState('');

    const socket = useSocket()
    const navigate = useNavigate();
    const handleSubmitForm = useCallback((e) => {
        e.preventDefault();
        console.log(email, room)
        socket.emit('join_room', { email, room })
    }, [email, room, socket])


    const handleJoinRoom = useCallback((data) => {
        navigate(`/room/${data.room}`)
    }, [navigate])

    useEffect(() => {
        socket.on('join_room', handleJoinRoom);
        return () => {
            socket.off('join_room', handleJoinRoom);
        }
    }, [socket, handleJoinRoom])


    return (
        <div>
            <h1>Lobby</h1>
            <form onSubmit={handleSubmitForm}>
                <label htmlFor="email" >Email</label>
                <input type="email" id="email" value={email} onChange={(e) => { setEmail(e.target.value) }} />
                <br />
                <br />
                <label htmlFor="room" >Room No</label>
                <input type="text" id="room" value={room} onChange={(e) => { setRoom(e.target.value) }} />
                <br />
                <br />
                <button>Join</button>
            </form>
        </div>
    )
}

export default LobbyScreen