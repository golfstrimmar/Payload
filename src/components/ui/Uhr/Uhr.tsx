'use client'
import React, { useState, useEffect } from 'react'
import styles from './Uhr.module.scss'


const Uhr: React.FC = () => {
  const [now, setNow] = useState<string>('')
  const updateTime = () => {
    setNow(
      new Date()
        .toLocaleString('de-DE', {
          timeZone: 'Europe/Berlin',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          weekday: 'long',
        })
        .replace(' ', ' '),
    )
  }
  useEffect(() => {
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`${styles['uhr']}  flex flex-col items-center `}>
      <div className="flex">
        <div className={`${styles['uhr-item']}`}>{now.slice(22, 24)}:</div>
        <div className={`${styles['uhr-item']}`}>{now.slice(25, 27)}:</div>
        <div className={`${styles['uhr-item']}`}>{now.slice(28, 30)}</div>
      </div>
      <div>{now.slice(10, 20)}</div>
      <div>{now.slice(0, 8)}</div>
    </div>
  )
}

export default Uhr
