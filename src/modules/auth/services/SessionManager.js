import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearUser } from "../../../app/providers/userSlice";
import { persistor } from "../../../store";
import { Modal, Button } from "react-bootstrap";
import {
  getLoginPath,
  getSavedLoginOrganization,
} from "./organizationContextService";

const IDLE_TIMEOUT = 15 * 60 * 1000; // 2 minutes
const WARNING_TIME = 14 * 60 * 1000; // show modal at 1 minute

const SessionManager = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const timerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const intervalRef = useRef(null); // ✅ FIX
  const isLoggingOutRef = useRef(false); // ✅ FIX

  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(
    Math.floor((IDLE_TIMEOUT - WARNING_TIME) / 1000)
  );

  const logout = async () => {
    if (isLoggingOutRef.current) return; // ✅ prevent multiple calls
    isLoggingOutRef.current = true;

    setShowModal(false);

    setTimeout(async () => {
      dispatch(clearUser());
      await persistor.purge();
      navigate(getLoginPath(getSavedLoginOrganization()));
    }, 200);
  };

  const startCountdown = () => {
    let time = Math.floor((IDLE_TIMEOUT - WARNING_TIME) / 1000);

    setCountdown(time);

    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      time -= 1;
      setCountdown(time);

      if (time <= 0) {
        clearInterval(intervalRef.current);
      }
    }, 1000);
  };

  const resetTimer = () => {
    clearTimeout(timerRef.current);
    clearTimeout(warningTimerRef.current);
    clearInterval(intervalRef.current);

    setShowModal(false);
    setCountdown(Math.floor((IDLE_TIMEOUT - WARNING_TIME) / 1000));

    warningTimerRef.current = setTimeout(() => {
      setShowModal(true);
      startCountdown();
    }, WARNING_TIME);

    timerRef.current = setTimeout(logout, IDLE_TIMEOUT);
  };

  const extendSession = () => {
    resetTimer();
  };

  useEffect(() => {
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "wheel",
      "touchstart",
    ];

    events.forEach((e) =>
      window.addEventListener(e, resetTimer, { passive: true })
    );

    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      clearTimeout(timerRef.current);
      clearTimeout(warningTimerRef.current);
      clearInterval(intervalRef.current); // ✅ FIX
    };
  }, []);

  return (
    <>
      {children}

      <Modal show={showModal} centered backdrop="static">
        <Modal.Header>
          <Modal.Title>Session Expiring</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p>
            You will be logged out in <strong>{countdown}</strong> seconds due
            to inactivity.
          </p>
        </Modal.Body>

        <Modal.Footer>
         
          <Button variant="primary" onClick={extendSession}>
            Stay Logged In
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SessionManager;
