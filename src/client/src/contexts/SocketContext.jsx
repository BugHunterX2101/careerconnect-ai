import React, { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const { token, user } = useAuth()

  useEffect(() => {
    if (token && user) {
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })

      newSocket.on('connect', () => {
        setIsConnected(true)
        console.log('Socket connected')
      })

      newSocket.on('disconnect', () => {
        setIsConnected(false)
        console.log('Socket disconnected')
      })

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        toast.error('Connection error. Trying to reconnect...')
      })

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts')
        toast.success('Reconnected successfully')
      })

      newSocket.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error)
      })

      newSocket.on('reconnect_failed', () => {
        console.error('Socket reconnection failed')
        toast.error('Failed to reconnect. Please refresh the page.')
      })

      // Handle resume processing updates
      newSocket.on('resume:processing', (data) => {
        console.log('Resume processing update:', data)
        toast.success(`Resume processing: ${data.status}`)
      })

      newSocket.on('resume:completed', (data) => {
        console.log('Resume processing completed:', data)
        toast.success('Resume analysis completed!')
      })

      newSocket.on('resume:error', (data) => {
        console.error('Resume processing error:', data)
        toast.error(`Resume processing failed: ${data.error}`)
      })

      // Handle job recommendations
      newSocket.on('jobs:recommendations', (data) => {
        console.log('New job recommendations:', data)
        toast.success('New job recommendations available!')
      })

      // Handle chat messages
      newSocket.on('chat:message', (data) => {
        console.log('New chat message:', data)
        if (data.senderId !== user.id) {
          toast.success(`New message from ${data.senderName}`)
        }
      })

      // Handle interview notifications
      newSocket.on('interview:scheduled', (data) => {
        console.log('Interview scheduled:', data)
        toast.success('Interview scheduled successfully!')
      })

      newSocket.on('interview:reminder', (data) => {
        console.log('Interview reminder:', data)
        toast.success(`Interview reminder: ${data.title} in ${data.timeUntil}`)
      })

      // Handle system notifications
      newSocket.on('system:notification', (data) => {
        console.log('System notification:', data)
        toast(data.message, {
          icon: data.type === 'success' ? '✅' : data.type === 'error' ? '❌' : 'ℹ️',
        })
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    }
  }, [token, user])

  const emit = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data)
    } else {
      console.warn('Socket not connected, cannot emit event:', event)
    }
  }

  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback)
    }
  }

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback)
    }
  }

  const value = {
    socket,
    isConnected,
    emit,
    on,
    off,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
