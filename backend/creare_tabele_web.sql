-- Tabela utilizatori
CREATE TABLE users (
                       user_id SERIAL PRIMARY KEY,
                       username VARCHAR(50) UNIQUE NOT NULL,
                       email VARCHAR(100) UNIQUE NOT NULL,
                       password VARCHAR(255) NOT NULL,
                       real_name VARCHAR(100),
                       description TEXT,
                       birthdate DATE,
                       gender VARCHAR(20),
                       role VARCHAR(20) DEFAULT 'user'
);

-- Tabela autori
CREATE TABLE authors (
    author_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Tabela cărți
CREATE TABLE books (
    book_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    year INT,
    publisher VARCHAR(100)
);

-- Tabela de legătură carte-autor (o carte poate avea mai mulți autori, un autor poate avea mai multe cărți)
CREATE TABLE book_authors (
    book_id INT REFERENCES books(book_id) ON DELETE CASCADE,
    author_id INT REFERENCES authors(author_id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, author_id)
);

-- Tabela progres lectură (un user poate avea progres la mai multe cărți)
CREATE TABLE progress (
    progress_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    book_id INT REFERENCES books(book_id) ON DELETE CASCADE,
    percent_read INT CHECK (percent_read BETWEEN 0 AND 100),
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id) -- un user are un singur progres per carte
);

-- Tabela adnotări/opinii (un user poate adăuga mai multe note la o carte)
CREATE TABLE notes (
    note_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    book_id INT REFERENCES books(book_id) ON DELETE CASCADE,
    note_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);