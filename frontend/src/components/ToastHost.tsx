import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";

/** UI-SHELL-04: đọc `successMessage` từ router state, hiện 3s rồi tự ẩn,
 * clear navigation state ngay để back/refresh không hiện lại. */
export function ToastHost() {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const processedKeyRef = useRef<string | null>(null);

  // Đọc successMessage mới + clear navigation state — tách riêng khỏi
  // effect hẹn giờ bên dưới, vì tự gọi navigate() ở đây sẽ đổi
  // location.key/location.state, và nếu chung 1 effect thì cleanup của
  // effect đó sẽ huỷ luôn timer vừa đặt.
  useEffect(() => {
    const state = location.state as { successMessage?: string } | null;
    const successMessage = state?.successMessage;

    if (!successMessage || processedKeyRef.current === location.key) {
      return;
    }

    processedKeyRef.current = location.key;
    setMessage(successMessage);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.key, location.state, location.pathname, navigate]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) {
    return null;
  }

  return (
    <div className="toast-success" role="status">
      {message}
    </div>
  );
}

export default ToastHost;
