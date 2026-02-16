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
    if (!text) return;
    activityIndex = (activityIndex + 1) % activities.length;
    text.style.opacity = 0;
    setTimeout(() => {
        text.innerText = activities[activityIndex];
        text.style.opacity = 1;
    }, 500);
}
setInterval(rotateActivity, 5000);

// Direct Chat Logic (No AI)
let isSessionActive = false;
let isBusy = false; // Yahia can mark himself as busy

function toggleChat() {
    const chatWindow = document.getElementById('chat-window');
    chatWindow.classList.toggle('hidden');

    // Auto-connect if opening for the first time
    if (!isSessionActive && !chatWindow.classList.contains('hidden')) {
        startNeuralSession();
    }
}

function startNeuralSession() {
    const msgArea = document.getElementById('chat-messages');
    const status = document.getElementById('queue-status');

    setTimeout(() => {
        const sysMsg = document.createElement('div');
        sysMsg.className = 'msg system';
        sysMsg.innerText = "SESSION ESTABLISHED: ENCRYPTED CHANNEL OPEN";
        msgArea.appendChild(sysMsg);

        status.classList.add('busy');
        isSessionActive = true;
        msgArea.scrollTop = msgArea.scrollHeight;
    }, 2000);
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const msgArea = document.getElementById('chat-messages');

    if (!input.value.trim() || !isSessionActive) return;

    // User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'msg user';
    userMsg.innerText = input.value;
    msgArea.appendChild(userMsg);

    input.value = '';
    msgArea.scrollTop = msgArea.scrollHeight;

    // NOTE: In a real app, this would send to a server/Discord. 
    // Since there is no AI, no automatic response happens here.
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

    let price = "5.00";
    if (activePlan === 'Lifetime') price = "50.00";
    if (activePlan === '7 Days') price = "2.00";

    if (method === 'Crypto') {
        instruction.innerHTML = `Send <b>$${price}</b> worth of BTC to:<br><code style='color:var(--accent)'>bc1qxfv982hjs039485jns039485</code>`;
    } else if (method === 'PayPal') {
        instruction.innerHTML = `Send <b>$${price}</b> via Friends & Family to:<br><code style='color:var(--accent)'>vander.payments@gmail.com</code>`;
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

    chatHeader.innerText = "Secure Channel | Yahia";
    chatWindow.classList.remove('hidden');

    const systemMsg = document.createElement('div');
    systemMsg.className = 'msg system';
    systemMsg.innerText = "URGENT: YAHIA HAS BEEN NOTIFIED OF YOUR PURCHASE";
    msgArea.appendChild(systemMsg);

    isSessionActive = true;
    msgArea.scrollTop = msgArea.scrollHeight;
}

// Close modal on click outside
window.onclick = function (event) {
    const modal = document.getElementById('payment-modal');
    if (event.target == modal) {
        closePayment();
    }
}
