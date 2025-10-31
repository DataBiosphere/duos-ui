import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { checkEnv } from 'src/utils/EnvironmentUtils'

interface EnvRouteProps {
  readonly env: Array<string>
}

const EnvRoute = ({ env }: EnvRouteProps) => {
  return checkEnv(env)
    ? <Outlet />
    : <Navigate to="/" state={{ from: location }} replace />
}

export default EnvRoute
