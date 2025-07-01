import './SignupForm.css';

const SignupForm = () => (
  <div className="signup-form-container">
    <h2 className="signup-form-title">Sign Up</h2>
    <form className="signup-form-fields">
      <input className="signup-form-input" type="text" placeholder="Name" required />
      <input className="signup-form-input" type="email" placeholder="Email" required />
      <input className="signup-form-input" type="password" placeholder="Password" required />
      <button className="signup-form-button" type="submit">Sign Up</button>
    </form>
  </div>
);

export default SignupForm; 