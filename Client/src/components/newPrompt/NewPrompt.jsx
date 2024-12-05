import { useEffect, useRef, useState } from "react";
import "./newPrompt.css";
import Upload from "../upload/Upload";
import { IKImage } from "imagekitio-react";
import model from "../../lib/gemini";
import Markdown from "react-markdown";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const NewPrompt = ({ data }) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [img, setImg] = useState({
    isLoading: false,
    error: "",
    dbData: {},
    aiData: {},
  });

  // Prepare history, ensuring first message has 'user' role
  const history = data?.history?.length
    ? data.history.map(({ role, parts }) => ({
        role: role || "user",
        parts: [{ text: parts[0].text }],
      }))
    : [{ role: "user", parts: [{ text: "Hello" }] }]; // Fallback message if history is empty

  const chat = model.startChat({
    history,
    generationConfig: {
      // maxOutputTokens: 100, // Optional configuration
    },
  });

  const endRef = useRef(null);
  const formRef = useRef(null);
  const queryClient = useQueryClient();
  const hasRun = useRef(false);

  useEffect(() => {
    endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [data, question, answer, img.dbData]);

  useEffect(() => {
    if (!hasRun.current && data?.history?.length === 1) {
      add(data.history[0].parts[0].text, true);
    }
    hasRun.current = true;
  }, [data]);

  // Handle the mutation to update the chat data
  const mutation = useMutation({
    mutationFn: () => {
      return fetch(`${import.meta.env.VITE_API_URL}/api/chats/${data._id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.length ? question : undefined,
          answer,
          img: img.dbData?.filePath || undefined,
        }),
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: ["chat", data._id] })
        .then(() => {
          formRef.current.reset();
          setQuestion("");
          setAnswer("");
          setImg({
            isLoading: false,
            error: "",
            dbData: {},
            aiData: {},
          });
        });
    },
    onError: (err) => console.error(err),
  });

  // Handle the conversation flow with the AI model
  const add = async (text, isInitial) => {
    if (!isInitial) setQuestion(text);

    try {
      const result = await chat.sendMessageStream(
        Object.entries(img.aiData).length ? [img.aiData, text] : [text]
      );
      let accumulatedText = "";
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        console.log(chunkText);
        accumulatedText += chunkText;
        setAnswer(accumulatedText);
      }
      mutation.mutate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = e.target.text.value;
    if (text) {
      add(text, false);
    }
  };

  return (
    <>
      {/* Show loading if image is being uploaded */}
      {img.isLoading && <div>Loading...</div>}

      {/* Display uploaded image */}
      {img.dbData?.filePath && (
        <IKImage
          urlEndpoint={import.meta.env.VITE_IMAGE_KIT_ENDPOINT}
          path={img.dbData?.filePath}
          width="380"
          transformation={[{ width: 380 }]}
        />
      )}

      {/* Display user question */}
      {question && <div className="message user">{question}</div>}

      {/* Display model answer */}
      {answer && (
        <div className="message">
          <Markdown>{answer}</Markdown>
        </div>
      )}

      {/* Scroll to the latest message */}
      <div className="endChat" ref={endRef}></div>

      {/* Form to send new question */}
      <form className="newForm" onSubmit={handleSubmit} ref={formRef}>
        <Upload setImg={setImg} />
        <input id="file" type="file" multiple={false} hidden />
        <input type="text" name="text" placeholder="Ask anything..." />
        <button>
          <img src="/arrow.png" alt="" />
        </button>
      </form>
    </>
  );
};

export default NewPrompt;
