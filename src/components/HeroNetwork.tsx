import React from 'react'
import { Box } from '@mui/material'
import { keyframes } from '@mui/system'

type Point = { x: number, y: number }

type Cluster = {
  nodes: Point[]
  edges: [Point, Point][]
  facets: [Point, Point, Point][]
  dx: number
  dy: number
  rotate: number
  duration: number
  delay: number
  morph: Morph
}

type Morph = { scaleX: number, scaleY: number, skew: number, duration: number, delay: number }

const WIDTH = 1440
const HEIGHT = 440

// Seeded so the layout is identical on every load.
const mulberry32 = (seed: number) => {
  let state = seed
  return () => {
    state = (state + 0x6D2B79F5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rangeFrom = (random: () => number) => (min: number, max: number) => min + random() * (max - min)
const between = rangeFrom(mulberry32(4249))
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

// Own stream so morph values don't shift the drift layout.
const morphBetween = rangeFrom(mulberry32(4250))
const makeMorph = (): Morph => ({
  scaleX: morphBetween(0.88, 1.12),
  scaleY: morphBetween(0.88, 1.12),
  skew: morphBetween(-8, 8),
  duration: morphBetween(18, 34),
  delay: -morphBetween(0, 34),
})

const makeCluster = (centre: Point, spread: number, size: number): Cluster => {
  const nodes = Array.from({ length: size }, () => ({
    x: centre.x + between(-spread, spread),
    y: centre.y + between(-spread, spread) * 0.8,
  }))
  const edges = new Map<string, [Point, Point]>()
  nodes.forEach((node, i) => {
    nodes
      .map((other, j) => ({ other, j }))
      .filter(({ j }) => j !== i)
      .sort((a, b) => distance(node, a.other) - distance(node, b.other))
      .slice(0, 2)
      .forEach(({ other, j }) => edges.set([i, j].sort((a, b) => a - b).join('-'), [node, other]))
  })
  const facets: [Point, Point, Point][] = size >= 4 ? [[nodes[0], nodes[1], nodes[2]]] : []
  return {
    nodes,
    edges: [...edges.values()],
    facets,
    dx: between(-40, 40),
    dy: between(-25, 25),
    rotate: between(-6, 6),
    duration: between(14, 26),
    delay: -between(0, 26),
    morph: makeMorph(),
  }
}

const makeLayer = (count: number, spread: [number, number], size: [number, number]) =>
  Array.from({ length: count }, (_, i) =>
    makeCluster(
      { x: ((i + between(0.1, 0.9)) / count) * WIDTH, y: between(40, HEIGHT - 40) },
      between(...spread),
      Math.round(between(...size)),
    ),
  )

const backLayer = makeLayer(6, [110, 170], [4, 6])
const frontLayer = makeLayer(11, [50, 110], [3, 6])
const bokeh = Array.from({ length: 16 }, () => ({
  x: between(0, WIDTH),
  y: between(0, HEIGHT),
  r: between(5, 14),
  dx: between(-30, 30),
  dy: between(-20, 20),
  duration: between(16, 30),
  delay: -between(0, 30),
}))

const drift = keyframes`
  from { transform: translate(0, 0) rotate(0deg); }
  to { transform: translate(var(--dx), var(--dy)) rotate(var(--rotate)); }
`

const morph = keyframes`
  from { transform: scale(1, 1) skewX(0deg); }
  to { transform: scale(var(--scale-x), var(--scale-y)) skewX(var(--skew)); }
`

const morphMotion = (item: Morph) => ({
  '--scale-x': item.scaleX,
  '--scale-y': item.scaleY,
  '--skew': `${item.skew}deg`,
  'animationDuration': `${item.duration}s`,
  'animationDelay': `${item.delay}s`,
}) as React.CSSProperties

const motion = (item: { dx: number, dy: number, rotate?: number, duration: number, delay: number }) => ({
  '--dx': `${item.dx}px`,
  '--dy': `${item.dy}px`,
  '--rotate': `${item.rotate ?? 0}deg`,
  'animationDuration': `${item.duration}s`,
  'animationDelay': `${item.delay}s`,
}) as React.CSSProperties

const NODE_COLOURS = ['#5FD3DC', '#C7A9A8']

type ClusterShapeProps = { cluster: Cluster, strokeOpacity: number, nodeRadius: number }

const ClusterShape = ({ cluster, strokeOpacity, nodeRadius }: ClusterShapeProps) => (
  <g className="drift" style={motion(cluster)}>
    <g className="morph" style={morphMotion(cluster.morph)}>
      {cluster.facets.map(([a, b, c]) => (
        <polygon key={`${a.x},${b.x},${c.x}`} points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`} fill="#5FD3DC" fillOpacity={0.07} />
      ))}
      {cluster.edges.map(([a, b]) => (
        <line key={`${a.x},${a.y}-${b.x},${b.y}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#5FD3DC" strokeOpacity={strokeOpacity} strokeWidth={1} />
      ))}
      {cluster.nodes.map((node, i) => (
        <circle key={`${node.x},${node.y}`} cx={node.x} cy={node.y} r={nodeRadius} fill={NODE_COLOURS[i % 2]} />
      ))}
    </g>
  </g>
)

type HeroNetworkProps = {
  animated: boolean
  paused: boolean
  style?: React.CSSProperties
}

export const HeroNetwork = ({ animated, paused, style }: Readonly<HeroNetworkProps>) => (
  <Box
    component="svg"
    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    focusable="false"
    style={style}
    sx={{
      '& .drift, & .morph': {
        transformBox: 'fill-box',
        transformOrigin: 'center',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
        animationDirection: 'alternate',
        animationPlayState: paused ? 'paused' : 'running',
      },
      '& .drift': { animationName: animated ? `${drift}` : 'none' },
      '& .morph': { animationName: animated ? `${morph}` : 'none' },
    }}
  >
    <defs>
      <linearGradient id="hero-network-sky" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#041D38" />
        <stop offset="0.5" stopColor="#0A5E72" />
        <stop offset="1" stopColor="#041D38" />
      </linearGradient>
      <radialGradient id="hero-network-glow" cx="0.5" cy="0.2" r="0.6">
        <stop offset="0" stopColor="#14808C" stopOpacity="0.7" />
        <stop offset="1" stopColor="#14808C" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="hero-network-bokeh">
        <stop offset="0" stopColor="#B8E4E8" stopOpacity="0.35" />
        <stop offset="1" stopColor="#B8E4E8" stopOpacity="0" />
      </radialGradient>
      {/* Fixed region: a bbox-relative one goes stale while the clusters morph, and Firefox clips them to it. */}
      <filter id="hero-network-soften" filterUnits="userSpaceOnUse" x={0} y={0} width={WIDTH} height={HEIGHT}>
        <feGaussianBlur stdDeviation="0.8" />
      </filter>
    </defs>
    <rect width={WIDTH} height={HEIGHT} fill="url(#hero-network-sky)" />
    <rect width={WIDTH} height={HEIGHT} fill="url(#hero-network-glow)" />
    {backLayer.map(cluster => (
      <ClusterShape key={`${cluster.nodes[0].x}`} cluster={cluster} strokeOpacity={0.18} nodeRadius={2} />
    ))}
    {bokeh.map(dot => (
      <circle key={`${dot.x},${dot.y}`} className="drift" style={motion(dot)} cx={dot.x} cy={dot.y} r={dot.r} fill="url(#hero-network-bokeh)" />
    ))}
    <g filter="url(#hero-network-soften)">
      {frontLayer.map(cluster => (
        <ClusterShape key={`${cluster.nodes[0].x}`} cluster={cluster} strokeOpacity={0.55} nodeRadius={2.6} />
      ))}
    </g>
  </Box>
)
