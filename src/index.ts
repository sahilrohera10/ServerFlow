import express, { NextFunction, Request, Response } from "express";
import axios from "axios";
import schedule from "node-schedule";
import { GET_A_HEALTHY_SERVER, PERFORM_HEALTH_CHECK } from "./utils/utils";
const app = express();
const https = require("https");

const PORT = 8000;

interface session {
  ip: string;
  server: string;
}

// here we have a list of distributed servers, for which the load balancer shall be implemented
export const servers: string[] = [
  "https://ticketplus-backend.onrender.com",
  "https://ticketplus-backend-vs3y.onrender.com",
  "https://ticketplus-backend-t1m3.onrender.com",
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
app.use((req: Request, res: Response, next: NextFunction) => {
  const adminPaths = ["/add-server", "/remove-server"];
  if (adminPaths.includes(req.originalUrl)) {
    next();
    return;
  }

  // get the client ip address from the request
  const client_ip = req.socket.remoteAddress || "";

  const server = GET_A_HEALTHY_SERVER(client_ip);

  console.log("got healthy server => ", server);

  if (!server) {
    res.status(503).send("Service unavailable");
    return;
  }

  // create the endpoint which is supposed to get hit by client
  const target_url = `${server}${req.originalUrl}`;

  console.log({
    method: req.method,
    url: target_url,
    headers: req.headers,
    data: req.body,
  });

  axios({
    method: req.method,
    url: target_url,
    headers: req.headers,
    data: req.body,
  })
    .then((response) => {
      return res.status(response.status).json(response.data);
    })
    .catch((error) => {
      console.error("Error forwarding request:", error);
      return res.status(502).send("Bad Gateway");
    });
});

// Endpoint to add a new backend server
app.post("/add-server", express.json(), (req: Request, res: Response) => {
  const { server } = req.body;
  if (servers.includes(server)) {
    return res.status(400).send("Server already exists.");
  }
  servers.push(server);
  healthMap[server] = true;
  res.status(200).send("Server added successfully.");
});

// Endpoint to remove a backend server
app.post("/remove-server", express.json(), (req: Request, res: Response) => {
  const { server } = req.body;
  const index = servers.indexOf(server);
  if (index === -1) {
    return res.status(400).send("Server not found.");
  }

  server.splice(index, 1);
  delete healthMap[server];

  // Clean up session map entries pointing to the removed server
  Object.keys(sessionMap).forEach((clientIp) => {
    if (sessionMap[clientIp] === server) {
      delete sessionMap[clientIp];
    }
  });

  res.status(200).send("Server removed successfully.");
});

app.listen(PORT, () => {
  console.log(`ServerFlow is running on port ${PORT}`);
});
