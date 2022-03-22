import { Provider as GraphqlProvider } from 'urql'
import { CssBaseline, ThemeProvider } from '@mui/material'
import {
  BrowserRouter,
  Route,
  Routes,
} from 'react-router-dom'

import Home from './scenes/Home'

import client from './client'
import theme from './theme'

function App() {
  return (
    <GraphqlProvider value={client}>
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
    </GraphqlProvider>
  )
}

export default App
