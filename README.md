# ServerFlow

ServerFlow is a custom-built load balancer written in TypeScript. It provides essential load balancing features such as request distribution, health checks, session persistence, and logging. This project aims to distribute incoming requests across multiple backend servers efficiently while ensuring that only healthy servers handle traffic.

## Features

- **Request Distribution**: Distribute incoming requests across multiple backend servers using a chosen algorithm.
- **Health Checks**: Monitor backend servers and only send traffic to healthy ones.
- **Session Persistence**: Ensure requests from the same client IP are consistently routed to the same backend server.
- **Logging**: Keep track of requests and server health status.
- **Dynamic Server Management**: Add or remove backend servers dynamically.


## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/sahilrohera10/ServerFlow
    cd ServerFlow
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Ensure you have TypeScript and `ts-node` installed:

    ```bash
    npm install -g typescript ts-node
    ```

## Configuration

### Backend Servers

Define the backend servers in your code. You can add or remove servers dynamically using the provided endpoints.

### Health Check Endpoint

Each backend server should have a `/health` endpoint that returns a status of `200 OK` if the server is healthy.

## Running the Load Balancer

To start the load balancer, run:

```bash
npm start
