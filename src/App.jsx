import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, XCircle, Clock, LogOut, Plane, User } from 'lucide-react';

const API_URL = 'https://flight-requests-backend.onrender.com/api';

export default function FlightRequestApp() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('login');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', organization: '' });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    area: '',
    description: ''
  });

  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`${API_URL}/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Invalid token');
      }
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const { username, password, organization } = registerForm;
    
    if (!username || !password || !organization) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, organization })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registration successful! Please login.');
        setView('login');
        setRegisterForm({ username: '', password: '', organization: '' });
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Cannot connect to server. Make sure backend is running on http://localhost:5000');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const { username, password } = loginForm;
    
    if (!username || !password) {
      alert('Please enter username and password');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setLoginForm({ username: '', password: '' });
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Cannot connect to server. Make sure backend is running on http://localhost:5000');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setRequests([]);
    setView('login');
  };

  const handleSubmit = async () => {
    if (!formData.date || !formData.time || !formData.area || !formData.description) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newRequest = await response.json();
        setRequests(prev => [newRequest, ...prev]);
        setFormData({ date: '', time: '', area: '', description: '' });
        alert('Flight request submitted successfully!');
      } else {
        alert('Failed to submit request');
      }
    } catch (error) {
      alert('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (requestId, status, feedback) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, feedback })
      });

      if (response.ok) {
        const updatedRequest = await response.json();
        setRequests(prev => prev.map(r => r._id === requestId ? updatedRequest : r));
      } else {
        alert('Failed to update request');
      }
    } catch (error) {
      alert('Failed to update request');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-600 p-3 rounded-full">
              <Plane className="text-white" size={32} />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Flight Request</h1>
          <p className="text-gray-500 text-center mb-8">Manage your flight operations efficiently</p>
          
          {view === 'login' ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Enter your username"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Enter your password"
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 font-semibold shadow-lg hover:shadow-xl transition duration-200 transform hover:-translate-y-0.5"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div className="text-center pt-4">
                <button
                  onClick={() => setView('register')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-semibold hover:underline"
                  disabled={loading}
                >
                  Don't have an account? Register here
                </button>
              </div>

              
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    placeholder="Choose a username"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  placeholder="Choose a password"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Organization Name</label>
                <input
                  type="text"
                  value={registerForm.organization}
                  onChange={(e) => setRegisterForm({ ...registerForm, organization: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  placeholder="Enter your organization"
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 font-semibold shadow-lg hover:shadow-xl transition duration-200 transform hover:-translate-y-0.5"
              >
                {loading ? 'Registering...' : 'Create Account'}
              </button>

              <div className="text-center pt-4">
                <button
                  onClick={() => setView('login')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-semibold hover:underline"
                  disabled={loading}
                >
                  Already have an account? Login here
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Plane className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Flight Request System</h1>
                <p className="text-sm text-gray-600">
                  {user.organization} • <span className="font-medium">{user.username}</span> • 
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {user.role}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-gray-500 mt-2">Loading...</p>
          </div>
        )}

        {user.role === 'client' ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Send className="text-blue-600" size={24} />
                Submit Flight Request
              </h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Organization</label>
                  <input
                    type="text"
                    value={user.organization}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Flight Area</label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="e.g., Downtown District, 5km radius"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Flight Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="4"
                    placeholder="Describe the purpose and details of your flight..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 font-semibold shadow-lg hover:shadow-xl transition duration-200 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Send size={20} />
                  Submit Request
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">My Requests</h2>
              {requests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                    <Plane className="text-gray-400" size={40} />
                  </div>
                  <p className="text-gray-500 text-lg">No requests yet</p>
                  <p className="text-gray-400 text-sm mt-2">Submit your first flight request above</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map(request => (
                    <ClientRequestCard key={request._id} request={request} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Flight Requests</h2>
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <Clock className="text-gray-400" size={40} />
                </div>
                <p className="text-gray-500 text-lg">No pending requests</p>
                <p className="text-gray-400 text-sm mt-2">New requests will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map(request => (
                  <AdminRequestCard key={request._id} request={request} onDecision={handleDecision} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ClientRequestCard({ request }) {
  const getStatusStyles = () => {
    switch(request.status) {
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'accepted':
        return 'bg-green-50 border-green-200';
      case 'declined':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`border-2 rounded-xl p-5 transition ${getStatusStyles()}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">{request.organization}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {request.date} at {request.time}
          </p>
        </div>
        <div>
          {request.status === 'pending' && (
            <span className="flex items-center gap-1.5 text-yellow-700 text-sm font-semibold bg-yellow-100 px-3 py-1.5 rounded-full">
              <Clock size={16} />
              Pending
            </span>
          )}
          {request.status === 'accepted' && (
            <span className="flex items-center gap-1.5 text-green-700 text-sm font-semibold bg-green-100 px-3 py-1.5 rounded-full">
              <CheckCircle size={16} />
              Accepted
            </span>
          )}
          {request.status === 'declined' && (
            <span className="flex items-center gap-1.5 text-red-700 text-sm font-semibold bg-red-100 px-3 py-1.5 rounded-full">
              <XCircle size={16} />
              Declined
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-white bg-opacity-60 p-3 rounded-lg">
          <span className="text-sm font-semibold text-gray-700">Area: </span>
          <span className="text-sm text-gray-800">{request.area}</span>
        </div>
        <div className="bg-white bg-opacity-60 p-3 rounded-lg">
          <span className="text-sm font-semibold text-gray-700">Description: </span>
          <span className="text-sm text-gray-800">{request.description}</span>
        </div>
      </div>

      {request.feedback && (
        <div className="mt-4 bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <span className="text-sm font-semibold text-blue-900">Admin Feedback: </span>
          <span className="text-sm text-blue-800">{request.feedback}</span>
        </div>
      )}
    </div>
  );
}

function AdminRequestCard({ request, onDecision }) {
  const [feedback, setFeedback] = useState('');
  const [showActions, setShowActions] = useState(request.status === 'pending');

  const handleAccept = () => {
    onDecision(request._id, 'accepted', feedback || 'Request approved');
    setShowActions(false);
  };

  const handleDecline = () => {
    if (!feedback.trim()) {
      alert('Please provide feedback for declining');
      return;
    }
    onDecision(request._id, 'declined', feedback);
    setShowActions(false);
  };

  const getStatusStyles = () => {
    switch(request.status) {
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'accepted':
        return 'bg-green-50 border-green-200';
      case 'declined':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`border-2 rounded-xl p-5 transition ${getStatusStyles()}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">{request.organization}</h3>
          <p className="text-sm text-gray-600 mt-1">Client: <span className="font-medium">{request.clientUsername}</span></p>
          <p className="text-sm text-gray-600">{request.date} at {request.time}</p>
        </div>
        <div>
          {request.status === 'pending' && (
            <span className="flex items-center gap-1.5 text-yellow-700 text-sm font-semibold bg-yellow-100 px-3 py-1.5 rounded-full">
              <Clock size={16} />
              Pending
            </span>
          )}
          {request.status === 'accepted' && (
            <span className="flex items-center gap-1.5 text-green-700 text-sm font-semibold bg-green-100 px-3 py-1.5 rounded-full">
              <CheckCircle size={16} />
              Accepted
            </span>
          )}
          {request.status === 'declined' && (
            <span className="flex items-center gap-1.5 text-red-700 text-sm font-semibold bg-red-100 px-3 py-1.5 rounded-full">
              <XCircle size={16} />
              Declined
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-white bg-opacity-60 p-3 rounded-lg">
          <span className="text-sm font-semibold text-gray-700">Area: </span>
          <span className="text-sm text-gray-800">{request.area}</span>
        </div>
        <div className="bg-white bg-opacity-60 p-3 rounded-lg">
          <span className="text-sm font-semibold text-gray-700">Description: </span>
          <span className="text-sm text-gray-800">{request.description}</span>
        </div>
      </div>

      {request.feedback && (
        <div className="mt-4 bg-gray-100 p-4 rounded-lg">
          <span className="text-sm font-semibold text-gray-700">Your Feedback: </span>
          <span className="text-sm text-gray-800">{request.feedback}</span>
        </div>
      )}

      {showActions && (
        <div className="space-y-3 mt-4">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Add your feedback (e.g., Area too large, weather not suitable, etc.)..."
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={handleAccept}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl hover:from-green-700 hover:to-green-800 font-semibold shadow-md hover:shadow-lg transition duration-200 flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              Accept
            </button>
            <button
              onClick={handleDecline}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl hover:from-red-700 hover:to-red-800 font-semibold shadow-md hover:shadow-lg transition duration-200 flex items-center justify-center gap-2"
            >
              <XCircle size={18} />
              Decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}