import axios from "axios";
import { healthMap, servers, sessionMap } from "..";

// generates a hash code value for a client ip address
export function GENERATE_IP_HASH(client_ip: string): number {
  let hash = 0;
  for (let i = 0; i < client_ip.length; i++) {
    const char = client_ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  return hash;
}

// get a sessioned server or a new alloted server for a client ip address
export function GET_SERVER_FOR_CLIENT(client_ip: string): string {
  if (sessionMap[client_ip]) {
    // if the client is not new and we have its session already then provide this client with the same server.
    return sessionMap[client_ip];
  }

  // if the client is new and we dont have its session
  const server_list_len = servers.length;
  const serverIndex = Math.abs(GENERATE_IP_HASH(client_ip)) % server_list_len;

  // got a server for the new client
  const alloted_server = servers[serverIndex];

  // now mapped the client with this server for maintaining a session
  sessionMap[client_ip] = alloted_server;

  return alloted_server;
}

// performs the health of the every server present in the list
export function PERFORM_HEALTH_CHECK() {
  servers.forEach((server) => {
    axios
      .get(`${server}/v1/api/save/1`)
      .then((response) => {
        if (response.status === 200) {
          healthMap[server] = true;
          console.log("All servers are healthy");
        } else {
          healthMap[server] = false;
          console.log(`Unhealthy server => ${server}`);
        }
      })
      .catch(() => {
        healthMap[server] = false;
        console.log(`Unhealthy server => ${server}`);
      });
  });
}

// getting a healthy server for a client ip

export function GET_A_HEALTHY_SERVER(client_ip: string) {
  let server = GET_SERVER_FOR_CLIENT(client_ip);

  // if the server is found to be healthy then directly return that particular server
  if (healthMap[server]) return server;

  // if the server is unhealthy then we must return some other healthy server

  let attempt = 0;
  const server_list_len = servers.length;

  while (attempt < server_list_len) {
    const new_Server_index = (servers.indexOf(server) + 1) % server_list_len;
    server = servers[new_Server_index];

    if (healthMap[server]) return server;

    attempt++;
  }

  return null;
}
