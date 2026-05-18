require('dotenv').config();
const cluster = require('cluster');
const os = require('os');

const WORKERS = Math.min(os.cpus().length, 4); // cap at 4 to leave headroom

if (cluster.isPrimary) {
  console.log(`[cluster] Primary ${process.pid} starting ${WORKERS} workers`);

  for (let i = 0; i < WORKERS; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.warn(`[cluster] Worker ${worker.process.pid} exited (code=${code}, signal=${signal}). Restarting…`);
    cluster.fork();
  });

  cluster.on('online', (worker) => {
    console.log(`[cluster] Worker ${worker.process.pid} online`);
  });
} else {
  // Each worker runs the full server
  require('./index');
}
