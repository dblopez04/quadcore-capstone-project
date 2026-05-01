import React from 'react'
import ReactDOM from 'react-dom/client'
import L from 'leaflet'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import './index.css'
import "./App.css";

import Login from './pages/Login.jsx'
import Admin from './pages/Admin.jsx'
import Register from "./pages/Register";
import ForgotPassword from './pages/ForgotPasswordPage.jsx';
import ResetPassword from './pages/ResetPassword';
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import MapPage from './pages/MapPage.jsx'
import About from './pages/About.jsx'
import Help from './pages/Help.jsx'
import Search from './pages/Search.jsx'
import Bookmarks from './pages/Bookmarks.jsx'
import Settings from './pages/Settings.jsx'
import Events from './pages/Events.jsx'
import { ToastProvider } from './components/ToastProvider'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
})

const savedTheme = window.localStorage.getItem("theme-preference");

const resolvedTheme =
    savedTheme === "dark"
        ? "dark"
        : savedTheme === "light"
            ? "light"
            : window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";

document.body.classList.remove("theme-light", "theme-dark");
document.body.classList.add(resolvedTheme === "dark" ? "theme-dark" : "theme-light");
document.body.style.colorScheme = resolvedTheme; 

const router = createBrowserRouter([
    { path: '/', element: <Login /> },
    { path: '/register', element: <Register /> },
    { path: '/forgot-password', element: <ForgotPassword /> },
    { path: '/reset-password', element: <ResetPassword /> },


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
        path: '/events',
        element: (
            <Layout narrow>
                <Events />
            </Layout>
        ),
    },

    {
        path: '/admin',
        element: (
            <Layout>
                <Admin />
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
        <ToastProvider>
            <RouterProvider router={router} />
        </ToastProvider>
    </React.StrictMode>,
)
