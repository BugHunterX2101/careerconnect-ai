import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function getNodeModulePackage(id) {
  const parts = id.split('node_modules/')[1]
  if (!parts) return null

  const segments = parts.split('/')
  if (segments[0].startsWith('@') && segments.length > 1) {
    return `${segments[0]}/${segments[1]}`
  }
  return segments[0]
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    modulePreload: {
      polyfill: false
    },
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames(assetInfo) {
          const name = assetInfo.name || ''
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(name)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (/\.(woff2?|ttf|otf|eot)$/i.test(name)) {
            return 'assets/fonts/[name]-[hash][extname]'
          }
          if (/\.css$/i.test(name)) {
            return 'assets/styles/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          const pkg = getNodeModulePackage(id)

          // React and router core
          if (pkg === 'react' || pkg === 'react-dom' || pkg === 'scheduler' || pkg === 'react-router' || pkg === 'react-router-dom') {
            return 'vendor-react'
          }

          // Runtime and polyfills
          if (pkg === '@babel/runtime' || pkg === 'core-js' || pkg === 'regenerator-runtime') {
            return 'vendor-runtime'
          }

          if (pkg === '@mui/icons-material') {
            return 'vendor-mui-icons'
          }

          // MUI and Emotion
          if (pkg?.startsWith('@mui/') || pkg?.startsWith('@emotion/')) {
            return 'vendor-mui'
          }

          // Data visualization
          if (pkg === 'recharts') {
            return 'vendor-charts'
          }

          // Editor/document heavy dependencies
          if (pkg === 'react-markdown' || pkg === 'react-pdf' || pkg === 'react-syntax-highlighter' || pkg === 'react-color') {
            return 'vendor-editor'
          }

          if (pkg === '@mui/x-date-pickers' || pkg === 'date-fns') {
            return 'vendor-date-pickers'
          }

          if (pkg === 'react-window' || pkg === 'react-virtualized' || pkg === 'react-window-infinite-loader') {
            return 'vendor-windowing'
          }

          if (pkg === 'framer-motion') {
            return 'vendor-motion'
          }

          if (pkg === 'i18next' || pkg === 'react-i18next') {
            return 'vendor-i18n'
          }

          if (pkg === 'react-query') {
            return 'vendor-query'
          }

          // Utility/network libraries
          if (pkg === 'axios' || pkg === 'lodash' || pkg === 'socket.io-client') {
            return 'vendor-utils'
          }

          if (pkg === 'react-beautiful-dnd' || pkg === 'react-dropzone' || pkg === 'react-image-crop') {
            return 'vendor-rich-input'
          }

          return undefined
        }
      }
    }
  },
  server: {
    port: 5179,
    host: true,
    open: true
  }
})