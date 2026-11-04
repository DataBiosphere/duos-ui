import React, { Children, isValidElement, type ReactNode } from 'react'
import './Grid.css'

export interface GridProps {
  /** A large item shown above the grid, spanning every column. */
  featured?: ReactNode
  /** One card per child. */
  children?: ReactNode
}

/**
 * A responsive card grid (Analysis Apps, S3.4): one list, with the featured item first.
 *
 * `featured` is checked with `Children.toArray`, which drops null, undefined and booleans as for
 * `children`; a plain `featured &&` would render a falsy number such as 0 as a bare text node
 * directly inside the `ul`.
 */
export const Grid = ({ featured, children }: GridProps) => (
  <ul role="list" className="showcase-grid">
    {Children.toArray(featured).length > 0 && <li className="showcase-grid__featured">{featured}</li>}
    {Children.toArray(children).map((card, i) => <li key={isValidElement(card) ? card.key : i}>{card}</li>)}
  </ul>
)
