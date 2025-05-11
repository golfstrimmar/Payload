'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useStateContext } from '@/components/StateProvaider'
import { AnimatePresence } from 'framer-motion'
import AddEventModal from '@/components/AddEventModal/AddEventModal'
import './Kalendar.scss'
import './KalendarDeep.scss'
import Link from 'next/link'
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
  status: boolean
  mediaUrls?: { url: string }[]
  location?: { coordinates: [number, number]; address?: string }
  user?: { id: string; email?: string }
}

const Kalendar: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const router = useRouter()
  const { events, setEvents, user } = useStateContext()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedDay, setselectedDay] = useState<string>('')

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

  const getEventsForDate = useCallback(
    (day: number) => {
      if (!day || selectedMonth === null) return []
      const utcDate = new Date(Date.UTC(2025, selectedMonth, day))
      const dateKey = utcDate.toISOString().slice(0, 10)
      return eventsMap.get(dateKey) || []
    },
    [selectedMonth, eventsMap],
  )

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
    // router.push(`/events/new?date=${date.toISOString()}`)
    setShowCreateModal(true)
    setselectedDay(date.toISOString())
  }

  const findDayName = (day: number) => {
    const date = new Date(2025, selectedMonth, day)
    return date.toLocaleString('de-DE', { weekday: 'long' })
  }

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
              {dayEvents.map((event, index) => (
                <div
                  key={index}
                  className="text-blue-500 bg-white shadow-[0_4px_9px_rgba(0,0,0,0.25)] rounded-sm hover:text-blue-700 transition duration-300 ease-in-out  cursor-pointer"
                >
                  <Link href={`/events/${event.id}`} className="inline-block w-full px-2 py-1">
                    {event.title}
                    <br />
                    {new Date(event.date).toLocaleString('de-DE', {
                      timeZone: 'Europe/Berlin',
                      hour: 'numeric',
                      minute: 'numeric',
                    })}
                    <span>{event.status}</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
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
          <h3>{GERMAN_MONTHS[selectedMonth]}</h3>
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
