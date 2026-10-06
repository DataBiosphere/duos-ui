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
declare module '*.mp4' {
  const src: string
  export default src
}
declare module '*.webm' {
  const src: string
  export default src
}

declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}
