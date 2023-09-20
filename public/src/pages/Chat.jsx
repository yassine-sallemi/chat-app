/* eslint-disable no-undef */
import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import Peer from "simple-peer";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import styled from "styled-components";
import { allUsersRoute, host } from "../utils/APIRoutes";
import ChatContainer from "../components/ChatContainer";
import Contacts from "../components/Contacts";
import Welcome from "../components/Welcome";
import VideoCall from "../components/VideoCall";

export default function Chat() {
  const navigate = useNavigate();

  const socket = useRef();

  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(undefined);
  const [currentUser, setCurrentUser] = useState(undefined);

  const [call, setCall] = useState({});
  const [callAccepted, setCallAccepted] = useState(false);
  const [stream, setStream] = useState();

  const [timer, setTimer] = useState(null);

  const timerTimeout = useRef();
  const timerInterval = useRef();

  const myVideo = useRef();
  const hisVideo = useRef();
  const connectionRef = useRef();

  useEffect(
    function () {
      async function settingCurrentUser() {
        if (!localStorage.getItem(import.meta.env.VITE_LOCALHOST_KEY)) {
          navigate("/login");
        } else {
          setCurrentUser(
            await JSON.parse(
              localStorage.getItem(import.meta.env.VITE_LOCALHOST_KEY)
            )
          );
        }
      }
      settingCurrentUser();
    },
    [navigate]
  );

  useEffect(() => {
    if (currentUser) {
      socket.current = io(host);
      socket.current.emit("add-user", currentUser._id);
    }
  }, [currentUser]);

  useEffect(
    function () {
      async function settingContacts() {
        if (currentUser) {
          const data = await axios.get(`${allUsersRoute}/${currentUser._id}`);
          setContacts(data.data);
        }
      }
      settingContacts();
    },
    [currentUser, navigate]
  );

  const endCall = useCallback(async () => {
    setCall(undefined);

    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach(function (track) {
        track.stop();
      });
    }

    setStream(undefined);

    if (myVideo.current) myVideo.current.srcObject = null;
    if (hisVideo.current) hisVideo.current.srcObject = null;

    await connectionRef.current.destroy();

    connectionRef.current = null;

    setCallAccepted(false);
  }, [stream]);

  const handleChatChange = (chat) => {
    setCurrentChat(chat);
  };

  const callUser = async () => {
    const currentStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setStream(currentStream);

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: currentStream,
    });

    peer.on("signal", (data) => {
      socket.current.emit("callUser", {
        userToCallId: currentChat._id,
        signalData: data,
        name: currentUser.username,
        from: currentUser._id,
      });
    });

    socket.current.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);

      clearTimeout(timerTimeout.current);
      clearInterval(timerInterval.current);
      setTimer(null);
    });

    peer.on("stream", (currentStream) => {
      hisVideo.current.srcObject = currentStream;
    });

    peer.on("close", () => {
      socket.current.off("callAccepted");
    });

    connectionRef.current = peer;

    setTimer(10);
    timerInterval.current = setInterval(() => {
      setTimer((timer) => timer - 1);
    }, 1000);
    timerTimeout.current = setTimeout(function () {
      if (!callAccepted) {
        const tracks = currentStream.getTracks();
        tracks.forEach(function (track) {
          track.stop();
        });
        endCall();
        socket.current.emit("callUser", {
          userToCallId: currentChat._id,
          signal: undefined,
        });
      }
      clearInterval(timerInterval.current);
    }, 10000);
  };

  return (
    <>
      <Container>
        <div className="container">
          <Contacts
            contacts={contacts}
            changeChat={handleChatChange}
            socket={socket.current}
            call={call}
            setCall={setCall}
            callAccepted={callAccepted}
            setCallAccepted={setCallAccepted}
            stream={stream}
            setStream={setStream}
            connectionRef={connectionRef}
            hisVideo={hisVideo}
          />
          {currentChat === undefined ? (
            <Welcome />
          ) : !callAccepted ? (
            <ChatContainer
              currentChat={currentChat}
              socket={socket.current}
              callUser={callUser}
              stream={stream}
              timer={timer}
            />
          ) : (
            <VideoCall
              endCall={endCall}
              stream={stream}
              socket={socket.current}
              myVideo={myVideo}
              hisVideo={hisVideo}
              hisId={currentChat._id}
            />
          )}
        </div>
      </Container>
    </>
  );
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background-color: #131324;
  .container {
    height: 85vh;
    width: 85vw;
    background-color: #00000076;
    display: grid;
    grid-template-columns: 25% 75%;
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      grid-template-columns: 35% 65%;
    }
  }
`;
