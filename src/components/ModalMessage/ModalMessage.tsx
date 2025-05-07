import React from "react";
import "./ModalMessage.scss";
interface ModalMessageProps {
  message: string; // Сообщение, которое будет отображаться
  open: boolean; // Флаг для управления видимостью модального окна
}
const ModalMessage: React.FC<ModalMessageProps> = ({ message, open }) => {
  return (
    <div className={`modalmessage  ${open ? "run" : ""}  `}>
      <div className="modalmessage-inner">
        <h3 className="modalmessage-message">{message}</h3>
      </div>
    </div>
  );
};

export default ModalMessage;
