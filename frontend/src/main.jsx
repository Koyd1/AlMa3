// import React from 'react'
// import { createRoot } from 'react-dom/client'
// import App from './App.jsx'
//
// createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// )
//
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // если используешь Tailwind

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
