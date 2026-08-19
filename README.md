# Universal Data Migration and Transformation Tool

A scalable, robust tool built with Next.js, React, and TypeScript designed to seamlessly migrate and transform data across a variety of formats and databases.

## Features

- **Multi-Source Connectors**: Support for CSV, PostgreSQL, MySQL, MongoDB, and REST API endpoints.
- **Transformation Engine**: Flexible rules for renaming columns, casting types, filtering rows, and more.
- **User-Friendly Interface**: An intuitive Next.js Dashboard built with Tailwind CSS and shadcn/ui.
- **Scalable Architecture**: Solid design principles featuring an extensible Connector interface and dedicated Service layers.

## Tech Stack

- **Frontend / Backend framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Testing**: Jest, React Testing Library

## Getting Started

### Prerequisites
- Node.js (v18 or newer)
- npm or yarn

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Running Tests

```bash
npm run test
```

## Architecture

- `src/lib/connectors`: Contains the `BaseConnector` abstract class and specific database/file implementations. Adding a new connector just requires implementing this interface.
- `src/services`: Houses business logic like `TransformationService` (data mapping/cleansing) and `MigrationService` (job orchestration).
- `src/types`: Global TypeScript models and schemas (`MigrationJob`, `ConnectionConfig`, `DatasetSchema`).
- `src/app`: The Next.js pages for UI (Dashboard, Connections, Jobs).

## Next Steps

- Implement real streaming cursor iteration for `readData` in connectors for large dataset handling.
- Connect the frontend UI forms to the Next.js API routes (to be implemented) to persist jobs and connections to a core database.
- Build visual drag-and-drop mappers for the `TransformationService`.
