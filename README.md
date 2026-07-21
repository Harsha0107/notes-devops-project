# Notes App CI/CD

A full-stack notes app for learning Git, GitHub Actions, Docker, MongoDB, AWS EC2, and Nginx.

## Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: MongoDB
- Containers: Docker, Docker Compose
- CI/CD: GitHub Actions
- Deployment: Amazon ECR, AWS EC2, Nginx

## Run Locally

```bash
docker compose up --build
```

Open `http://localhost:3000`.

Useful checks:

```bash
cd backend
npm install
npm test
```

## API

- `GET /health`
- `GET /api/notes`
- `POST /api/notes`
- `PUT /api/notes/:id`
- `DELETE /api/notes/:id`

Example body:

```json
{
  "title": "Deploy checklist",
  "content": "Build image, push to ECR, restart EC2 containers."
}
```

## GitHub Secrets

Add these in GitHub: Repository Settings -> Secrets and variables -> Actions.

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
ECR_REPOSITORY
EC2_HOST
EC2_USER
EC2_SSH_KEY
```

`ECR_REPOSITORY` can be something like `notes-app`.

## EC2 Setup

Launch an Ubuntu EC2 instance, open inbound ports `22`, `80`, and optionally `443`.

Install Docker and Nginx:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin nginx
sudo usermod -aG docker $USER
newgrp docker
```

Copy the Nginx config:

```bash
sudo cp nginx/notes-app.conf /etc/nginx/sites-available/notes-app
sudo ln -sf /etc/nginx/sites-available/notes-app /etc/nginx/sites-enabled/notes-app
sudo nginx -t
sudo systemctl restart nginx
```

After you push to `main`, GitHub Actions will:

1. Install dependencies.
2. Run API tests.
3. Build the Docker image.
4. Push it to Amazon ECR.
5. SSH into EC2.
6. Pull the newest image and restart the app with Docker Compose.

## Production Notes

The app container listens on `127.0.0.1:3000` in production. Nginx receives public traffic on port `80` and proxies it to the app.
