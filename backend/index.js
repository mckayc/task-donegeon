const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost' }));

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
});

// Models
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: true },
  role: { type: DataTypes.STRING, allowNull: false, validate: { isIn: [['donegeon_master', 'bailiff', 'adventurer']] } },
  guild_id: { type: DataTypes.INTEGER, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

const Guild = sequelize.define('Guild', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

User.belongsTo(Guild, { foreignKey: 'guild_id' });

// Initialize database
sequelize.sync().then(() => {
  console.log('Database synced');
  // Seed a default guild
  Guild.findOrCreate({ where: { name: 'Default Guild' }, defaults: { name: 'Default Guild' } });
});

// Endpoints
app.get('/api/guilds', async (req, res) => {
  const guilds = await Guild.findAll();
  res.json(guilds);
});

app.get('/api/users', async (req, res) => {
  const users = await User.findAll({ attributes: ['id', 'username', 'role'] });
  res.json(users);
});

app.get('/api/users/:id', async (req, res) => {
  const user = await User.findByPk(req.params.id, { attributes: ['id', 'username', 'role'] });
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

app.post('/api/register', async (req, res) => {
  const { username, password, role, guild_id } = req.body;
  try {
    if (!username || !role) {
      return res.status(400).json({ message: 'Username and role are required' });
    }
    if (role === 'donegeon_master' && !password) {
      return res.status(400).json({ message: 'Password required for Donegeon Master' });
    }
    if (role === 'bailiff' && !password) {
      return res.status(400).json({ message: 'Password required for Bailiff' });
    }
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const user = await User.create({ username, password: hashedPassword, role, guild_id: guild_id || null });
    res.json({ message: 'Registration successful', user: { id: user.id, username, role } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username' });
    }
    if (user.role !== 'adventurer' && !password) {
      return res.status(401).json({ message: 'Password required for non-Adventurers' });
    }
    if (user.password && !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', user: { id: user.id, username, role: user.role }, token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.listen(5000, () => console.log('Backend running on port 5000'));