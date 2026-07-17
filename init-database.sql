-- Create payment_status enum
CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'rejected');

-- Create assignments table
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    year TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create payment_requests table
CREATE TABLE payment_requests (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    utr_number TEXT NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
