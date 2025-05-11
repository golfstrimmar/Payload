import React, { useState, useEffect } from "react";
import "./GermanCalendar.scss";
import { IconButton } from "@mui/material";
import { ArrowForward, ArrowBack, BorderRight } from "@mui/icons-material";
// Дни недели на немецком
const weekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const months = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

const GermanCalendar = React.memo(
  ({ handleDateChange, transData, setFinishDate }) => {
    // Изначально выбранная дата — текущая дата
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
      if (transData) {
        // const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/;

        // if (isoDateRegex.test(transData)) {
        //   const dateObject = new Date(transData);
        //   handleDateChange(transData);
        //   setCurrentDate(dateObject);
        //   setSelectedDate(dateObject);
        // } else
        if (typeof transData === "string" && transData.includes(".")) {
          // Разделяем строку на части (день, месяц, год)
          const [day, month, year] = transData.split(".");
          // Создаем строку в формате "YYYY-MM-DD"
          const formattedDateString = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
          // Создаем объект Date
          const dateObject = new Date(formattedDateString);
          console.log("===--- dateObject ---====", dateObject);
          handleDateChange(transData);
          setCurrentDate(dateObject);
          setSelectedDate(dateObject);
        } else   {
          const dateObject = new Date(transData);
          handleDateChange(transData);
          setCurrentDate(dateObject);
          setSelectedDate(dateObject);
        }
        // }
      }
    }, [transData]);

    useEffect(() => {
      if (handleDateChange) {
        handleDateChange(selectedDate);
      }
      if (setFinishDate) {
        setFinishDate(selectedDate);
      }
    }, [selectedDate]);

    // Функция для получения всех дней текущего месяца
    const getDaysInMonth = (date) => {
      if (date) {
        let year = new Date(date).getFullYear();
        let month = new Date(date).getMonth();
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0);
        const days = [];

        // Получаем день недели для первого дня месяца
        const firstDayOfMonth =
          startOfMonth.getDay() === 0 ? 6 : startOfMonth.getDay() - 1; // сдвигаем воскресенье на 6

        const totalDaysInMonth = endOfMonth.getDate();

        // Добавляем пустые ячейки для дней до начала месяца
        for (let i = 0; i < firstDayOfMonth; i++) {
          days.push(null);
        }

        // Добавляем все дни месяца
        for (let i = 1; i <= totalDaysInMonth; i++) {
          days.push(i);
        }

        return days;
      }
    };

    // Обработчик клика по дню
    const handleDayClick = (day) => {
      if (day) {
        let year = new Date(currentDate).getFullYear();
        let month = new Date(currentDate).getMonth();
        const newDate = new Date(year, month, day);
        setSelectedDate(newDate); // Устанавливаем выбранную дату

        if (handleDateChange) {
          handleDateChange(newDate);
        }
      }
    };

    // Обработчик изменения месяца
    const handleMonthChange = (direction) => {
      const newDate = new Date(currentDate);

      newDate.setMonth(new Date(currentDate).getMonth() + direction);

      // Обновляем текущий месяц
      setCurrentDate(newDate);

      // При смене месяца сбрасываем выбранную дату
      // setSelectedDate(null);
      if (!selectedDate) {
        setSelectedDate(new Date());
      }
    };

    // Получаем дни для отображения
    const daysInMonth = getDaysInMonth(currentDate);
    return (
      <div className="german-calendar rel">
        <div className="calendar-header">
          <IconButton
            className="styled-arrow"
            type="button"
            onClick={() => handleMonthChange(-1)}
          >
            <ArrowBack />
          </IconButton>
          <span>{months[new Date(currentDate).getMonth()]}</span>
          {/* <span>{new Date(currentDate).getFullYear()}</span> */}
          <IconButton
            className="styled-arrow"
            type="button"
            onClick={() => handleMonthChange(1)}
          >
            <ArrowForward />
          </IconButton>
        </div>
        <div className="calendar-grid">
          {weekdays.map((day, index) => (
            <div key={index} className="calendar-day">
              {day}
            </div>
          ))}

          {daysInMonth.map((day, index) => (
            <div
              key={index}
              className={`calendar-day ${day === new Date(selectedDate).getDate() && new Date(currentDate).getMonth() === new Date(selectedDate).getMonth() ? "selected" : ""}`}
              style={{
                borderRight:
                  index === daysInMonth.length - 1 ? "2px solid #6B5F00" : "",
              }}
              onClick={() => handleDayClick(day)}
            >
              {day}
            </div>
          ))}
        </div>
        {/* {selectedDate && (
          <div className="selected-date">
            <p>
              Ausgewähltes Datum: {selectedDate.toLocaleDateString("de-DE")}
            </p>
          </div>
        )} */}
      </div>
    );
  }
);

export default GermanCalendar;
