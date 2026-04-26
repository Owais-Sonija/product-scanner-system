import React from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
}

export const Toggle = React.memo(({ 
  checked, 
  disabled,
  label 
}: Omit<ToggleProps, 'onChange'> & { onChange?: any }) => {
  return (
    <div
      role="switch"
      aria-checked={checked}
      aria-label={label}
      style={{
        width: '56px',
        height: '32px',
        borderRadius: '16px',
        backgroundColor: checked ? '#2563eb' : '#475569',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background-color 0.3s ease',
        flexShrink: 0,
        pointerEvents: 'none', // let parent handle clicks
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '12px',
          backgroundColor: 'white',
          position: 'absolute',
          top: '4px',
          left: checked ? '28px' : '4px',
          transition: 'left 0.3s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
})

Toggle.displayName = 'Toggle'
