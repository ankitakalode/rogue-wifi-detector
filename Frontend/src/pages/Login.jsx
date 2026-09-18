import Sidebar from '../components/Sidebar';
import './Pages.css';

function Login() {
  return (
    <div className="page-layout">
      <Sidebar />
      <main>
        <h1>Log in</h1>
        <p className="login-note">Login isn't connected to the backend yet — this is a placeholder for when account tracking is added.</p>
        <form className="login-form" onSubmit={(e) => e.preventDefault()}>
          <label>Email</label>
          <input type="email" placeholder="name@example.com" />
          <label>Password</label>
          <input type="password" placeholder="Enter your password" />
          <button type="submit">Log in</button>
        </form>
      </main>
    </div>
  );
}

export default Login;