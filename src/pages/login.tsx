import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
// Note: This code uses plain text password comparison which is NOT secure
// In production, you should implement proper password hashing

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Debug: Log the credentials being used
      console.log('Login attempt:', {
        email: formData.email,
        password: formData.password
      });
      
      // Query the userBT table to find user with matching email and password
      const { data: users, error: queryError } = await supabase
        .from('usersBT')
        .select('*')
        .eq('email', formData.email)
        .eq('password', formData.password)
        .single();

      // Debug: Log the complete response
      console.log('Supabase response:', { data: users, error: queryError });

      if (queryError) {
        console.log('Query error code:', queryError.code);
        console.log('Query error message:', queryError.message);
        console.log('Query error details:', queryError.details);
        console.log('Query error hint:', queryError.hint);
        
        if (queryError.code === 'PGRST116') {
          setError('Invalid email or password');
        } else if (queryError.code === 'PGRST301') {
          setError('Database access denied. Please check RLS policies.');
        } else {
          console.error('Full query error:', queryError);
          setError(`Login failed: ${queryError.message}`);
        }
        setLoading(false);
        return;
      }

      // Check if user exists and has admin role
      if (users && users.role === 'admin') {
        console.log('Admin login successful for:', users.email);
        
        // Store user session data
        const userData = {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role
        };
        
        sessionStorage.setItem('userId', users.id.toString());
        sessionStorage.setItem('user', JSON.stringify(userData));
        
        navigate('/adminHome');
      } else if (users && users.role !== 'admin') {
        console.log('User found but not admin:', users.role);
        setError('Access denied. Admin privileges required.');
      } else {
        console.log('No user found with provided credentials');
        setError('Invalid email or password');
      }

    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="row w-100 justify-content-center">
        <div className="col-12 col-sm-8 col-md-6 col-lg-4">
          <div className="card shadow">
            <div className="card-body p-4">
              <div className="text-center mb-4">
                <h2 className="card-title h3 fw-bold text-dark">My Bubble Time</h2>
                <p className="text-muted">Admin Panel Login</p>
              </div>
              
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="form-control"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="form-control"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                  />
                </div>

                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Signing in...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;