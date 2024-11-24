# User Authentication & Email Service
User Registration & Login:

Used bcrypt for encrypting passwords and securely comparing them during login.
Implemented JWT (JSON Web Tokens) to generate secure tokens for user sessions.
Email Service:

Integrated Nodemailer to send emails with custom options such as recipient, subject, and text.
Backend Technologies:

Employed MongoDB as the database to store user information and credentials securely.
Used Morgan to log HTTP requests and track server activity.
Error Handling:

Created detailed error messages for common issues, especially for invalid passwords or user authentication failures.
Used async/await to handle asynchronous operations effectively, ensuring robust error handling with try-catch blocks.
Code Efficiency:

Designed a modular structure with three main routes:
Registration: User registration with secure password hashing.
Login: Password verification and JWT generation for authentication.
Send Email: Function to send emails using Nodemailer.
