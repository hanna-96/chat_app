import { GraphQLError } from "graphql";
import { createMessage, getMessages } from "./db/messages.js";
import { PubSub } from "graphql-subscriptions";

const pubSub = new PubSub(); //publish and subscribe

export const resolvers = {
  Query: {
    messages: (_root, _args, { user }) => {
      if (!user) throw unauthorizedError();
      return getMessages();
    },
  },

  Mutation: {
    addMessage: async (_root, { text }, { user }) => {
      if (!user) throw unauthorizedError();
      const message = await createMessage(user, text);
      pubSub.publish("MESSAGE_ADDED", { messageAdded: message });
      //listening to the subscription and sending the new message to all users who subcsribed
      return message;
    },
  },
  Subscription: {
    messageAdded: {
      subscribe: (_root, _args, context) => {
        console.log("context", context);
        const { user } = context;
        if (!user) throw unauthorizedError();
        return pubSub.asyncIterator("MESSAGE_ADDED"); //listens to MESSAGE_ADDED event
      },
    },
  },
};

function unauthorizedError() {
  return new GraphQLError("Not authenticated", {
    extensions: { code: "UNAUTHORIZED" },
  });
}
