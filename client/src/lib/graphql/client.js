import {
  ApolloClient,
  ApolloLink,
  concat,
  createHttpLink,
  InMemoryCache,
  split,
} from "@apollo/client";
import { getAccessToken } from "../auth";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient as createWsClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { Kind, OperationTypeNode } from "graphql";
// const httpLink = createHttpLink({ uri: "http://localhost:9000/graphql" });

const authLink = new ApolloLink((operation, forward) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    operation.setContext({
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }
  return forward(operation);
});

//this http link will be used for queries and subscriptions
const httpLink = concat(
  authLink,
  createHttpLink({ uri: "http://localhost:9000/graphql" })
);
//can process Graphql over websockets requests
//wsLink will be used for subscriptions
const wsLink = new GraphQLWsLink(
  createWsClient({
    url: "ws://localhost:9000/graphql",
    connectionParams: () => ({ accessToken: getAccessToken() }), //dynamycally send accessToken everytime server listens to subscription event
  })
);
//connectionParams is used if we want to send some extra data to server with subscription
export const apolloClient = new ApolloClient({
  link: split(isSubscription, wsLink, httpLink),
  cache: new InMemoryCache(),
});

function isSubscription(operation) {
  const definition = getMainDefinition(operation.query);
  console.log(
    "!!isSubscription",
    definition.kind === Kind.OPERATION_DEFINITION &&
      definition.operation === OperationTypeNode.SUBSCRIPTION
  );
  return (
    definition.kind === Kind.OPERATION_DEFINITION &&
    definition.operation === OperationTypeNode.SUBSCRIPTION
  );
}
