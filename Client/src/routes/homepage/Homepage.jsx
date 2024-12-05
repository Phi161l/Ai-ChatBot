import { Link } from "react-router-dom";
import "./homepage.css";
import { TypeAnimation } from "react-type-animation";
import { useState } from "react";

const Homepage = () => {
  const [typingStatus, setTypingStatus] = useState("human1");

  return (
    <div className="homepage">
      <img src="/orbital.png" alt="" className="orbital" />
      <div className="left">
        <h1> Ai ChatBot </h1>
        <h2>knowledge at your fingertips. explore the power of AI</h2>
        <h3>
          We are here to make your life easier with quick, accurate inforamtion
          and assistance.
        </h3>
        <Link to="/dashboard"> Start here </Link>
      </div>
      <div className="right">
        <div className="imgContainer">
          <img src="/chatbot.jpg" alt="" className="bot" />
          <div className="chat">
            <img
              src={
                typingStatus === "human1"
                  ? "/human1.jpeg"
                  : typingStatus === "human2"
                  ? "/human2.jpeg"
                  : "/robot-assistant.png"
              }
              alt=""
            />
            <TypeAnimation
              sequence={[
                // Same substring at the start will only be typed out once, initially
                "Human:   What is the capital of france?",
                2000,
                () => {
                  setTypingStatus("bot");
                },
                "Bot:  paris",
                2000,
                () => {
                  setTypingStatus("human2");
                },
                "Human2:  what is javascript?",
                2000,
                () => {
                  setTypingStatus("bot");
                },
                "Bot: javascript is a programming language.",
                2000,
                () => {
                  setTypingStatus("human1");
                },
              ]}
              wrapper="span"
              repeat={Infinity}
              cursor={true}
              omitDeletionAnimation={true}
            />
          </div>
        </div>
      </div>

    </div>
  );
};

export default Homepage;
