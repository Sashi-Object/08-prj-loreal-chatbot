/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");

const workerURL = "https://chatbo-worker.nataliebonilla2.workers.dev/";

// This system prompt keeps the assistant focused on L'Oreal beauty topics.
const SYSTEM_PROMPT =
  "You are a helpful L'Oreal beauty advisor. Only answer questions related to L'Oreal products, skincare, makeup, haircare, fragrance, ingredients, routines, and beauty recommendations. If a question is unrelated, politely refuse and redirect the user to ask about L'Oreal beauty topics.";

const conversation = [
  {
    role: "system",
    content: SYSTEM_PROMPT,
  },
];

function addMessage(role, text) {
  const msg = document.createElement("p");
  msg.classList.add("msg", role);
  msg.textContent = text;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return msg;
}

function setLoadingState(isLoading) {
  sendBtn.disabled = isLoading;
  userInput.disabled = isLoading;
}

function getAssistantText(data) {
  return (
    data?.choices?.[0]?.message?.content ||
    data?.result?.response ||
    data?.response ||
    data?.message ||
    ""
  );
}

// Set initial assistant message in the chat window.
chatWindow.textContent = "";
addMessage(
  "ai",
  "Hello. I can help with L'Oreal products and beauty routines.",
);

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = userInput.value.trim();
  if (!message) {
    return;
  }

  addMessage("user", message);
  userInput.value = "";

  setLoadingState(true);
  const loadingMessage = addMessage("ai", "Thinking...");

  conversation.push({
    role: "user",
    content: message,
  });

  try {
    // Send the full messages array to your Cloudflare Worker endpoint.
    const response = await fetch(workerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ messages: conversation }),
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      throw new Error("Worker did not return JSON.");
    }

    if (!response.ok) {
      const errorMessage =
        data?.error?.message ||
        data?.message ||
        `Worker request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    const aiReply = getAssistantText(data);

    if (!aiReply) {
      throw new Error("No assistant response was returned by your Worker.");
    }

    conversation.push({
      role: "assistant",
      content: aiReply,
    });

    loadingMessage.textContent = aiReply;
  } catch (error) {
    loadingMessage.textContent = `Error: ${error.message}`;
    console.error("Chat request error:", error);
  } finally {
    setLoadingState(false);
    userInput.focus();
  }
});
