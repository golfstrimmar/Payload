'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useStateContext } from '@/components/StateProvaider'
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
  status: 'active' | 'inactive'
  mediaUrls?: { url: string }[]
  location?: { coordinates: [number, number]; address?: string }
  user?: { id: string; email?: string }
}

const Kalendar: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const { events, setEvents, user, setFlagEvents } = useStateContext()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedDay, setselectedDay] = useState<string>('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // -------------------------

  useEffect(() => {
    if (events) {
      console.log('<==== events kalendar====>', events)
    }
  }, [events])
  // -------------------------
  // -------------------------
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
  // -----------------------------------
  // -----------------------------------
  // -----------------------------------
  // -----------------------------------
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

      // Текущее время в Europe/Berlin
      const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' }))

      const filteredEvents = (eventsMap.get(dateKey) || []).map((event) => {
        const eventDate = parseEventDate(event.date, event.time)
        if (isNaN(eventDate.getTime())) {
          console.warn('Skipping event with invalid date:', event)
          return event
        }

        console.log('<====eventDate====>', eventDate)
        console.log(
          '<====now====>',
          now.toLocaleString('de-DE', {
            timeZone: 'Europe/Berlin',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          }),
        )

        const timeDiff = eventDate.getTime() - now.getTime()
        const isPast = timeDiff < 0
        const isUpcoming = timeDiff > 0 && timeDiff <= 30 * 60 * 1000 // 30 минут

        return {
          ...event,
          status: isPast ? 'inactive' : event.status,
          isUpcoming,
        }
      })

      return filteredEvents
    },
    [selectedMonth, eventsMap, parseEventDate],
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setFlagEvents((prev) => !prev)
    }, 60000)

    return () => clearInterval(interval)
  }, [events, setEvents])
  // -----------------------------------
  // -----------------------------------
  // -----------------------------------
  const getMonthDays = useCallback((monthIndex: number) => {
    const year = 2025
    const firstDay = new Date(year, monthIndex, 1)
    const firstDayOffset = (firstDay.getDay() + 6) % 7
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
  // --------------renderDays----------------

  const renderDays = useMemo(() => {
    if (selectedMonth === null) return null
    const { days } = getMonthDays(selectedMonth)

    return days.map((day, index) => {
      const dayEvents = getEventsForDate(day)

      return (
        <div
          key={`${selectedMonth}-${index}`}
          className={`day ${day ? 'active' : 'empty'}`}
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
                ? '#5e1bf9'
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
              className={`${day ? 'day-number' : ''}`}
            >
              {day || ''}
            </div>
            <div className="day-name">{day ? findDayName(day) : ''}</div>
          </div>

          {dayEvents.length > 0 && (
            <div className="events-container">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className={`text-slate-800 shadow-[0_4px_9px_rgba(0,0,0,0.25)] rounded-sm hover:text-blue-700 transition duration-300 ease-in-out cursor-pointer ${
                    event.status === 'active' && !event.isUpcoming
                      ? 'bg-white'
                      : event.status === 'active' && event.isUpcoming
                        ? 'bg-red-700 text-white pulse'
                        : 'bg-slate-400'
                  }`}
                >
                  <Link href={`/events/${event.id}`} className="inline-block w-full px-1 py-1">
                    <strong> {event.title}</strong>
                    <br className="mb-1" />
                    {event.time.split(':')[0] + ':' + event.time.split(':')[1]}
                  </Link>
                </div>
              ))}
            </div>
          )}
          {/* ===================================== */}
        </div>
      )
    })
  }, [selectedMonth, getMonthDays, getEventsForDate])

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

      <div>
        <div className="flex justify-between mb-4">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300 ease-in-out cursor-pointer"
          >
            Delete Events
          </button>
        </div>
        <AnimatePresence>
          {showDeleteModal && (
            <DeleteEventsModal
              events={events}
              setEvents={setEvents}
              setShowDeleteModal={setShowDeleteModal}
            />
          )}
        </AnimatePresence>
      </div>
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
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
              <div key={day} className="weekday">
                {day}
              </div>
            ))}
          </div>
          <div className="days">{renderDays}</div>
        </div>
      )}
    </div>
  )
}

export default Kalendar
