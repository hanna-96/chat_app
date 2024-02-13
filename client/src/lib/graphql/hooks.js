import { useMutation, useQuery, useSubscription } from "@apollo/client";
import {
  addMessageMutation,
  messagesQuery,
  messageAddedSubscription,
} from "./queries";

export function useAddMessage() {
  const [mutate] = useMutation(addMessageMutation);

  const addMessage = async (text) => {
    const {
      data: { message },
    } = await mutate({
      variables: { text },
    });
    return message;
  };

  return { addMessage };
}

export function useMessages() {
  // console.log("inside useMessages");
  const { data } = useQuery(messagesQuery);
  useSubscription(messageAddedSubscription, {
    onData: ({ data, client }) => {
      console.log("onData", data);
      const newMessage = data.data.message;
      //updates the existing data that is cached from  get messages query to  include and cache newly added message

      client.cache.updateQuery({ query: messagesQuery }, (oldData) => {
        return { messages: [...oldData.messages, newMessage] };
      });
    },
  });
  //onData function will be called for every notificstion
  return {
    messages: data?.messages ?? [],
  };
}
