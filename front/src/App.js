import { CssBaseline, ThemeProvider } from '@mui/material'
import {
  BrowserRouter,
  Route,
  Routes,
} from 'react-router-dom'

import Home from './scenes/Home'

import theme from './theme'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route
            exact
            path="/"
            element={<Home />}
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
