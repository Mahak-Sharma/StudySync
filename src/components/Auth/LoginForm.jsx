import './LoginForm.css';

const LoginForm = () => (
  <div className="login-form-container">
    <h2 className="login-form-title">Login</h2>
    <form className="login-form-fields">
      <input className="login-form-input" type="email" placeholder="Email" required />
      <input className="login-form-input" type="password" placeholder="Password" required />
      <button className="login-form-button" type="submit">Login</button>
    </form>
  </div>
);

export default LoginForm; 