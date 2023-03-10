import { React } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Reaptcha from 'reaptcha'
import axios from "axios";
import Navbar from "../common/Navbar";
import Button from "../common/Button";
import FormControl from "../common/FormControl";
import Modal from "../common/Modal";
import { validateEmail, validatePassword } from "../../assets/validations";
import { getCookie, saveCookie, saveSession } from "../../assets/cookies";
import Loader from "../common/Loader";

const Login = () => {

  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [modalMessage, setModalMessage] = useState("Please fill the email and password, requirement are in the tooltip.");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recaptcha, setRecaptcha] = useState(false);
  const navigate = useNavigate();

  const captchRef = useRef(null);

  const verifyCaptcha = () => {
    captchRef.current.getResponse().then(res => {
      setRecaptcha(res);
    })
  }
  const resetCaptcha = () => {
    setRecaptcha(false);
  }

  const onSubmit = async () => {
    setLoading(true);
    if (!recaptcha) {
      setModalMessage("Please authenticate recaptcha.");
      setShowModal(true);
      setLoading(false);
      return;
    }
    if (validateEmail(userEmail) && validatePassword(userPassword)) {
      const res = await SendLoginRequest();
      if (res.sessionId) {
        if (remember) {
          saveCookie("sessionId", res.sessionId);
          saveCookie("email", userEmail);
          saveCookie("password", userPassword);
        }
        saveSession(res.sessionId);
        setTimeout(() => {
          navigate('/dashboard');
        }, 10);
      } else {
        setModalMessage(`Failed to login, ${res.message}`);
        setShowModal(true);
      }
    } else {
      // display modal.
      setModalMessage("Please fill the email and password, requirement are in the tooltip.");
      setShowModal(true);
    }
    setLoading(false);
  }

  const SendLoginRequest = async () => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_SERVER_API}/login`, { email: userEmail, password: userPassword });
      return res.data;
    } catch (err) {
      return { message: err.message };
    }
  }

  useEffect(() => {
    setLoading(true);
    document.title = `${process.env.REACT_APP_SITE_NAME} - Login`;

    // Check cookies for "remember me"
    const email = getCookie("email");
    const password = getCookie("password");
    if (email && password) {
      const sessionId = getCookie('sessionId');
      try {
        axios.post(`${process.env.REACT_APP_SERVER_API}/login-session`, { sessionId: sessionId })
          .then((res) => {
            if (res.data.sessionId) {
              saveCookie("sessionId", res.data.sessionId);
              setTimeout(() => {
                navigate("/dashboard");
              }, 10);
            } else {
              setModalMessage(`Failed to login, ${res.data.message}`);
              setShowModal(true);
            }
          });
      } catch (err) {
        setModalMessage(`Failed to login, ${err.message}`);
        setShowModal(true);
      }
      finally {
        setLoading(false)
      }
    }
    return () => setLoading(false);
  }, []);

  useEffect(() => {
    const sessionId = getCookie('sessionId');
    if (sessionId) {
      try {
        axios.post(`${process.env.REACT_APP_SERVER_API}/login-session`, { sessionId: sessionId })
          .then((res) => {
            if (res.data.sessionId) {
              saveSession(res.data.sessionId);
              setTimeout(() => {
                navigate("/dashboard");
              }, 10);
            } else {
              setModalMessage(`Failed to login, ${res.data.message}`);
              setShowModal(true);
            }
          });
      } catch (err) {
        setModalMessage(`Failed to login, ${err.message}`);
        setShowModal(true);
      }
      finally {
        setLoading(false)
      }
    }
  }, [])

  return (
    <>
      <Navbar />
      <main className="page">
        <h1>Login to your account</h1>
        <form>
          {loading && <Loader />}
          <FormControl
            inputType="email" inputId="email" placeHolder="Email Address" isRequired={false}
            containToolTip={true} toolTipContent="Example: johndoe@gmail.com" onChangeCallback={setUserEmail} />

          <FormControl
            inputType="password" inputId="password" placeHolder="Password" isRequired={false}
            containToolTip={true} toolTipContent="Password must be atleast 6 characters long.
          Password must contain:
          Upper case letter
          Lower case letter
          Special character
          A number." onChangeCallback={setUserPassword} />

          <Reaptcha sitekey={process.env.REACT_APP_SITE_KEY} ref={captchRef} onVerify={verifyCaptcha} onExpire={resetCaptcha} />

          <div style={{ textAlign: "center" }}>
            <input type="checkbox" name="remember" id="remember" onChange={(e) => setRemember(e.target.checked)} />
            <span>Remember Me</span>
          </div>
          <Button className="btn" content="Login" onClickCallback={onSubmit} />

          <p className="text">
            Don't have an account? <NavLink to="/signup">Signup</NavLink>
            <br />
            <NavLink to="/forgotpassword">Forgot Password?</NavLink>
          </p>
        </form>
        {showModal && <Modal errorMessage={modalMessage} setDisplay={setShowModal} />}
      </main>
    </>
  );
}
export default Login;
