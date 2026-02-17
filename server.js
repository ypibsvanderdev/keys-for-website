import express from 'express';
import Stripe from 'stripe';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// =======================
// STRIPE CONFIGURATION
// =======================
// Set your Stripe secret key as an environment variable: STRIPE_SECRET_KEY
// Set your webhook secret as: STRIPE_WEBHOOK_SECRET
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_PLACEHOLDER');

// The Code Defender's Firebase DB (same one used by vander-lua-code-defender)
const FIREBASE_URL = 'https://vanderhub-default-rtdb.firebaseio.com/.json';

// Your frontend domain (for Stripe redirects)
const DOMAIN = process.env.DOMAIN || 'https://vander-key-store.onrender.com';

// =======================
// KEY GENERATION
// =======================
function generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = () => {
        let s = '';
        for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
        return s;
    };
    return `VANDER-${segment()}-${segment()}-${segment()}`;
}

// Register a key into the Code Defender's Firebase database
async function registerKeyInFirebase(key, plan) {
    try {
        const res = await axios.get(FIREBASE_URL);
        const db = res.data || { users: [], repos: [], keys: [] };
        db.keys = db.keys || [];

        const keyData = {
            id: key,
            type: plan === 'lifetime' ? 'lifetime' : 'monthly',
            plan: plan,
            used: false,
            hwid: null,
            createdAt: new Date().toISOString(),
            expiresAt: null // Set when the key is redeemed
        };

        // For monthly keys, set a 30-day expiry from creation
        if (plan === 'monthly') {
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 30);
            keyData.expiresAt = expiry.toISOString();
        }

        db.keys.push(keyData);
        await axios.put(FIREBASE_URL, db);
        console.log(`✅ Key registered in Firebase: ${key} (${plan})`);
        return true;
    } catch (e) {
        console.error('❌ Failed to register key in Firebase:', e.message);
        return false;
    }
}

// In-memory store of generated keys (also persisted to Firebase)
// Maps Stripe session ID -> { key, plan, email }
const generatedKeys = {};

// =======================
// MIDDLEWARE
// =======================

// Stripe webhook needs raw body - must be BEFORE express.json()
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    if (webhookSecret) {
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } catch (err) {
            console.error('⚠️ Webhook signature verification failed:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
    } else {
        // If no webhook secret, parse the event directly (dev mode)
        event = JSON.parse(req.body);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const plan = session.metadata?.plan || 'lifetime';
        const email = session.customer_email || session.customer_details?.email || 'unknown';

        // Generate the HWID key
        const key = generateKey();

        // Register it in Firebase
        await registerKeyInFirebase(key, plan);

        // Store it so the success page can fetch it
        generatedKeys[session.id] = { key, plan, email, createdAt: new Date().toISOString() };

        console.log(`🔑 Key generated for ${email}: ${key} (${plan})`);
    }

    res.json({ received: true });
});

// Now apply JSON parsing for all other routes
app.use(express.json());

// Serve static files from public directory
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// =======================
// API ROUTES
// =======================

// Create a Stripe Checkout session
app.post('/api/create-checkout', async (req, res) => {
    const { plan } = req.body; // 'lifetime' or 'monthly'

    try {
        let sessionConfig = {
            payment_method_types: ['card'],
            mode: 'payment',
            success_url: `${DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${DOMAIN}/#store`,
            metadata: { plan },
        };

        if (plan === 'lifetime') {
            sessionConfig.line_items = [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Vander Defender — Lifetime Key',
                        description: 'Permanent access to Vander Lua Code Defender. One-time HWID key.',
                    },
                    unit_amount: 5000, // $50.00 in cents
                },
                quantity: 1,
            }];
        } else if (plan === 'monthly') {
            sessionConfig.line_items = [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Vander Defender — Monthly Key',
                        description: '30 days of access to Vander Lua Code Defender. One-time HWID key.',
                    },
                    unit_amount: 500, // $5.00 in cents
                },
                quantity: 1,
            }];
        } else {
            return res.status(400).json({ error: 'Invalid plan' });
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);
        res.json({ url: session.url, sessionId: session.id });
    } catch (e) {
        console.error('❌ Stripe checkout error:', e.message);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// Get the key for a completed checkout session
app.get('/api/get-key', async (req, res) => {
    const { session_id } = req.query;

    if (!session_id) {
        return res.status(400).json({ error: 'Missing session_id' });
    }

    // Check in-memory store first
    if (generatedKeys[session_id]) {
        return res.json(generatedKeys[session_id]);
    }

    // If not in memory (e.g., server restarted), check with Stripe
    try {
        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status === 'paid') {
            const plan = session.metadata?.plan || 'lifetime';
            const email = session.customer_email || session.customer_details?.email || 'unknown';

            // Generate a new key if we don't have one
            const key = generateKey();
            await registerKeyInFirebase(key, plan);

            generatedKeys[session_id] = { key, plan, email, createdAt: new Date().toISOString() };
            return res.json(generatedKeys[session_id]);
        } else {
            return res.status(402).json({ error: 'Payment not completed' });
        }
    } catch (e) {
        console.error('❌ Session retrieval error:', e.message);
        return res.status(500).json({ error: 'Failed to verify payment' });
    }
});

// Health check
app.get('/api/ping', (req, res) => {
    res.json({ status: 'ALIVE', timestamp: new Date() });
});

// Serve frontend pages
app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔐 Vander Key Store running on port ${PORT}`);
    console.log(`💳 Stripe mode: ${process.env.STRIPE_SECRET_KEY ? 'LIVE' : 'TEST (placeholder key)'}`);
});
