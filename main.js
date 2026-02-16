// Live Activity Feed Simulation
const activities = [
    "Recent Purchase: User 'VanderDev' bought a Lifetime Key (2m ago)",
    "Recent Purchase: User 'ScriptGod' bought 30 Days Access (5m ago)",
    "Recent Trade: User 'Luzon' paid with Nuke Dino (12m ago)",
    "System: 42 users currently viewing the store",
    "Recent Purchase: User 'Roux' bought a 7-day Key (1m ago)"
];

let activityIndex = 0;
function rotateActivity() {
    const text = document.getElementById('live-text');
    activityIndex = (activityIndex + 1) % activities.length;
    text.style.opacity = 0;
    setTimeout(() => {
        text.innerText = activities[activityIndex];
        text.style.opacity = 1;
    }, 500);
}
setInterval(rotateActivity, 5000);

// Neural Chat Logic
function toggleChat() {
    const chatWindow = document.getElementById('chat-window');
    chatWindow.classList.toggle('hidden');
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const msgArea = document.getElementById('chat-messages');

    if (!input.value.trim()) return;

    // User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'msg user';
    userMsg.innerText = input.value;
    msgArea.appendChild(userMsg);

    const userText = input.value.toLowerCase();
    input.value = '';
    msgArea.scrollTop = msgArea.scrollHeight;

    // Bot Response
    setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.className = 'msg bot';

        let response = "I'm processing your request. Please select a key plan to proceed with payment.";

        if (userText.includes('price') || userText.includes('key')) {
            response = "We offer 7-day, 30-day, and Lifetime keys. Select 'Purchase Access' on the main page to see the automated payment gateway.";
        } else if (userText.includes('brainrot') || userText.includes('pet') || userText.includes('dino')) {
            response = "BRAINROT EXCHANGE ACTIVE: We accept Nuke Dino as minimum payment. Once you click 'Pay with Brainrots' in the checkout modal, enter your Roblox ID and I will generate a trade link for you.";
        } else if (userText.includes('status') || userText.includes('work')) {
            response = "All systems operational. Keys are delivered instantly after payment verification.";
        } else if (userText.includes('hello') || userText.includes('hi')) {
            response = "Welcome to the Neural Exchange. I'm here to facilitate your access to Vander Hub.";
        }

        botMsg.innerText = response;
        msgArea.appendChild(botMsg);
        msgArea.scrollTop = msgArea.scrollHeight;
    }, 1000);
}

// Payment Logic
let activePlan = "";

function openPayment(plan) {
    activePlan = plan;
    document.getElementById('selected-plan').innerText = `Plan: ${plan} Access`;
    document.getElementById('payment-modal').classList.remove('hidden');
    document.getElementById('payment-details').classList.add('hidden');
}

function closePayment() {
    document.getElementById('payment-modal').classList.add('hidden');
}

function selectPay(method) {
    const details = document.getElementById('payment-details');
    const instruction = document.getElementById('pay-instruction');
    details.classList.remove('hidden');

    if (method === 'Crypto') {
        instruction.innerHTML = "Send <b>$15.00</b> worth of BTC to:<br><code style='color:var(--accent)'>bc1qxfv982hjs039485jns039485</code>";
    } else if (method === 'PayPal') {
        instruction.innerHTML = "Send <b>$15.00</b> via Friends & Family to:<br><code style='color:var(--accent)'>vander.payments@gmail.com</code>";
    } else if (method === 'Brainrot') {
        instruction.innerHTML = "<b>PAY WITH BRAINROTS</b><br>Minimum item: <span style='color:var(--accent)'>Nuke Dino</span><br>Enter your Roblox username below and wait for a trade request.";
    }
}

function confirmPayment() {
    const txId = document.getElementById('tx-id').value;
    if (!txId) return alert("Please enter a Transaction ID or Username");

    closePayment();

    // Switch to Direct Channel
    const chatWindow = document.getElementById('chat-window');
    const chatHeader = chatWindow.querySelector('.chat-header span');
    const msgArea = document.getElementById('chat-messages');

    chatHeader.innerText = "Direct Channel | Yahia";
    chatWindow.classList.remove('hidden');

    const systemMsg = document.createElement('div');
    systemMsg.className = 'msg bot';
    systemMsg.style.borderColor = 'var(--accent)';
    systemMsg.style.borderWidth = '1px';
    systemMsg.style.borderStyle = 'solid';
    systemMsg.innerText = "APPLICATION RECEIVED: You are now in a direct channel with Yahia. Please wait for a response regarding your key.";
    msgArea.appendChild(systemMsg);

    setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.className = 'msg bot';
        botMsg.innerText = "Yahia is reviewing your application. Leave your Discord or Roblox ID if you haven't already.";
        msgArea.appendChild(botMsg);
        msgArea.scrollTop = msgArea.scrollHeight;
    }, 3000);
}

// Close modal on click outside
window.onclick = function (event) {
    const modal = document.getElementById('payment-modal');
    if (event.target == modal) {
        closePayment();
    }
}
