import React from 'react'
import { Styles } from '../libs/theme'

interface Icon {
  src: string
  width?: number
  height?: number
}

interface TableHeaderSectionProps {
  icon?: Icon
  title: string | React.ReactNode
  description?: string | React.ReactNode
}

export const TableHeaderSection: React.FC<TableHeaderSectionProps> = ({
  icon,
  title,
  description,
}) => {
  return (
    <div style={{ display: 'flex', padding: '0 0 0 2em' }}>
      <div className="left-header-section" style={Styles.LEFT_HEADER_SECTION as React.CSSProperties}>
        {icon?.src && (
          <div style={Styles.ICON_CONTAINER}>
            <img
              id="dataset-icon"
              src={icon.src}
              alt="Dataset Icon"
              style={{
                width: icon.width || '',
                height: icon.height || '',
                maxWidth: 200,
                maxHeight: 64,
              }}
            />
          </div>
        )}
        <div style={{ ...Styles.HEADER_CONTAINER as React.CSSProperties, width: '120%' }}>
          <div
            data-cy="table-header-title"
            style={{
              fontFamily: 'Montserrat',
              fontWeight: 600,
              fontSize: '2.8rem',
              width: '150%',
            }}
          >
            {title}
          </div>
          <div
            data-cy="table-header-description"
            style={{
              fontFamily: 'Montserrat',
              fontSize: '1.6rem',
              width: '150%',
            }}
          >
            {description}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TableHeaderSection
