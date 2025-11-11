# Timeline Lens

An AI-powered historical event explorer that allows users to explore historical events through an immersive 3D timeline, searchable library, and interactive dashboard.

*   **Hosted Application Link:** [Your Hosted Application Link Here]

## Description

Timeline Lens offers a unique, multi-faceted way to engage with history. It combines a traditional data-driven dashboard and library with an innovative, immersive 3D visualization. Leveraging the power of the Google Gemini API, it simplifies content creation by automatically generating summaries for new historical events.

## Features

-   **Interactive Dashboard:** Get a quick overview of historical data with dynamic statistics, recently added events, and top categories. Filter the entire dashboard by historical era.
-   **Event Library:** A comprehensive, searchable, and filterable library of historical events. View events in a visually appealing grid or an informative list format.
-   **3D Solar System Timeline:** A unique and immersive way to visualize history. Each historical era is represented by a planet, and individual events orbit their respective era-planet as glowing crystals.
-   **AI-Powered Summaries:** When creating a new event, leverage the Gemini API to automatically generate concise, insightful summaries from detailed descriptions.
-   **Create & Manage Events:** Users can contribute to the timeline by adding new historical events through a simple form.

## Tech Stack

-   **Frontend:** React, TypeScript
-   **AI Model:** Google Gemini API (`@google/genai`)
-   **Styling:** Tailwind CSS
-   **Animation:** Framer Motion
-   **3D Visualization:** Three.js
-   **Icons:** Lucide React

## Setup/Installation Instructions

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd timeline-lens
    ```

2.  **API Key:**
    This project requires a Google Gemini API key. The application is designed to use an `API_KEY` provided as an environment variable (`process.env.API_KEY`). Ensure this is available in your hosting environment (e.g., Netlify, Vercel).

3.  **Run Locally:**
    The project is a static web application. You can serve it using any simple HTTP server. For example, using Python's built-in server:
    ```bash
    python -m http.server
    ```
    Then open your browser and navigate to `http://localhost:8000`. The AI features will not work without a valid API key.

## Screenshots

You can find screenshots of the application in a `/screenshots` folder or listed below.

