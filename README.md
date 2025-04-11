# Roomease Booking System – Laravel 11 + Inertia.js + React

This is a booking system built using **Laravel 11** with **Inertia.js** and **React**. It provides both admin and client-facing panels, Stripe payment integration, and automated emailing.

## Features

- Client-side booking with addons (contractors/products)
- Admin panel with full CRUD for rooms, products, contractors, and orders
- Automated email confirmation and service order broadcasting
- Stripe payment integration
- Admin invitations
- Booking conflict detection and prevention

---

## Requirements

- PHP 8.2+
- Composer
- Node.js (v18+ recommended)
- Laravel 11
- Mailpit (for local email testing)
- MySQL / MariaDB
- Redis (optional, for queue handling)

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/rodrigo-wong/roomease.git
cd roomease
```

### 2. Install PHP Dependencies

```bash
composer install
```

### 3. Install JavaScript Dependencies

```bash
npm install
```

### 4. Set Up Environment

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` to match your local environment:

```
APP_NAME=BookingSystem
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=booking_db
DB_USERNAME=root
DB_PASSWORD=

MAIL_MAILER=smtp
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS=no-reply@roomease.com
MAIL_FROM_NAME="${APP_NAME}"

STRIPE_KEY="your_stripe_key"
STRIPE_SECRET="your_stripe_secret"
VITE_STRIPE_PUBLIC_KEY="${STRIPE_KEY}"

DEFAULT_ADMIN_NAME=Super_Admin
DEFAULT_ADMIN_EMAIL=admin@roomease.com
DEFAULT_ADMIN_PASSWORD=admin123!
```

### 5. Run Migrations and Seeders

```bash
php artisan migrate
php artisan db:seed
```

### 6. Build Frontend

```bash
npm run build
```

For development:

```bash
npm run dev
```

---

## Starting the Application

### Backend

```bash
php artisan serve
```

### Frontend (if using Vite dev server)

```bash
npm run dev
```

---

## Email Setup (Mailpit)

1. Install Mailpit (see: https://github.com/axllent/mailpit)

    Example using Docker:

    ```bash
    docker run -d -p 8025:8025 -p 1025:1025 --name mailpit axllent/mailpit
    ```

2. Visit `http://localhost:8025` to view received emails.

---

## Running the Scheduler

To process scheduled tasks like email dispatches or cleanup jobs, run:

```bash
php artisan schedule:work
```

---
