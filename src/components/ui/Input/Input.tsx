"use client";
import React, { RefObject } from "react";
import styles from "./Input.module.scss";

interface InputProps {
  typeInput:
    | "text"
    | "textarea"
    | "number"
    | "datetime-local"
    | "email"
    | "tel"
    | "date"
    | "password"
    | "search"
    | "time";
  data: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  inputRef?: RefObject<HTMLInputElement | HTMLTextAreaElement>; // Сделали необязательным
  onClick?: (
    e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement, MouseEvent>
  ) => void;
  activ?: boolean; // Добавили activ как опциональный пропс
}

const Input: React.FC<InputProps> = ({
  typeInput,
  data,
  value,
  onChange,
  inputRef,
  onClick,
  activ,
}) => {
  return (
    <div className={styles["input-field"]}>
      {typeInput === "textarea" ? (
        <textarea
          rows="5"
          id={data}
          name={data}
          value={value}
          ref={inputRef as RefObject<HTMLTextAreaElement>}
          onChange={onChange}
          onClick={onClick}
          className={`${
            activ ? "bg-emerald-400  " : ""
          } cursor-pointer border rounded  px-1   border-emerald-900`}
          required
        />
      ) : (
        <input
          id={data}
          ref={inputRef as RefObject<HTMLInputElement>}
          name={data}
          type={typeInput}
          value={value}
          onChange={onChange}
          onClick={onClick}
          className={`${
            activ ? "bg-emerald-400  " : ""
          } cursor-pointer border rounded  px-1   border-emerald-900`}
          required
        />
      )}
      <label htmlFor={data}>{data}</label>
    </div>
  );
};

export default Input;
