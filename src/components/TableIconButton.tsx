import React from 'react'
import { Styles } from 'src/libs/theme'
import { applyHoverEffects, setStyle } from 'src/libs/utils'
import { makeStyles } from 'tss-react/mui'
import { isNil } from 'src/utils/NodashUtil'

const useStyles = makeStyles()({
  root: {
    backgroundColor: 'inherit',
    color: 'inherit',
    pointerEvents: 'none',
    fontSize: 28,
  },
})

export interface TableIconButtonProps {
  icon?: React.ElementType
  onClick?: () => void
  style?: React.CSSProperties
  hoverStyle?: React.CSSProperties
  onMouseEnter?: React.MouseEventHandler<HTMLSpanElement>
  onMouseLeave?: React.MouseEventHandler<HTMLSpanElement>
  isRendered?: boolean
  dataTip?: string
  keyProp?: string
  disabled?: boolean
}

export default function TableIconButton({
  onClick,
  style = Styles.TABLE.TABLE_ICON_BUTTON as React.CSSProperties, // NOTE: create defaults for icons
  hoverStyle = Styles.TABLE.TABLE_BUTTON_ICON_HOVER as React.CSSProperties, // NOTE: create defaults for icons
  onMouseEnter,
  onMouseLeave,
  isRendered = true,
  dataTip = '',
  keyProp,
  disabled = false,
  icon: Icon,
}: Readonly<TableIconButtonProps>) {
  const { classes } = useStyles()

  const onMouseEnterDefault: React.MouseEventHandler<HTMLSpanElement> = (e) => {
    ;(e.target as HTMLElement).style.cursor = 'pointer'
    applyHoverEffects(e, hoverStyle)
  }

  const onMouseLeaveDefault: React.MouseEventHandler<HTMLSpanElement> = (e) => {
    applyHoverEffects(e, style)
  }

  const resolvedOnMouseEnter = onMouseEnter ?? onMouseEnterDefault
  const resolvedOnMouseLeave = onMouseLeave ?? onMouseLeaveDefault

  const appliedStyle = setStyle(disabled, style, 'color')

  // Inline the conditional attribute construction to avoid incompatible casts with setDivAttributes
  const spanProps: React.HTMLAttributes<HTMLSpanElement> & { 'data-tip'?: string } = disabled
    ? { 'style': appliedStyle, 'data-tip': dataTip || undefined }
    : {
        onClick,
        'onMouseEnter': resolvedOnMouseEnter,
        'onMouseLeave': resolvedOnMouseLeave,
        'style': appliedStyle,
        'data-tip': dataTip || undefined,
        'id': keyProp,
      }

  // NOTE: span wrapper is needed for svg child elements due to flaky behavior onMouseEnter and onMouseLeave
  // https://github.com/facebook/react/issues/4492 --> NOTE: though the issue is from the React repo, the bug is tied to browser specs, NOT React
  return (
    <span key={keyProp} {...spanProps}>
      {isRendered && !isNil(Icon) && (
        <Icon style={appliedStyle} className={classes.root} />
      )}
    </span>
  )
}
