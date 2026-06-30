import { isEmpty } from 'src/utils/NodashUtil'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import WarningIcon from '@mui/icons-material/Warning'
import InfoIcon from '@mui/icons-material/Info'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ReportIcon from '@mui/icons-material/Report'
import style from 'src/components/Notification.module.css'

export interface NotificationData {
  message: string
  level?: 'info' | 'warning' | 'danger' | 'success'
}

interface NotificationProps {
  notificationData?: NotificationData | null
  index?: number
  customStyle?: React.CSSProperties
}

const iconStyle: React.CSSProperties = {
  marginRight: '1rem',
  height: 30,
  width: 30,
}

const getIcon = (level: NotificationData['level']): React.ReactElement => {
  switch (level) {
    case 'success':
      return <CheckCircleIcon fill="#3c763d" style={iconStyle} />
    case 'info':
      return <InfoIcon fill="#31708f" style={iconStyle} />
    case 'warning':
      return <WarningIcon fill="#8a6d3b" style={iconStyle} />
    case 'danger':
      return <ReportIcon fill="#a94442" style={iconStyle} />
    default:
      return <InfoIcon fill="#3c763d" style={iconStyle} />
  }
}

export const Notification = (props: Readonly<NotificationProps>) => {
  const { notificationData, index = 1, customStyle } = props

  if (isEmpty(notificationData) || !notificationData) {
    return <div key={index} style={{ display: 'none' }} />
  }

  const level = notificationData.level ?? 'info'

  return (
    <div
      key={index}
      className={`row alert alert-${level}`}
      style={{ margin: 0, padding: '1.5rem', alignItems: 'center', ...customStyle }}
    >
      <div style={{ float: 'left' }}>{getIcon(level)}</div>
      <div className={style['underlined']} style={{ margin: '0.5rem auto' }}>
        <ReactMarkdown>{notificationData.message}</ReactMarkdown>
      </div>
    </div>
  )
}
