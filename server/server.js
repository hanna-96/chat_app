import { ApolloServer } from "@apollo/server";
import { expressMiddleware as apolloMiddleware } from "@apollo/server/express4";
import cors from "cors";
import express from "express";
import { readFile } from "node:fs/promises";
import { authMiddleware, decodeToken, handleLogin } from "./auth.js";
import { resolvers } from "./resolvers.js";
import { WebSocketServer } from "ws";
import { createServer as createHttpServer } from "node:http";
import { useServer as useWsServer } from "graphql-ws/lib/use/ws"; //adds suport to graphql over websocket
import { makeExecutableSchema } from "@graphql-tools/schema";
const PORT = 9000;

const app = express();
app.use(cors(), express.json());

app.post("/login", handleLogin);

function getHttpContext({ req }) {
  if (req.auth) {
    return { user: req.auth.sub };
  }
  return {};
}
//connectionParams will be coming from client.js(where we set accesssToken)
function getWsContext({ connectionParams }) {
  console.log("!connectionParams", connectionParams);

  const accessToken = connectionParams?.accessToken;
  if (accessToken) {
    const payload = decodeToken(accessToken);
    console.log("!payload", payload);
    return { user: payload.sub };
  }
  return {};
}

const typeDefs = await readFile("./schema.graphql", "utf8");
const schema = makeExecutableSchema({ typeDefs, resolvers });

const apolloServer = new ApolloServer({ schema });

await apolloServer.start();
app.use(
  "/graphql",
  authMiddleware,
  apolloMiddleware(apolloServer, {
    context: getHttpContext,
  })
);

//lets add support for websockets
const httpServer = createHttpServer(app);
const wsServer = new WebSocketServer({ server: httpServer, path: "/graphql" }); //implements low lwvel websocket protocol
useWsServer({ schema, context: getWsContext }, wsServer); //adds graphql functionality on top websocket

httpServer.listen({ port: PORT }, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
});
