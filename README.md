# Notes App CI/CD

A full-stack Notes App built as a beginner-friendly DevOps project. It includes a frontend, backend API, MongoDB database, Docker containerization, GitHub Actions CI/CD, Amazon ECR image publishing, AWS EC2 deployment, and Nginx reverse proxy setup.

## Project Goal

The goal of this project is to understand the complete software deployment lifecycle:

- Build a small web application.
- Store data in MongoDB.
- Containerize the application using Docker.
- Run the full stack locally with Docker Compose.
- Test the backend automatically with GitHub Actions.
- Build and push a Docker image to Amazon ECR.
- Deploy the latest image automatically to an AWS EC2 instance.
- Serve the application publicly using Nginx.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Testing | Node test runner, Supertest, mongodb-memory-server |
| Containerization | Docker |
| Local orchestration | Docker Compose |
| CI/CD | GitHub Actions |
| Container registry | Amazon ECR |
| Server | AWS EC2 Ubuntu |
| Reverse proxy | Nginx |

## Features

- Create notes
- View all notes
- Edit existing notes
- Delete notes
- Search notes by title or content
- Sort notes by latest, oldest, or title
- Pin important notes in the browser
- Copy note text to the clipboard
- Use quick note templates for deploy tasks, bug fixes, and learning notes
- See character count while writing
- Get toast messages after saving, copying, pinning, and deleting
- Confirm before deleting a note
- Responsive modern UI for desktop and mobile
- Health check endpoint
- MongoDB persistence
- Dockerized backend and frontend
- Automated CI tests
- Automated Docker image build
- Automated ECR push
- Automated EC2 deployment

## Project Structure

```text
.
├── .github/
│   └── workflows/
│       ├── node.yml
│       └── deploy.yml
├── backend/
│   ├── Dockerfile
│   ├── index.js
│   ├── index.test.js
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── nginx/
│   └── notes-app.conf
├── .dockerignore
├── .gitignore
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

## How The App Works

The browser loads the frontend from the Express server. The frontend calls the backend API using `fetch`. The backend stores notes in MongoDB using Mongoose.

Local flow:

```text
Browser -> Express app -> MongoDB container
```

Production flow:

```text
User -> EC2 public IP -> Nginx -> Dockerized Express app -> MongoDB container
```

CI/CD flow:

```text
Git push -> GitHub Actions -> Tests -> Docker build -> Amazon ECR -> EC2 deploy
```

## Run Locally With Docker

From the project root:

```bash
docker compose up --build
```

Open the app:

```text
http://localhost:3000
```

If port `3000` is already in use:

```bash
APP_PORT=3001 docker compose up --build
```

Then open:

```text
http://localhost:3001
```

Important: run the app through Docker/Express for the best experience. The frontend can be opened directly from `frontend/index.html` for a quick preview, but notes still require the backend API to be running on `localhost:3000` or `localhost:3001`.

Stop the containers:

```bash
docker compose down
```

Stop the containers and remove MongoDB data:

```bash
docker compose down -v
```

## Run Backend Tests

From the project root:

```bash
cd backend
npm install
npm test
```

The tests use an in-memory MongoDB database, so you do not need to start MongoDB manually for testing.

## API Endpoints

### Health Check

```http
GET /health
```

Example response:

```json
{
  "status": "ok",
  "database": "connected"
}
```

### Get All Notes

```http
GET /api/notes
```

### Create A Note

```http
POST /api/notes
```

Request body:

```json
{
  "title": "Deploy checklist",
  "content": "Build image, push to ECR, restart EC2 containers."
}
```

### Update A Note

```http
PUT /api/notes/:id
```

Request body:

```json
{
  "title": "Updated title",
  "content": "Updated note content."
}
```

### Delete A Note

```http
DELETE /api/notes/:id
```

## Environment Variables

The backend supports these environment variables:

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | Backend server port inside the container | `3000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/notes_app` |

In local Docker Compose, `MONGO_URI` is set to:

```text
mongodb://mongo:27017/notes_app
```

## Docker Details

The backend Docker image:

- Uses `node:24-alpine`
- Installs production dependencies with `npm ci --omit=dev`
- Copies backend files
- Copies frontend files
- Starts the app with `node index.js`

Build manually:

```bash
docker build -f backend/Dockerfile -t notes-app .
```

Run manually:

```bash
docker run -p 3000:3000 \
  -e MONGO_URI="mongodb://host.docker.internal:27017/notes_app" \
  notes-app
```

For normal usage, prefer Docker Compose because it starts MongoDB too.

## GitHub Actions

This project has two workflows.

### Node.js CI

File:

```text
.github/workflows/node.yml
```

Runs on pushes and pull requests to `main`.

It performs:

1. Checkout repository
2. Setup Node.js 24
3. Install backend dependencies
4. Run backend tests
5. Build Docker image

### Deploy Notes App

File:

```text
.github/workflows/deploy.yml
```

Runs on pushes to `main` and manual workflow dispatch.

It performs:

1. Checkout repository
2. Setup Node.js 24
3. Install dependencies
4. Run tests
5. Configure AWS credentials
6. Create ECR repository if it does not exist
7. Login to Amazon ECR
8. Build Docker image
9. Push image to ECR
10. SSH into EC2
11. Pull latest image on EC2
12. Restart the app using Docker Compose

## Required GitHub Secrets

Add these secrets in GitHub:

```text
Repository -> Settings -> Secrets and variables -> Actions -> New repository secret
```

Required secrets:

| Secret | Description |
| --- | --- |
| `AWS_ACCESS_KEY_ID` | AWS access key for pushing to ECR |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for pushing to ECR |
| `AWS_REGION` | AWS region, for example `ap-south-1` |
| `ECR_REPOSITORY` | ECR repository name, for example `notes-app` |
| `EC2_HOST` | Public IP or DNS of your EC2 instance |
| `EC2_USER` | SSH username, usually `ubuntu` for Ubuntu EC2 |
| `EC2_SSH_KEY` | Private SSH key used to connect to EC2 |

## AWS Setup

### 1. Create An EC2 Instance

Use an Ubuntu EC2 instance.

Recommended inbound rules:

| Type | Port | Source |
| --- | --- | --- |
| SSH | `22` | Your IP |
| HTTP | `80` | Anywhere |
| HTTPS | `443` | Anywhere, optional |

### 2. Install Docker And Nginx On EC2

SSH into your EC2 instance:

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

Install required packages:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin nginx
sudo usermod -aG docker $USER
newgrp docker
```

Check Docker:

```bash
docker --version
docker compose version
```

### 3. Configure Nginx

Copy the Nginx config from this repository:

```bash
sudo nano /etc/nginx/sites-available/notes-app
```

Paste the contents from:

```text
nginx/notes-app.conf
```

Enable the site:

```bash
sudo ln -sf /etc/nginx/sites-available/notes-app /etc/nginx/sites-enabled/notes-app
sudo nginx -t
sudo systemctl restart nginx
```

The Nginx config proxies traffic from port `80` to the app running on:

```text
127.0.0.1:3000
```

## Production Deployment

After setup, deployment happens automatically when you push to `main`:

```bash
git add .
git commit -m "Your message"
git push origin main
```

GitHub Actions will build and deploy the new version.

On EC2, the app is deployed under:

```text
~/notes-app
```

The production Compose file created by the workflow runs:

- `notes-backend`
- `notes-mongo`

The backend container is bound to localhost only:

```text
127.0.0.1:3000:3000
```

That means public traffic should go through Nginx.

## Useful EC2 Commands

Check running containers:

```bash
docker ps
```

View app logs:

```bash
docker logs notes-backend
```

View MongoDB logs:

```bash
docker logs notes-mongo
```

Restart containers:

```bash
cd ~/notes-app
docker compose up -d
```

Stop containers:

```bash
cd ~/notes-app
docker compose down
```

Check Nginx:

```bash
sudo nginx -t
sudo systemctl status nginx
```

Restart Nginx:

```bash
sudo systemctl restart nginx
```

## Troubleshooting

### Port 3000 Is Already In Use Locally

Run the app on another local port:

```bash
APP_PORT=3001 docker compose up --build
```

Then open:

```text
http://localhost:3001
```

### Frontend Opens But Notes Do Not Load

Make sure the backend and MongoDB containers are running:

```bash
docker compose ps
```

Check the health endpoint:

```bash
curl http://localhost:3000/health
```

If you started the app with `APP_PORT=3001`, use:

```bash
curl http://localhost:3001/health
```

### GitHub Actions Fails On ECR Login

Check these secrets:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
ECR_REPOSITORY
```

Also confirm the AWS user has permission for ECR actions such as:

```text
ecr:GetAuthorizationToken
ecr:CreateRepository
ecr:DescribeRepositories
ecr:PutImage
ecr:InitiateLayerUpload
ecr:UploadLayerPart
ecr:CompleteLayerUpload
ecr:BatchCheckLayerAvailability
```

### GitHub Actions Fails On EC2 SSH

Check these secrets:

```text
EC2_HOST
EC2_USER
EC2_SSH_KEY
```

Make sure:

- The EC2 instance is running.
- Security group allows SSH on port `22`.
- `EC2_USER` is correct. For Ubuntu, it is usually `ubuntu`.
- `EC2_SSH_KEY` contains the full private key, including `BEGIN` and `END` lines.

### App Is Not Opening On EC2 Public IP

Check:

- EC2 security group allows inbound HTTP on port `80`.
- Nginx is running.
- Docker containers are running.
- The backend container is listening on `127.0.0.1:3000`.

Useful commands:

```bash
docker ps
curl http://127.0.0.1:3000/health
sudo nginx -t
sudo systemctl status nginx
```

### Database Is Empty After Restart

MongoDB data is stored in a Docker volume named `mongo-data`. If you run:

```bash
docker compose down -v
```

the volume is deleted and data will be removed.

## Learning Outcomes

By completing this project, you practice:

- Git and GitHub workflow
- Node.js API development
- MongoDB integration
- Docker image creation
- Multi-container setup with Docker Compose
- Automated testing
- GitHub Actions CI
- GitHub Actions CD
- AWS ECR container registry
- AWS EC2 deployment
- Nginx reverse proxy basics
- Debugging deployment failures

## Future Improvements

- Add user authentication
- Add HTTPS with Certbot and Let's Encrypt
- Add a React frontend
- Add request validation with a library such as Zod
- Add centralized logging
- Add monitoring and alerts
- Add MongoDB backups
- Add a staging environment

## Author

Harsha Vardhan
