import React, { useEffect } from "react";
import "./AllEventsList.scss";
import { useSelector, useDispatch } from "react-redux";
import Event from "../Event/Event.jsx";
// Компонент
const AllEventsList = React.memo(() => {
  const AllEvents = useSelector((state) => state.events.events);

  useEffect(() => {
    console.log("==AllEvents AllEventsList==", AllEvents);
  }, [AllEvents]);

  return (
    <div className="events-list">
      {AllEvents &&
        AllEvents.map((event, index) => (
          <Event
            key={index}
            id={event._id}
            date={event.date}
            content={event.content}
            status={event.status}
          />
        ))}
    </div>
  );
});

export default AllEventsList;
