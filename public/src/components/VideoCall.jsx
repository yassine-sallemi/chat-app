import { useEffect, useState } from "react";
import { BiPhoneOff, BiMicrophoneOff, BiMicrophone } from "react-icons/bi";
import styled from "styled-components";

function VideoCall({ endCall, stream, socket, myVideo, hisVideo, hisId }) {
  const [voiceOn, setVoiceOn] = useState(true);

  useEffect(
    function () {
      myVideo.current.srcObject = stream;
    },
    [stream, myVideo]
  );

  useEffect(
    function () {
      socket.on("endCall", () => {
        endCall();
      });
    },
    [endCall, socket]
  );

  const endCallClick = () => {
    endCall();
    socket.emit("endCall", { to: hisId });
  };

  return (
    <Container>
      {hisVideo ? (
        <video
          className="his-video"
          playsInline
          muted={!voiceOn}
          ref={hisVideo}
          autoPlay
        ></video>
      ) : (
        <div></div>
      )}
      <div className="buttons-container">
        <div className="buttons">
          <button onClick={() => setVoiceOn((voiceOn) => !voiceOn)}>
            {voiceOn ? <BiMicrophone /> : <BiMicrophoneOff />}
          </button>
          <button style={{ backgroundColor: "#f35a4e" }} onClick={endCallClick}>
            <BiPhoneOff />
          </button>
        </div>
      </div>

      <video
        className="my-video"
        playsInline
        muted
        ref={myVideo}
        autoPlay
      ></video>
    </Container>
  );
}

export default VideoCall;

const Container = styled.div`
  display: grid;
  grid-template-columns: 6fr 2fr;
  align-items: end;
  column-gap: 1rem;
  margin: 5rem 2rem;
  .his-video {
    height: 100%;
    grid-row: 1/3;
    border-radius: 1rem;
  }
  .my-video {
    width: 100%;
    grid-row: 2;
    grid-column: 2;
    border-radius: 1rem;
  }
  .buttons-container {
    grid-row: 1;
    grid-column: 2;
    height: 70%;
    align-self: end;

    .buttons {
      display: flex;
      height: 100%;

      flex-direction: column;
      justify-content: space-around;
      align-items: center;

      button {
        padding: 0.5rem;
        border-radius: 0.5rem;
        background-color: #9a86f3;
        border: none;
        cursor: pointer;
        svg {
          font-size: 1.3rem;
          color: #ebe7ff;
        }
      }
    }
  }
`;
