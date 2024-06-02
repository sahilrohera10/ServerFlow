import express, { NextFunction, Request, Response } from "express";
import axios from "axios";
import schedule from "node-schedule";
import { GET_A_HEALTHY_SERVER, PERFORM_HEALTH_CHECK } from "./utils/utils";
const app = express();

const PORT = 8000;

interface session {
  ip: string;
  server: string;
}

// here we have a list of distributed servers, for which the load balancer shall be implemented
export const servers: string[] = [
  "http://localhost:8001",
  "http://localhost:8002",
];

export const sessionMap: { [key: string]: string } = {}; // an object that contains ip as key and a corresponding server address
export const healthMap: { [key: string]: boolean } = {}; // an object which marks every server with a bool value (true/false) for their health.

// lets map all the servers present in the list as healthy for initial setup
// instead could use forEach as well
for (let i = 0; i < servers.length; i++) {
  healthMap[servers[i]] = true;
}

// perform a health check initially
PERFORM_HEALTH_CHECK();

// Now schedule a health check process for every 14 mins
schedule.scheduleJob("*/14 * * * *", PERFORM_HEALTH_CHECK);

// middleware to log the incoming request
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(
    `Incoming request from ${req.socket.remoteAddress} to ${req.originalUrl}`
  );

  next();
});

// middleware that handles the incoming client's requests
app.use((req: Request, res: Response) => {
  // get the client ip address from the request
  const client_ip = req.socket.remoteAddress || "";

  const server = GET_A_HEALTHY_SERVER(client_ip);

  if (!server) {
    res.status(503).send("Service unavailable");
    return;
  }

  // create the endpoint which is supposed to get hit by client
  const target_url = `${server}${req.originalUrl}`;

  axios({
    method: req.method,
    url: target_url,
    headers: req.headers,
    data: req.body,
  })
    .then((response) => {
      return res.status(response.status).json(response.data);
    })
    .catch(() => {
      return res.status(502).send("Bad Gateway");
    });
});

app.listen(PORT, () => {
  console.log(`ServerFlow is running on port ${PORT}`);
});
