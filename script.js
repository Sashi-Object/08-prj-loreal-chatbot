/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");

// Keep one simple message history array.
let messages = [
  {
    role: "system",
    content:
      "You are a helpful L'Oreal beauty advisor. Only answer questions related to L'Oreal products, skincare, makeup, haircare, fragrance, ingredients, routines, and beauty recommendations. If a question is unrelated, politely refuse and redirect the user to ask about L'Oreal beauty topics.",
  },
];

// The worker URL
const workerURL = "https://chatbo-worker.nataliebonilla2.workers.dev/";

// Helper method to add messages to the chat window. Show previous messages to build up history and context for user 
// and the assistant.
function addMessage(role, text) {
  const message = document.createElement("p");
  message.classList.add("msg", role);
  message.textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return message;
}

// Set initial assistant message in the chat window.
chatWindow.textContent = "";
addMessage(
  "ai",
  "Hello! I'm your L'Oreal beauty advisor. Ask me about products, routines, or recommendations.",
);

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Ensures message is ligible before sending. 
  const message = userInput.value.trim();
  if (!message) {
    return;
  }

  // Add user message to chat and clear input.
  addMessage("user", message);
  userInput.value = "";

  sendBtn.disabled = true;
  const loadingMessage = addMessage("ai", "Thinking...");

  // Add the new user message to the messages array to maintain conversation history and context for the assistant.
  messages.push({
    role: "user",
    content: message,
  });

  try {
    const response = await fetch(workerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        data?.error?.message ||
        data?.message ||
        `Worker request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    const aiReply = data.choices?.[0]?.message?.content || data?.reply || "";

    if (!aiReply) {
      throw new Error("No assistant response was returned by your Worker.");
    }

    messages.push({
      role: "assistant",
      content: aiReply,
    });

    // Set the loading message to the assistant's reply. This way we keep the "Thinking..." message in place until we have a response, then we update it instead of adding a new message, which keeps the chat cleaner and more cohesive.
    loadingMessage.textContent = aiReply;

    // If any errors come up when reading from the AI or response then, we express them in here.
  } catch (error) {
    loadingMessage.textContent = `Error: ${error.message || "Request failed."}`;
    console.error("Chat request error:", error);

  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
});
