# Notes App CI/CD

A clean full-stack Notes App built to practice the complete DevOps deployment lifecycle: development, testing, Dockerization, CI/CD, AWS deployment, and Nginx reverse proxy setup.

## Overview

This project is a simple notes manager where users can create, view, edit, delete, search, sort, pin, and copy notes. The main purpose of the project is to show how a real application moves from local development to production using modern DevOps tools.

## Tech Stack

| Area | Tools |
| --- | --- |
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Testing | Node test runner, Supertest, mongodb-memory-server |
| Containers | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Cloud | AWS EC2, Amazon ECR |
| Web Server | Nginx |

## Features

- Create, edit, delete, and view notes
- Search and sort notes
- Pin important notes in the browser
- Copy note content
- Quick templates for deploy notes, bug fixes, and learning notes
- Character counter and toast messages
- Responsive UI for desktop and mobile
- REST API with MongoDB persistence
- Dockerized app with local and production Compose files
- Automated testing, Docker build, ECR push, and EC2 deployment

## Project Structure

```text
.
├── .github/workflows/
│   ├── node.yml
│   └── deploy.yml
├── backend/
│   ├── Dockerfile
│   ├── index.js
│   ├── index.test.js
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── nginx/
│   └── notes-app.conf
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

## Architecture

```text
User -> Nginx -> Express App -> MongoDB
```

CI/CD flow:

```text
GitHub Push -> Tests -> Docker Build -> Amazon ECR -> AWS EC2 Deploy
```

## Run Locally

Start the app with Docker Compose:

```bash
docker compose up --build
```

Open:

```text
http://localhost:3000
```

If port `3000` is busy:

```bash
APP_PORT=3001 docker compose up --build
```

Open:

```text
http://localhost:3001
```

Stop the app:

```bash
docker compose down
```

## Run Tests

```bash
cd backend
npm install
npm test
```

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | Check API and database status |
| GET | `/api/notes` | Get all notes |
| POST | `/api/notes` | Create a note |
| PUT | `/api/notes/:id` | Update a note |
| DELETE | `/api/notes/:id` | Delete a note |

Example request body:

```json
{
  "title": "Deploy checklist",
  "content": "Build image, push to ECR, deploy to EC2."
}
```

## GitHub Actions

This project has two workflows:

- `node.yml`: installs dependencies, runs tests, and builds the Docker image.
- `deploy.yml`: runs tests, builds the production image, pushes it to Amazon ECR, then deploys it to EC2 over SSH.

## Required GitHub Secrets

Add these in:

```text
GitHub Repository -> Settings -> Secrets and variables -> Actions
```

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
ECR_REPOSITORY
EC2_HOST
EC2_USER
EC2_SSH_KEY
```

## EC2 Setup

Install Docker and Nginx on Ubuntu EC2:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin nginx
sudo usermod -aG docker $USER
newgrp docker
```

Open these inbound ports in the EC2 security group:

```text
22  - SSH
80  - HTTP
443 - HTTPS, optional
```

Nginx forwards public traffic from port `80` to the app running on `127.0.0.1:3000`.

## Deployment

Push to the `main` branch:

```bash
git add .
git commit -m "Update project"
git push origin main
```

GitHub Actions will automatically test, build, push, and deploy the latest version.

## Useful Commands

Check containers:

```bash
docker ps
```

Check app logs:

```bash
docker logs notes-backend
```

Check health:

```bash
curl http://localhost:3000/health
```

## What I Learned

- Building a full-stack app with Node.js and MongoDB
- Writing API tests
- Creating Docker images
- Running multi-container apps with Docker Compose
- Creating GitHub Actions CI/CD workflows
- Pushing images to Amazon ECR
- Deploying containers on AWS EC2
- Using Nginx as a reverse proxy
- Debugging deployment issues

## Author

Harsha Vardhan Govindarajula
