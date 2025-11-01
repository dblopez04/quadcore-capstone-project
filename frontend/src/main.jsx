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




const router = createBrowserRouter([
    //  Show Login by default
    { path: '/', element: <Login /> },

    // Home moved to /home so Navbar/Layout don't show on Login
    {
        path: '/home',
        element: (
            <Layout>
                <Home />
            </Layout>
        ),
    },
    {
        path: '/search',
        element: (
            <Layout>
                <Search />
            </Layout>
        ),
    },
    {
        path: '/bookmarks',
        element: (
            <Layout>
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
            <Layout>
                <About />
            </Layout>
        ),
    },
    {
        path: '/help',
        element: (
            <Layout>
                <Help />
            </Layout>
        ),
    },
])


ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
)
