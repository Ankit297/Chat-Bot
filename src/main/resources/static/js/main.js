'use strict';

// DOM Elements
const usernamePage = document.querySelector('#username-page');
const chatPage = document.querySelector('#chat-page');
const usernameForm = document.querySelector('#usernameForm');
const messageForm = document.querySelector('#messageForm');
const messageInput = document.querySelector('#message');
const messageArea = document.querySelector('#messageArea');
const connectingElement = document.querySelector('.connecting');

let stompClient = null;
let username = null;

const colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

// Connect to WebSocket server
function connect(event) {
    username = document.querySelector('#name').value.trim();

    if (username) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        const socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }
    event.preventDefault();
}

// Handle successful connection
function onConnected() {
    stompClient.subscribe('/topic/public', onMessageReceived);
    stompClient.send("/app/chat.addUser", {}, JSON.stringify({ sender: username, type: 'JOIN' }));
    connectingElement.classList.add('hidden');
}

// Handle connection error
function onError(error) {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}

// Send a message
function sendMessage(event) {
    const messageContent = messageInput.value.trim();

    if (messageContent && stompClient) {
        const chatMessage = {
            sender: username,
            content: messageContent,
            type: 'CHAT'
        };

        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
    event.preventDefault();
}

// Display received messages
function onMessageReceived(payload) {
    const message = JSON.parse(payload.body);
    const messageElement = document.createElement('li');

    if (message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        messageElement.textContent = `${message.sender} joined!`;
    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        messageElement.textContent = `${message.sender} left!`;
    } else {
        messageElement.classList.add('chat-message');

        const avatarElement = document.createElement('i');
        avatarElement.textContent = message.sender[0];
        avatarElement.style.backgroundColor = getAvatarColor(message.sender);
        avatarElement.classList.add('avatar');

        const usernameElement = document.createElement('span');
        usernameElement.textContent = message.sender;

        const textElement = document.createElement('p');
        textElement.textContent = message.content;

        messageElement.append(avatarElement, usernameElement, textElement);
    }

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;

    // Add fade-in effect
    messageElement.classList.add('fade-in');
}

// Generate avatar color
function getAvatarColor(messageSender) {
    let hash = 0;
    for (let i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
}

// Event listeners
usernameForm.addEventListener('submit', connect);
messageForm.addEventListener('submit', sendMessage);

// CSS for fade-in animation
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = `
    .fade-in {
        animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        margin-right: 10px;
        font-size: 18px;
    }

    .chat-message, .event-message {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
    }

    .chat-message {
        background-color: #e0f7fa;
        padding: 10px;
        border-radius: 10px;
    }

    .event-message {
        color: #00796b;
        font-style: italic;
    }
`;
document.head.appendChild(styleSheet);
