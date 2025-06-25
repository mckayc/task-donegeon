import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('adventurer');
  const [guild, setGuild] = useState('');
  const [guilds, setGuilds] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // Fetch guilds for registration
    axios.get('http://localhost:5000/api/guilds')
      .then(res => setGuilds(res.data))
      .catch(err => console.error('Error fetching guilds:', err));

    // Fetch users for switching
    axios.get('http://localhost:5000/api/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error('Error fetching users:', err));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/login', { username, password });
      setCurrentUser(res.data.user);
      alert('Login successful!');
    } catch (err) {
      alert('Login failed: ' + (err.response?.data?.message || 'Unknown error'));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/register', {
        username,
        password: password || null,
        role,
        guild_id: guild || null
      });
      alert('Registration successful! Please log in.');
      setIsLogin(true);
    } catch (err) {
      alert('Registration failed: ' + (err.response?.data?.message || 'Unknown error'));
    }
  };

  const handleSwitchUser = (userId) => {
    axios.get(`http://localhost:5000/api/users/${userId}`)
      .then(res => {
        setCurrentUser(res.data);
        setIsDropdownOpen(false);
      })
      .catch(err => console.error('Error switching user:', err));
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="min-h-screen bg-gray-900 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?fit=crop&w=1500&h=1000')] bg-cover bg-center flex flex-col justify-center items-center p-4 font-cinzel">
      <div className="relative bg-[url('https://images.unsplash.com/photo-1579547945413-397f24ad1f37?fit=crop&w=500&h=400')] bg-cover bg-center rounded-xl p-8 shadow-2xl max-w-md w-full border-4 border-gray-700">
        {/* Torch glow effects */}
        <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-orange-400 blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-orange-400 blur-3xl opacity-50 animate-pulse"></div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-red-700 drop-shadow-md">Task Donegeon</h1>
          {currentUser && (
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="bg-yellow-600 text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-500 transition-transform duration-300 transform hover:scale-105"
              >
                {currentUser.username}
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg z-10 border border-gray-600">
                  {users.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleSwitchUser(user.id)}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200"
                    >
                      {user.username} ({user.role})
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {isLogin ? (
          <form onSubmit={handleLogin}>
            <h2 className="text-2xl font-semibold mb-6 text-yellow-600 drop-shadow-sm text-center">Enter the Donegeon</h2>
            <div className="mb-4">
              <label className="block text-sm mb-2 text-gray-300 text-center">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full p-2 bg-gray-800 bg-opacity-50 rounded-lg text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 mx-auto block"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm mb-2 text-gray-300 text-center">Password (optional for Adventurers)</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-2 bg-gray-800 bg-opacity-50 rounded-lg text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 mx-auto block"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-red-700 text-gray-100 p-3 rounded-lg hover:bg-red-600 transition-transform duration-300 transform hover:scale-105 mx-auto block"
            >
              Login
            </button>
            <p className="mt-4 text-center text-gray-300">
              New to the Donegeon?{' '}
              <button onClick={() => setIsLogin(false)} className="text-yellow-500 hover:underline">
                Register
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <h2 className="text-2xl font-semibold mb-6 text-yellow-600 drop-shadow-sm text-center">Join the Donegeon</h2>
            <div className="mb-4">
              <label className="block text-sm mb-2 text-gray-300 text-center">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full p-2 bg-gray-800 bg-opacity-50 rounded-lg text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 mx-auto block"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-2 text-gray-300 text-center">Password (optional for Adventurers)</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-2 bg-gray-800 bg-opacity-50 rounded-lg text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 mx-auto block"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-2 text-gray-300 text-center">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full p-2 bg-gray-800 bg-opacity-50 rounded-lg text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 mx-auto block"
                required
              >
                <option value="adventurer">Adventurer</option>
                <option value="bailiff">Bailiff</option>
                <option value="donegeon_master">Donegeon Master</option>
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-sm mb-2 text-gray-300 text-center">Guild (optional)</label>
              <select
                value={guild}
                onChange={e => setGuild(e.target.value)}
                className="w-full p-2 bg-gray-800 bg-opacity-50 rounded-lg text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 mx-auto block"
              >
                <option value="">No Guild</option>
                {guilds.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-red-700 text-gray-100 p-3 rounded-lg hover:bg-red-600 transition-transform duration-300 transform hover:scale-105 mx-auto block"
            >
              Register
            </button>
            <p className="mt-4 text-center text-gray-300">
              Already in the Donegeon?{' '}
              <button onClick={() => setIsLogin(true)} className="text-yellow-500 hover:underline">
                Login
              </button>
            </p>
          </form>
        )}
      </div>
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap"
        rel="stylesheet"
      />
      <style>
        {`
          .font-cinzel {
            font-family: 'Cinzel', serif;
          }
          @keyframes pulse {
            0% { opacity: 0.5; }
            50% { opacity: 0.8; }
            100% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

export default App;