document.addEventListener("DOMContentLoaded", () => {
  const user1 = "663000aa67b7fc23a0b427a1"; // your current user ID
  const user2 = "663000e067b7fc23a0b427a5"; // matched user ID

  fetch(`/chat-history?user1=${user1}&user2=${user2}`)
    .then(res => res.json())
    .then(data => {
      console.log("Chat history:", data);

      const chatBox = document.getElementById("chat-box");
      if (chatBox) {
        data.forEach(msg => {
          const msgDiv = document.createElement("div");
          msgDiv.textContent = `${msg.senderId}: ${msg.message}`;
          chatBox.appendChild(msgDiv);
        });
      }
    });
});
