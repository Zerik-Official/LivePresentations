# AWS Deployment (1 EC2)

Everything runs with Docker on a single EC2 instance:

```text
Internet ──80──▶ EC2 (Security Group: 80 public, 22 only your IP)
                 └─ Docker
                    ├─ web      Nginx: serves the frontend and forwards /api, /ws, /static, /docs
                    └─ backend  FastAPI + SQLite (backend_instance volume), no public ports
```

The frontend and the API share the same origin, so no `VITE_BACKEND_URL` or CORS setup is needed.

## 1. Security Group

| Port | Source | Purpose |
|---|---|---|
| 80/TCP | `0.0.0.0/0` | The application |
| 22/TCP | `My IP` | SSH |
| 443/TCP | `0.0.0.0/0` | Only if you configure HTTPS |

## 2. Launch the EC2 instance

- AMI: **Amazon Linux 2023**, type `t3.micro` or `t3.small` (the frontend build is tight on 1 GiB; see note in §3).
- Disk: 16 GiB gp3.
- Public subnet with a public IP, and the Security Group above.
- *Advanced details → User data*:

```bash
#!/bin/bash
dnf install -y docker git
systemctl enable --now docker
usermod -aG docker ec2-user
mkdir -p /usr/local/lib/docker/cli-plugins
curl -fsSL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m) \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
V=$(curl -fsSL https://api.github.com/repos/docker/buildx/releases/latest | grep -m1 tag_name | cut -d '"' -f4)
A=$([ "$(uname -m)" = "aarch64" ] && echo arm64 || echo amd64)
curl -fsSL https://github.com/docker/buildx/releases/download/$V/buildx-$V.linux-$A \
  -o /usr/local/lib/docker/cli-plugins/docker-buildx
chmod +x /usr/local/lib/docker/cli-plugins/*
# 2 GiB swap so the frontend build does not run out of memory on t3.micro
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile swap swap defaults 0 0' >> /etc/fstab
```

## 3. Deploy

```bash
ssh -i lp-key.pem ec2-user@<PUBLIC_IP>
docker compose version        # if it fails, wait for user data to finish

git clone https://github.com/Zerik-Official/LivePresentations.git
cd LivePresentations/deploy/aws
cp .env.example .env
sed -i "s/^SECRET_KEY=.*/SECRET_KEY=$(openssl rand -hex 32)/" .env
docker compose up -d --build   # the first build takes a few minutes
docker compose ps              # backend "healthy", web "Up"
```

Open `http://<PUBLIC_IP>`.

> If `deploy/aws` is not in the repo yet, copy it from your PC:
> `scp -i lp-key.pem -r deploy/aws ec2-user@<PUBLIC_IP>:~/LivePresentations/deploy/`

## 4. Verify

```bash
curl http://<PUBLIC_IP>/health        # {"status":"ok"}
curl -m 5 http://<PUBLIC_IP>:8000     # must fail: the backend is not exposed
```

In the browser: sign up, create a presentation, upload an image, create a room, and open the controller QR on your phone.

## 5. Operation

```bash
docker compose logs -f backend                     # logs
git pull && docker compose up -d --build           # update
docker compose down                                # stop (data stays in the volume)
docker run --rm -v aws_backend_instance:/d -v $PWD:/b alpine tar czf /b/backup.tgz -C /d .   # backup
```

Data (SQLite and uploaded files) lives in the `aws_backend_instance` volume. `docker compose down -v` deletes it.

## 6. HTTPS (optional)

Port 80 is fine for the demo. For HTTPS you need a domain pointing to the IP (`<IP>.nip.io` works) and port 443 open. The simplest way is to put Certbot or Caddy in front of the `web` container.

## 7. When finished

Terminate the EC2 instance and release the Elastic IP if you allocated one. A public IP associated with a stopped instance is billed per hour even if the EC2 is Free Tier.
