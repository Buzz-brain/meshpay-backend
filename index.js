const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
}));
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect( process.env.DB_URL )
  .then(() => {
      console.log("Connected to MongoDB");
    // seedUsers();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// User schema
const userSchema = new mongoose.Schema({
    fullname: String,
    email: { type: String, unique: true },
    password: String,
    phone: { type: String, unique: true },
    accountNumber: { type: String, unique: true },
    amount: { type: Number, default: 300000 },
});

// Notification schema
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Transaction schema
const transactionSchema = new mongoose.Schema({
  from: String,
  to: String,
  amount: Number,
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: "success" },
  description: String,
  senderName: String,
  receiverName: String,
});

const User = mongoose.model('User', userSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// Welcome to the MeshPay API endpoint
app.get('/', (req, res) => {
    res.send('Welcome to the MeshPay API');
});

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

// Delete all users
app.delete('/api/users', async (req, res) => {
    try {
        await User.deleteMany({});
        res.json({ message: 'All users deleted' });
        console.log('All users deleted');
    } catch (err) {
        res.status(500).json({ message: 'Error deleting users', error: err.message });
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
        res.json({
          message: "Login successful",
          user: {
            id: user._id,
            fullname: user.fullname,
            email: user.email,
            phone: user.phone,
            accountNumber: user.accountNumber,
            amount: user.amount,
          },
        });
        console.log(`User logged in: ${user.email}, accountNumber: ${user.accountNumber}`);
    } catch (err) {
        res.status(500).json({ message: 'Error logging in', error: err.message });
    }
});

// Fetch account balance by account number
app.get('/api/balance', async (req, res) => {
    const accountNumber = req.query.account;
    if (!accountNumber)
      return res.status(400).json({ message: "Account number is required" });
    try {
        const user = await User.findOne({ accountNumber });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ amount: user.amount });
        console.log(
          `Fetched balance for account: ${accountNumber}, balance: ${user.amount}`
        );
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

// Transfer endpoint (by account number)
app.post('/api/transfer', async (req, res) => {
  console.log(req.body)
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

      // Store transaction
      await Transaction.create({
        from,
        to,
        amount,
        status: 'success',
        description: req.body.description || '',
        senderName: sender.fullname,
        receiverName: receiver.fullname
      });

      // Create notification for receiver
      await Notification.create({
        userId: receiver._id,
        message: `You have received ₦${amount} from ${sender.fullname} (${sender.accountNumber})`,
      });

      res.json({
        message: "Transaction successful",
        senderAccountNumber: sender.accountNumber,
        senderName: sender.fullname,
        senderBalance: sender.amount,
        receiverAccountNumber: receiver.accountNumber,
        receiverName: receiver.fullname,
        receiverBalance: receiver.amount,
      });

      console.log(
        `Transfer of ${amount} from ${sender.fullname} (${from}) to ${receiver.fullname} (${to}) successful`
      );
    } catch (err) {
        res.status(500).json({ message: 'Error processing transaction', error: err.message });
    }
});

// Get notifications for a user
app.get('/api/notifications', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: 'userId is required' });
  try {
    // Only fetch unread notifications
    const notifications = await Notification.find({ userId, read: false }).sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications', error: err.message });
  }
});

// Mark all notifications as read for a user
app.post('/api/notifications/mark-read', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId is required' });
  try {
    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Error marking notifications as read', error: err.message });
  }
});

// Get transactions for a user (sent or received)
app.get('/api/transactions', async (req, res) => {
  const { accountNumber } = req.query;
  if (!accountNumber) return res.status(400).json({ message: 'accountNumber is required' });
  try {
    const transactions = await Transaction.find({
      $or: [
        { from: accountNumber },
        { to: accountNumber }
      ]
    }).sort({ timestamp: -1 });
    res.json({ transactions });
    // console.log(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching transactions', error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
