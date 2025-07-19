'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useStateContext } from '@/components/StateProvaider'
import { useUserContext } from '@/components/UserContext'
import { AnimatePresence } from 'framer-motion'
import AddEventModal from '@/components/AddEventModal/AddEventModal'
import './Kalendar.scss'
import './KalendarDeep.scss'
import Link from 'next/link'
import DeleteEventsModal from '@/components/DeleteEventsModal/DeleteEventsModal'

const GERMAN_MONTHS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
]

interface Event {
  id: string
  title: string
  content: string
  date: string
  time?: string
  status: 'active' | 'inactive'
  mediaUrls?: { url: string }[]
  location?: { coordinates: [number, number]; address?: string }
  user?: { id: string; email?: string }
}

const Kalendar: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const { events, setEvents, setFlagEvents, isLoading, length } = useStateContext()
  const { user } = useUserContext()

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedDay, setselectedDay] = useState<string>('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (events) {
      console.log('<==== events kalendar, length====>', events, length)
    }
  }, [events])

  const eventsMap = useMemo(() => {
    const map = new Map()

    events.forEach((event) => {
      try {
        const date = new Date(event.date)
        if (isNaN(date)) return

        const normalizedDate = new Date(
          Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
        )
        const dateKey = normalizedDate.toISOString().slice(0, 10)

        if (!map.has(dateKey)) {
          map.set(dateKey, [])
        }

        map.get(dateKey).push({
          ...event,
          originalDate: date,
          timestamp: date.getTime(),
        })
      } catch (e) {
        console.error('Error processing event:', event, e)
      }
    })

    map.forEach((events) => {
      events.sort((a, b) => a.timestamp - b.timestamp)
    })

    return map
  }, [events])

  const parseEventDate = useCallback((dateString: string): Date => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) throw new Error('Invalid date')
      return date
    } catch (e) {
      console.error('Error parsing date:', dateString, e)
      return new Date(NaN)
    }
  }, [])

  const getEventsForDate = useCallback(
    (day: number) => {
      if (!day || selectedMonth === null) return []

      const utcDate = new Date(Date.UTC(2025, selectedMonth, day))
      const dateKey = utcDate.toISOString().slice(0, 10)
      const filteredEvents = eventsMap.get(dateKey) || []
      const newFilteredEvents = filteredEvents.map((event) => {
        const eventDateTime = new Date(`${event.date}T${event.time}+02:00`)
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' }))

        const timeDiff = eventDateTime.getTime() - now.getTime()
        const isPast = timeDiff < 0
        const isUpcoming = timeDiff > 0 && timeDiff <= 30 * 60 * 1000

        return {
          ...event,
          status: isPast ? 'inactive' : 'active',
          isUpcoming,
        }
      })
      if (newFilteredEvents.length > 0) {
        return newFilteredEvents.sort((a, b) => {
          const dateA = new Date(`1970-01-01T${a.time}Z`)
          const dateB = new Date(`1970-01-01T${b.time}Z`)
          return dateA.getTime() - dateB.getTime()
        })
      }
      return newFilteredEvents
    },
    [selectedMonth, eventsMap, parseEventDate],
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setFlagEvents((prev) => !prev)
    }, 60000)

    return () => clearInterval(interval)
  }, [setFlagEvents])

  const getMonthDays = useCallback((monthIndex: number) => {
    const year = 2025
    const firstDay = new Date(year, monthIndex, 1)
    const firstDayOffset = (firstDay.getDay() + 6) % 7 // Понедельник = 0
    return {
      monthName: GERMAN_MONTHS[monthIndex],
      days: [
        ...Array(firstDayOffset).fill(null),
        ...Array.from({ length: new Date(year, monthIndex + 1, 0).getDate() }, (_, i) => i + 1),
      ],
    }
  }, [])

  const handleAdd = (date: Date) => {
    setShowCreateModal(true)
    setselectedDay(date.toISOString())
  }

  const findDayName = (day: number) => {
    const date = new Date(2025, selectedMonth, day)
    return date.toLocaleString('de-DE', { weekday: 'long' })
  }

  const isWeekend = (date: Date | null) => {
    if (!date) return { isWeekend: false, isSunday: false }
    const dayOfWeek = date.getDay()
    return {
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6, // Воскресенье (0) или Суббота (6)
      isSunday: dayOfWeek === 0, // Только воскресенье
    }
  }

  const renderDays = useMemo(() => {
    if (selectedMonth === null) return null
    const { days } = getMonthDays(selectedMonth)

    return days.map((day, index) => {
      const dayEvents = getEventsForDate(day)
      const date = day ? new Date(2025, selectedMonth, day) : null
      const { isWeekend: weekend, isSunday } = isWeekend(date)

      return (
        <div
          key={`${selectedMonth}-${index}`}
          className={`
            day
            ${day ? 'active' : 'empty'}
            ${day && weekend ? 'weekend' : ''}
            ${day && isSunday ? 'sunday' : ''}
          `}
          style={{
            backgroundColor:
              new Date(2025, selectedMonth, day).toLocaleString('de-DE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }) ===
              new Date().toLocaleString('de-DE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
                ? 'rgb(10, 228, 46)'
                : '',
          }}
        >
          <div className="head-day">
            <div
              onClick={() => {
                if (day) {
                  const date = new Date(2025, selectedMonth, day)
                  handleAdd(date)
                }
              }}
              className={`${day ? 'day-number' : ''} cursor-pointer`}
            >
              {day || ''}
            </div>
            <div className="day-name">{day ? findDayName(day) : ''}</div>
          </div>

          {dayEvents && dayEvents.length > 0 && (
            <div className="events-container">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className={`
                    text-slate-800
                    shadow-[0_4px_9px_rgba(0,0,0,0.25)]
                    rounded-sm
                    hover:text-blue-700
                    transition duration-300 ease-in-out
                    cursor-pointer
                    ${
                      event.status === 'active' && !event.isUpcoming
                        ? 'bg-white'
                        : event.status === 'active' && event.isUpcoming
                          ? 'bg-red-700 text-white pulse'
                          : 'bg-slate-400'
                    }
                  `}
                >
                  <Link href={`/events/${event.id}`} className="inline-block w-full px-1 py-1 ">
                    <div className="flex  flex-col gap-2">
                      <div>
                        <strong>{event.title}</strong>
                        <br />
                        <small className="mb-1 text-slate-600">
                          {event.time?.split(':')[0] + ':' + event.time?.split(':')[1]}
                        </small>{' '}
                      </div>
                    </div>
                    {event.mediaUrls.length > 0 && (
                      <img
                        className="inline-block w-[40px] h-[40px] object-cover rounded-[50%] mr-2 [box-shadow:_0_0_5px_#0542c4] border-2 border-[#cad8f7]"
                        src={event.mediaUrls?.[0]}
                        alt=""
                      />
                    )}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    })
  }, [selectedMonth, getMonthDays, getEventsForDate, isWeekend])

  return (
    <div className="kalendar-container">
      <AnimatePresence>
        {showCreateModal && (
          <AddEventModal
            setEvents={setEvents}
            setShowCreateModal={setShowCreateModal}
            currentUser={user}
            events={events}
            selectedDay={selectedDay}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteModal && (
          <DeleteEventsModal
            events={events}
            setEvents={setEvents}
            setShowDeleteModal={setShowDeleteModal}
          />
        )}
      </AnimatePresence>

      <div className="months-grid">
        {GERMAN_MONTHS.map((month, index) => (
          <button
            key={month}
            className={`month-button ${selectedMonth === index ? 'selected' : ''}`}
            onClick={() => setSelectedMonth(index)}
          >
            {month}
          </button>
        ))}
      </div>
      {selectedMonth !== null && (
        <div className="days-grid">
          <h3 className="text-[25px] mb-4 font-bold">{GERMAN_MONTHS[selectedMonth]}</h3>
          <div className="weekdays">
            {['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'].map(
              (day) => (
                <div key={day} className="weekday">
                  {day}
                </div>
              ),
            )}
          </div>
          <div className="days">{renderDays}</div>
        </div>
      )}
      <div className="flex justify-between mt-4">
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300 ease-in-out cursor-pointer"
        >
          Delete Events
        </button>
      </div>
    </div>
  )
}

export default Kalendar
