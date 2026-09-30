# Despliegue en AWS (1 EC2)

Todo corre con Docker en una sola EC2:

```text
Internet ──80──▶ EC2 (Security Group: 80 público, 22 solo tu IP)
                 └─ Docker
                    ├─ web      Nginx: sirve el frontend y reenvía /api, /ws, /static, /docs
                    └─ backend  FastAPI + SQLite (volumen backend_instance), sin puertos públicos
```

El frontend y la API comparten dominio, así que no hace falta configurar `VITE_BACKEND_URL` ni CORS.

## 1. Security Group

| Puerto | Origen | Para qué |
|---|---|---|
| 80/TCP | `0.0.0.0/0` | La aplicación |
| 22/TCP | `Mi IP` | SSH |
| 443/TCP | `0.0.0.0/0` | Solo si configuran HTTPS |

## 2. Lanzar la EC2

- AMI: **Amazon Linux 2023**, tipo `t3.micro` o `t3.small` (el build del frontend va justo con 1 GiB; ver nota en §3).
- Disco: 16 GiB gp3.
- Subnet pública con IP pública, y el Security Group de arriba.
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
# swap de 2 GiB para que el build del frontend no se quede sin memoria en t3.micro
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile swap swap defaults 0 0' >> /etc/fstab
```

## 3. Desplegar

```bash
ssh -i lp-key.pem ec2-user@<IP_PUBLICA>
docker compose version        # si falla, espera a que termine el user data

git clone https://github.com/Zerik-Official/LivePresentations.git
cd LivePresentations/deploy/aws
cp .env.example .env
sed -i "s/^SECRET_KEY=.*/SECRET_KEY=$(openssl rand -hex 32)/" .env
docker compose up -d --build   # el primer build tarda unos minutos
docker compose ps              # backend "healthy", web "Up"
```

Abrir `http://<IP_PUBLICA>`.

> Si `deploy/aws` aún no está en el repo, cópienlo desde el PC:
> `scp -i lp-key.pem -r deploy/aws ec2-user@<IP_PUBLICA>:~/LivePresentations/deploy/`

## 4. Comprobar

```bash
curl http://<IP_PUBLICA>/health        # {"status":"ok"}
curl -m 5 http://<IP_PUBLICA>:8000     # debe fallar: el backend no está expuesto
```

En el navegador: registrarse, crear una presentación, subir una imagen, crear una sala y abrir el QR del controlador en el móvil.

## 5. Operación

```bash
docker compose logs -f backend                     # logs
git pull && docker compose up -d --build           # actualizar
docker compose down                                # parar (los datos quedan en el volumen)
docker run --rm -v aws_backend_instance:/d -v $PWD:/b alpine tar czf /b/backup.tgz -C /d .   # backup
```

Los datos (SQLite y archivos subidos) viven en el volumen `aws_backend_instance`. `docker compose down -v` los borra.

## 6. HTTPS (opcional)

El puerto 80 funciona para la demo. Para HTTPS se necesita un dominio que apunte a la IP (sirve `<IP>.nip.io`) y abrir el 443. La forma más simple es poner Certbot o Caddy delante del contenedor `web`.

## 7. Al terminar

Terminar la EC2 y liberar la Elastic IP si asignaron una. Una IP pública asociada a una instancia cobra por hora aunque la EC2 sea Free Tier.
