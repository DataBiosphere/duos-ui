import React, { Children, isValidElement, type ReactNode } from 'react'
import './Grid.css'

export interface GridProps {
  /** A large item shown above the grid, spanning every column. */
  featured?: ReactNode
  /** One card per child. */
  children?: ReactNode
}

/** A responsive card grid (Analysis Apps, S3.4): one list, with the featured item first. */
export const Grid = ({ featured, children }: GridProps) => (
  <ul role="list" className="showcase-grid">
    {featured && <li className="showcase-grid__featured">{featured}</li>}
    {Children.toArray(children).map((card, i) => <li key={isValidElement(card) ? card.key : i}>{card}</li>)}
  </ul>
)
