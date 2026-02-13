# Redis Setup for Windows

## Option 1: Run Without Redis (Recommended for Development)

Add this to your `.env` file:
```
DISABLE_REDIS=true
```

The application will work perfectly without Redis - it just won't have caching.

## Option 2: Install Redis on Windows

### Using WSL2 (Recommended)
1. Install WSL2: `wsl --install`
2. Open WSL terminal
3. Install Redis:
   ```bash
   sudo apt update
   sudo apt install redis-server
   sudo service redis-server start
   ```

### Using Docker (Easiest)
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

### Using Memurai (Native Windows)
1. Download from: https://www.memurai.com/get-memurai
2. Install and start the service
3. Redis will be available on `localhost:6379`

## Verify Redis is Running
```bash
# Test connection
redis-cli ping
# Should return: PONG
```

## Environment Variables
Add to `.env` if using custom Redis:
```
REDIS_URL=redis://localhost:6379
```
