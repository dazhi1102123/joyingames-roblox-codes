"use client"

import { useState } from "react"
import { MONTHS, birthCards, yearCard } from "@arcana/core"
import { CardFace } from "../card-face"

/** Worked out in the browser. A birth date is the most identifying thing on
 *  this site, and the only way to be sure it is not stored is not to send it. */
export function BirthTool() {
  const now = new Date()
  const [month, setMonth] = useState(1)
  const [day, setDay] = useState(1)
  const [year, setYear] = useState(1990)

  const maxDay = MONTHS[month - 1][2] as number
  const safeDay = Math.min(day, maxDay)
  const { personality, soul } = birthCards(year, month, safeDay)
  const thisYear = yearCard(now.getFullYear(), month, safeDay)
  const same = personality.slug === soul.slug

  return (
    <>
      <form className="order-form birth" onSubmit={(e) => e.preventDefault()}>
        <label>
          <span className="eyebrow">Month</span>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map(([, name], i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="eyebrow">Day</span>
          <select value={safeDay} onChange={(e) => setDay(Number(e.target.value))}>
            {Array.from({ length: maxDay }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="eyebrow">Year</span>
          <input
            type="number"
            min={1900}
            max={now.getFullYear()}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </label>
      </form>

      <ul className="neighbours birth-result">
        <li>
          <a href={`/cards/${personality.slug}`}>
            <CardFace slug={personality.slug} />
            <span>
              {personality.name}
              <br />
              <em>{same ? "personality & soul" : "personality"}</em>
            </span>
          </a>
        </li>
        {!same && (
          <li>
            <a href={`/cards/${soul.slug}`}>
              <CardFace slug={soul.slug} />
              <span>
                {soul.name}
                <br />
                <em>soul</em>
              </span>
            </a>
          </li>
        )}
        <li>
          <a href={`/cards/${thisYear.slug}`}>
            <CardFace slug={thisYear.slug} />
            <span>
              {thisYear.name}
              <br />
              <em>{now.getFullYear()}</em>
            </span>
          </a>
        </li>
      </ul>

      <p className="note">
        <a href={`/birth-card/${MONTHS[month - 1][0]}-${safeDay}`}>
          The page for {MONTHS[month - 1][1]} {safeDay} →
        </a>
      </p>
    </>
  )
}
