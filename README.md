# Web-Based Personal Finance Management System

This project is a simple web-based application for managing personal finances (course project).

## Features

- Add income and expense transactions with:
  - type (income/expense),
  - amount,
  - category,
  - date,
  - short note.
- Automatic calculation of:
  - total income,
  - total expense,
  - current balance.
- Monthly budget by category:
  - set budget value for each category,
  - see how much is already spent,
  - see remaining amount,
  - status (OK, close to limit, over budget).
- Reports:
  - expense distribution by category for the current month (doughnut chart).
- Financial goals:
  - create financial goals with target amount,
  - see percentage progress for each goal.

All data is stored in the browser using `localStorage`, so the system works without a backend database.

## Technologies

- HTML5 for structure
- CSS3 for layout and styling
- JavaScript (ES6) for application logic
- Chart.js for visualization of expenses by category
- Browser LocalStorage for data persistence

## How to run

1. Download or clone this repository.
2. Open `index.html` in a web browser (Chrome, Edge, Firefox, etc.).
3. Start adding income and expense transactions.
4. Set monthly budgets and financial goals.
5. View balance, budgets, and reports.

## Project context

This application was developed as a course project under the topic:

> "Development of a Web-Based Personal Finance Management System"

The goal is to provide a simple and user-friendly platform for:
- tracking income and expenses,
- controlling budgets,
- planning personal financial goals.

Theoretical background, literature review, and system description are presented in the accompanying project report (PDF).
