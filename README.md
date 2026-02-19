# Timely - Time Tracking & Leave Management

Timely is a modern, full-stack application designed to streamline employee time tracking and leave management. It features a robust backend for secure data handling and a sleek, responsive frontend for an intuitive user experience.

## Features

### Time Tracking
- **Punch In/Out:** Simple one-click interface for daily attendance.
- **Real-time Tracking:** Accurate server-side timestamps.
- **Visual Summaries:** View daily, weekly, monthly, and yearly hours at a glance.
- **Overtime Calculation:** Automated overtime computation based on working hours.

### Leave Management
- **Easy Requests:** Employees can request Annual, Sick, or Casual leave with reasons.
- **Manager Approval:** Dedicated portal for managers to review, approve, or reject requests.
- **Balance Tracking:** Automatic deduction of leave balances upon approval.
- **Status Updates:** Real-time status tracking (Pending, Approved, Rejected).

### Role-Based Access
- **Employee Portal:** Focused on personal time tracking and leave requests.
- **Manager Portal:** Team overview, leave approval workflows, and reporting.
- **Admin Capabilities:** (Planned) System-wide configuration and user management.

### Analytics & Insights
- **Working Days:** detailed breakdown of working, partial, and absent days.
- **Attendance Rate:** Weekly and monthly attendance statistics.
- **Pay Period Breakdown:** Comprehensive report of regular vs. overtime hours.

## Tech Stack

### Frontend
- **Framework:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **State Management:** [TanStack Query](https://tanstack.com/query/latest)
- **Routing:** [React Router](https://reactrouter.com/)
- **Icons:** [Lucide React](https://lucide.dev/)

### Backend
- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) with Mongoose
- **Authentication:** JWT (JSON Web Tokens) + bcryptjs
- **Security:** Helmet, CORS, Rate Limiting

## Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites (Must have)
- **Node.js** (v18 or higher)
- **MongoDB** (Local instance or Atlas connection string)
- **npm**

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/kiran-sai-hub/timeley.git
    cd timeley
    ```

2.  **Setup Backend**
    ```bash
    cd backendAPI
    npm install
    
    # Create .env file
    cp .env.example .env
    # Update MONGO_URI in .env with your database connection string
    
    # (Optional) Seed database with sample data
    npm run seed
    
    # Start the backend server
    npm run dev
    ```
    The API will start at `http://localhost:5000`.

3.  **Setup Frontend**
    Open a new terminal window:
    ```bash
    # From the root directory
    npm install
    
    # Start the development server
    npm run dev
    ```
    The application will typically start at `http://localhost:8080` (or similar, check console output).

## Project Structure

```
timely/
├── backendAPI/           # Node.js/Express Backend
│   ├── config/           # DB configuration
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Auth & Role guards
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   └── utils/            # Helper functions
├── src/                  # React Frontend
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   └── lib/              # Utilities
└── public/               # Static assets
```

## Documentation

For a deep dive into the backend architecture, API endpoints, and database schemas, please refer to the [HOW_IT_WORKS.md](./HOW_IT_WORKS.md) file.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
