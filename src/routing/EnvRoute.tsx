import React from 'react'
import { Outlet } from 'react-router-dom'
import { checkEnv } from 'src/utils/EnvironmentUtils'
import NotFound from 'src/pages/NotFound'

interface EnvRouteProps {
  readonly env: readonly string[]
}

const EnvRoute = ({ env }: EnvRouteProps) => {
  return checkEnv(env)
    ? <Outlet />
    : <NotFound />
}

export default EnvRoute
