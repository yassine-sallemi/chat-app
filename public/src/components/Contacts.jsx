import { useState, useEffect } from "react";
import styled from "styled-components";
import Logout from "./Logout";
import { BiPhoneIncoming } from "react-icons/bi";
import Peer from "simple-peer";

export default function Contacts({
  contacts,
  changeChat,
  socket,
  call,
  setCall,
  callAccepted,
  setCallAccepted,
  setStream,
  connectionRef,
  hisVideo,
}) {
  const [currentUserName, setCurrentUserName] = useState(undefined);
  const [currentSelected, setCurrentSelected] = useState(undefined);

  useEffect(function () {
    const settingFt = async () => {
      const data = await JSON.parse(
        localStorage.getItem(import.meta.env.VITE_LOCALHOST_KEY)
      );
      setCurrentUserName(data.username);
    };
    settingFt();
  }, []);

  useEffect(
    function () {
      if (socket) {
        socket.on("callUser", (data) => {
          if (data.signal) {
            const { from, name: callerName, signal } = data;
            setCall({ isReceivingCall: true, from, name: callerName, signal });
          } else {
            setCall(undefined);
          }
        });
      }
    },
    [setCall, socket]
  );

  const changeCurrentChat = (index, contact) => {
    setCurrentSelected(index);
    changeChat(contact);
  };

  const answerCall = async () => {
    const currentStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setStream(currentStream);

    setCallAccepted(true);

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: currentStream,
    });

    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: call.from });
    });

    peer.signal(call.signal);

    peer.on("stream", (currentStream) => {
      hisVideo.current.srcObject = currentStream;
    });

    peer.on("close", () => {
      socket.off("callAccepted");
    });

    connectionRef.current = peer;
  };

  return (
    <Container>
      <div className="contacts">
        {contacts.map((contact, index) => {
          return (
            <div
              key={contact._id}
              className={`contact ${
                index === currentSelected ? "selected" : ""
              }`}
              onClick={() => changeCurrentChat(index, contact)}
            >
              <div className="username">
                <h3>{contact.username}</h3>
              </div>
            </div>
          );
        })}
      </div>
      {call?.name && !callAccepted && !connectionRef.current ? (
        <div className="current-user">
          <div className="username">
            <h2>{call.name} is calling...</h2>
          </div>
          <Button
            onClick={() => {
              answerCall();

              const contact = contacts.find((c) => c.username === call.name);
              const contactIndex = contacts.findIndex(
                (c) => c.username === call.name
              );

              changeCurrentChat(contactIndex, contact);
            }}
          >
            <BiPhoneIncoming />
          </Button>
        </div>
      ) : (
        <div></div>
      )}

      <div className="current-user">
        <div className="username">
          <h2>{currentUserName}</h2>
        </div>
        <Logout />
      </div>
    </Container>
  );
}
const Container = styled.div`
  display: grid;
  grid-template-rows: 70% 15% 15%;
  overflow: hidden;
  background-color: #080420;

  .contacts {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
    padding: 2rem 0;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .contact {
      background-color: #ffffff34;
      min-height: 5rem;
      cursor: pointer;
      width: 90%;
      border-radius: 0.2rem;
      padding: 0.8rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      transition: 0.5s ease-in-out;

      .username {
        h3 {
          color: white;
        }
      }
    }
    .selected {
      background-color: #9a86f3;
    }
  }

  .current-user {
    background-color: #0d0d30;
    display: flex;
    justify-content: space-around;
    align-items: center;
    .username {
      h2 {
        color: white;
      }
    }
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      gap: 0.5rem;
      .username {
        h2 {
          font-size: 1rem;
        }
      }
    }
  }
`;

const Button = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background-color: #9a86f3;
  border: none;
  cursor: pointer;
  svg {
    font-size: 1.3rem;
    color: #ebe7ff;
  }
`;
