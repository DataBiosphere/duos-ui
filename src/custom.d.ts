declare module '*.svg' {
  import type * as React from 'react'
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>

  const src: string
  export default src
}
declare module '*.pdf' {
  const src: string
  export default src
}

declare module '*.png'

declare module '*.jpg'
declare module '*.jpeg'

declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}

/** The one Vite glob form the app uses (`src/showcases/images.ts`); vite/client types are not loaded. */
interface ImportMeta {
  glob<T>(pattern: string, options: { eager: true, query: '?url', import: 'default' }): Record<string, T>
}
