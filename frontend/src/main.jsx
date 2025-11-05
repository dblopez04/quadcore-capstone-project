import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './index.css'

import Login from './pages/Login.jsx'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import MapPage from './pages/MapPage.jsx'
import About from './pages/About.jsx'
import Help from './pages/Help.jsx'
import Search from './pages/Search.jsx'
import Bookmarks from './pages/Bookmarks.jsx'
import Settings from './pages/Settings.jsx'

const router = createBrowserRouter([
    { path: '/', element: <Login /> },

    {
        path: '/home',
        element: (
            <Layout narrow>
                <Home />
            </Layout>
        ),
    },
    {
        path: '/search',
        element: (
            <Layout narrow>
                <Search />
            </Layout>
        ),
    },
    {
        path: '/bookmarks',
        element: (
            <Layout narrow>
                <Bookmarks />
            </Layout>
        ),
    },
    {
        path: '/map',
        element: (
            <Layout>
                <MapPage />
            </Layout>
        ),
    },
    {
        path: '/about',
        element: (
            <Layout narrow>
                <About />
            </Layout>
        ),
    },
    {
        path: '/help',
        element: (
            <Layout narrow>
                <Help />
            </Layout>
        ),
    },
    {
        path: '/settings',
        element: (
            <Layout narrow>
                <Settings />
            </Layout>
        ),
    },
])

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
)
