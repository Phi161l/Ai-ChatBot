import { Link } from "react-router-dom";
import "./chatList.css";
import { useQuery } from "@tanstack/react-query";

const ChatList = () => {
  // Fetch user chats using react-query
  const { isLoading, isError, data, error } = useQuery({
    queryKey: ["userChats"],
    queryFn: () =>
      fetch(`${import.meta.env.VITE_API_URL}/api/userchats`, {
        credentials: "include",
      }).then((res) => res.json()),
  });

  // Early return for loading and error states
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Something went wrong: {error.message}</div>;

  return (
    <div className="chatList">
      {/* Dashboard Section */}
      <span className="title">DASHBOARD</span>
      <Link to="/dashboard">Create a new Chat</Link>
      <hr />

      {/* Recent Chats Section */}
      <span className="title">RECENT CHATS</span>
      <div className="list">
        {data?.length > 0 ? (
          data.map((chat) => (
            <Link to={`/dashboard/chats/${chat._id}`} key={chat._id}>
              {chat.title}
            </Link>
          ))
        ) : (
          <p>No chats available</p>
        )}
      </div>

      <hr />
    </div>
  );
};

export default ChatList;
