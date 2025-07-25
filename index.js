const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');


const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
}));
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://chinomsochristian03:wClILCmuLiAdRh4v@mesh.0e6xnyb.mongodb.net/?retryWrites=true&w=majority&appName=mesh"
  )
  .then(() => {
      console.log("Connected to MongoDB");
    // seedUsers();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
    fullname: String,
    email: { type: String, unique: true },
    password: String,
    phone: { type: String, unique: true },
    accountNumber: { type: String, unique: true },
    amount: { type: Number, default: 300000 },
});
// wClILCmuLiAdRh4v;
// chinomsochristian03;

const User = mongoose.model('User', userSchema);

// Seed users: remove all and add new with phone/accountNumber
async function seedUsers() {
    await User.deleteMany({});
    const users = [
        { fullname: 'John Doe', email: 'john@example.com', password: 'password1', phone: '09155802922' },
        { fullname: 'Jane Smith', email: 'jane@example.com', password: 'password2', phone: '08012345678' },
        { fullname: 'Mike Brown', email: 'mike@example.com', password: 'password3', phone: '08123456789' },
        { fullname: 'Lisa White', email: 'lisa@example.com', password: 'password4', phone: '07098765432' },
        { fullname: 'Sam Green', email: 'sam@example.com', password: 'password5', phone: '09087654321' },
    ];
    for (const user of users) {
        const hashed = await bcrypt.hash(user.password, 10);
        const accountNumber = user.phone.slice(-10);
        await User.create({
            fullname: user.fullname,
            email: user.email,
            password: hashed,
            phone: user.phone,
            accountNumber,
            amount: 300000,
        });
    }
    console.log('Seeded 5 users with phone and accountNumber');
}

// Fetch all users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, '-password -__v'); // Exclude password and __v
        res.json({ users });
        console.log(`Fetched ${users.length} users`);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching users', error: err.message });
    }
});

// Register endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { fullname, email, password, phone } = req.body;
        if (!fullname || !email || !password || !phone) return res.status(400).json({ message: 'All fields required' });
        // Validate phone: must be 11 digits, start with 0, all digits
        if (!/^0\d{10}$/.test(phone)) return res.status(400).json({ message: 'Phone number must be 11 digits and start with 0' });
        const emailExists = await User.findOne({ email });
        if (emailExists) return res.status(400).json({ message: 'Email already registered' });
        const phoneExists = await User.findOne({ phone });
        if (phoneExists) return res.status(400).json({ message: 'Phone number already registered' });
        const accountNumber = phone.slice(-10);
        const accountExists = await User.findOne({ accountNumber });
        if (accountExists) return res.status(400).json({ message: 'Account number already exists' });
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ fullname, email, password: hashed, phone, accountNumber, amount: 300000 });
        res.json({ message: 'Registration successful', user: { id: user._id, fullname, email, phone, accountNumber, amount: user.amount } });
        console.log(`User registered: ${email}, accountNumber: ${accountNumber}`);
    } catch (err) {
        res.status(500).json({ message: 'Error registering user', error: err.message });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    console.log(req.body)
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: 'Invalid credentials' });
        res.json({ message: 'Login successful', user: { id: user._id, fullname: user.fullname, email: user.email, amount: user.amount } });
        console.log(`User logged in: ${user.email}, accountNumber: ${user.accountNumber}`);
    } catch (err) {
        res.status(500).json({ message: 'Error logging in', error: err.message });
    }
});

// Transfer endpoint (by account number)
app.post('/api/transfer', async (req, res) => {
    try {
        const { from, to, amount } = req.body;
        if (!from || !to || !amount)
          return res.status(400).json({ message: "All fields required" });
        if (from === to)
          return res
            .status(400)
            .json({ message: "Sender and receiver cannot be the same" });
        const sender = await User.findOne({ accountNumber: from });
        const receiver = await User.findOne({ accountNumber: to });
        if (!sender || !receiver) return res.status(404).json({ message: 'Sender or receiver not found' });
        if (sender.amount < amount) return res.status(400).json({ message: 'Insufficient funds' });
        sender.amount -= amount;
        receiver.amount += Number(amount);
        await sender.save();
        await receiver.save();
        res.json({
            message: 'Transaction successful',
            senderBalance: sender.amount,
            receiverBalance: receiver.amount,
        });
        console.log(`Transfer of ${amount} from ${sender.fullname} (${from}) to ${receiver.fullname} (${to}) successful`);
    } catch (err) {
        res.status(500).json({ message: 'Error processing transaction', error: err.message });
    }
});

// Fetch account balance by account number
app.get('/api/balance', async (req, res) => {
    try {
        const user = await User.findOne({ accountNumber: req.query.account });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ balance: user.amount });
        console.log(`Fetched balance for account: ${req.query.account}, balance: ${user.amount}`);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching balance', error: err.message });
    }
});

// Fetch fullname by account number (using query parameter)
app.get('/api/verify-name', async (req, res) => {
    const accountNumber = req.query.account;
    if (!accountNumber) return res.status(400).json({ message: 'Account number is required' });
    try {
        const user = await User.findOne({ accountNumber });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ fullname: user.fullname });
        console.log(`Fetched fullname for accountNumber: ${accountNumber}, fullname: ${user.fullname}`);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching fullname', error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
